import 'server-only'
import type Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import type { BookingRow, EventRow, SlotRow } from './types'

/** Changes are locked from this many hours before the *event* starts (not the customer's slot). */
export const CHANGE_CUTOFF_HOURS = 24

export interface BookingContext {
  booking: BookingRow
  slot: SlotRow
  event: EventRow
  eventStartsAt: Date
  changesLockAt: Date
  /** true only when status is 'confirmed' AND we're still before the cutoff */
  canModify: boolean
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getBookingContext(bookingId: string): Promise<BookingContext | null> {
  if (!UUID_RE.test(bookingId)) return null
  const sb = getSupabaseAdmin()

  const { data: b } = await sb.from('bookings').select('*').eq('id', bookingId).maybeSingle()
  if (!b) return null
  const booking = b as BookingRow

  const { data: s } = await sb.from('slots').select('*').eq('id', booking.slot_id).single()
  const slot = s as SlotRow
  const { data: e } = await sb.from('events').select('*').eq('id', slot.event_id).single()
  const event = e as EventRow

  const { data: startsAt, error } = await sb.rpc('event_starts_at', { p_event_id: event.id })
  if (error || !startsAt) throw new Error(`event_starts_at failed: ${error?.message ?? 'no result'}`)

  const eventStartsAt = new Date(startsAt as string)
  const changesLockAt = new Date(eventStartsAt.getTime() - CHANGE_CUTOFF_HOURS * 60 * 60 * 1000)
  const canModify = booking.status === 'confirmed' && Date.now() < changesLockAt.getTime()

  return { booking, slot, event, eventStartsAt, changesLockAt, canModify }
}

// ---------------------------------------------------------------------------
// Reschedule
// ---------------------------------------------------------------------------

export type RescheduleResult =
  | { ok: true; slot: SlotRow }
  | { ok: false; code: 'not_found' | 'not_confirmed' | 'cutoff' | 'same_slot' | 'unavailable' | 'error'; message: string }

const RESCHEDULE_ERRORS: Record<string, { code: Exclude<RescheduleResult, { ok: true }>['code']; message: string }> = {
  BOOKING_NOT_FOUND: { code: 'not_found', message: 'Booking not found.' },
  BOOKING_NOT_CONFIRMED: { code: 'not_confirmed', message: 'This booking can’t be changed.' },
  CUTOFF_PASSED: { code: 'cutoff', message: `Changes are no longer available within ${CHANGE_CUTOFF_HOURS} hours of the event.` },
  SAME_SLOT: { code: 'same_slot', message: 'That’s already your slot.' },
  SLOT_UNAVAILABLE: { code: 'unavailable', message: 'Sorry — that slot was just taken. Please pick another.' },
}

/** All-or-nothing move via the reschedule_booking() Postgres function. */
export async function rescheduleBooking(bookingId: string, newSlotId: string): Promise<RescheduleResult> {
  const { data, error } = await getSupabaseAdmin().rpc('reschedule_booking', {
    p_booking_id: bookingId,
    p_new_slot_id: newSlotId,
    p_cutoff_hours: CHANGE_CUTOFF_HOURS,
  })
  if (error) {
    const known = RESCHEDULE_ERRORS[error.message]
    if (known) return { ok: false, ...known }
    console.error('[manage] reschedule_booking failed', error)
    return { ok: false, code: 'error', message: 'Could not move your booking. Please try again.' }
  }
  return { ok: true, slot: data as SlotRow }
}

// ---------------------------------------------------------------------------
// Cancel + partial refund
// ---------------------------------------------------------------------------

export type CancelResult =
  | { ok: true; refundCents: number; feeCents: number }
  | { ok: false; code: 'not_modifiable' | 'no_payment' | 'fee_unavailable' | 'refund_failed' | 'db_failed'; message: string }

/**
 * Refund everything except Stripe's *actual* processing fee, then cancel the
 * booking and free the slot. The fee is read from the charge's balance
 * transaction — Stripe keeps it on refunds, so this is what the customer
 * forfeits and the organizer is left exactly whole.
 *
 * Ordering: refund first; only on success do we touch booking/slot state.
 */
export async function cancelBookingWithRefund(ctx: BookingContext): Promise<CancelResult> {
  const { booking, slot } = ctx
  if (!ctx.canModify) {
    return { ok: false, code: 'not_modifiable', message: `Changes are no longer available within ${CHANGE_CUTOFF_HOURS} hours of the event.` }
  }
  if (!booking.stripe_payment_intent_id) {
    return { ok: false, code: 'no_payment', message: 'No payment is recorded on this booking. Please contact us.' }
  }

  const stripe = getStripe()

  // 1. Real fee: payment intent → latest charge → balance transaction → fee.
  let charge: Stripe.Charge
  let feeCents: number
  try {
    const pi = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id, {
      expand: ['latest_charge.balance_transaction'],
    })
    if (!pi.latest_charge || typeof pi.latest_charge === 'string') throw new Error('latest_charge not expanded')
    charge = pi.latest_charge
    const bt = charge.balance_transaction
    if (!bt || typeof bt === 'string') {
      // Balance transaction can lag the charge by a moment right after payment.
      return { ok: false, code: 'fee_unavailable', message: 'Stripe hasn’t finalized this payment yet. Please try again in a minute.' }
    }
    feeCents = bt.fee
  } catch (err) {
    console.error('[manage] fee lookup failed', booking.id, err)
    return { ok: false, code: 'fee_unavailable', message: 'Could not look up the payment. Please try again.' }
  }

  // 2. Refund = what was actually charged (minus anything already refunded) minus the fee.
  const refundable = charge.amount - charge.amount_refunded
  const refundCents = Math.max(0, Math.min(refundable, charge.amount - feeCents))
  if (charge.amount !== booking.amount_cents) {
    console.warn('[manage] charge amount differs from booking amount', { booking: booking.id, charge: charge.amount, booking_amount: booking.amount_cents })
  }

  let refundId: string | null = null
  if (refundCents > 0) {
    try {
      const refund = await stripe.refunds.create(
        {
          payment_intent: booking.stripe_payment_intent_id,
          amount: refundCents,
          reason: 'requested_by_customer',
          metadata: { booking_id: booking.id, fee_withheld_cents: String(feeCents) },
        },
        // Same booking → same key, so a retry can't double-refund.
        { idempotencyKey: `cancel-${booking.id}` },
      )
      refundId = refund.id
    } catch (err) {
      console.error('[manage] refund failed', booking.id, err)
      return { ok: false, code: 'refund_failed', message: 'The refund could not be processed. Your booking is unchanged — please try again or contact us.' }
    }
  }

  // 3. Refund is done; now release the booking and slot.
  const sb = getSupabaseAdmin()
  const { error: bErr } = await sb
    .from('bookings')
    .update({ status: 'cancelled', stripe_refund_id: refundId, refund_cents: refundCents })
    .eq('id', booking.id)
    .eq('status', 'confirmed')
  if (bErr) {
    // Money is refunded but the row didn't flip. Loud log so it can be fixed by hand.
    console.error('[manage] REFUNDED BUT BOOKING NOT CANCELLED — fix manually', { booking: booking.id, refundId, refundCents }, bErr)
    return { ok: false, code: 'db_failed', message: 'Your refund was issued but we hit an error updating the booking. Please contact us and mention this.' }
  }

  const { error: sErr } = await sb
    .from('slots')
    .update({ status: 'open', held_until: null })
    .eq('id', slot.id)
    .eq('status', 'booked')
  if (sErr) console.error('[manage] slot release failed after cancel', slot.id, sErr)

  return { ok: true, refundCents, feeCents }
}
