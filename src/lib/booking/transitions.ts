import 'server-only'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import type { BookingRow } from './types'

/**
 * Payment succeeded for this booking → confirm it and mark the slot booked.
 * Idempotent: safe to call from the webhook AND the success page.
 *
 * Conflict case (last-resort safety net): the DB hold is synced to the Stripe
 * session's expires_at, so under normal operation a slot can't be taken over
 * while its session is still payable. The only way to get here is a payment
 * completing in the final seconds before expiry with the webhook arriving
 * after someone else has re-held and paid for the slot. We can't give them the
 * slot, so we refund and leave the booking cancelled.
 */
export async function confirmBooking(
  booking: BookingRow,
  paymentIntentId: string | null,
): Promise<{ ok: true; booking: BookingRow } | { ok: false; reason: 'conflict' | 'cancelled' }> {
  const sb = getSupabaseAdmin()

  if (booking.status === 'confirmed') return { ok: true, booking }

  if (booking.status === 'cancelled') {
    // Cancelled before payment landed (hold taken over / session expired) but
    // the customer still paid — refund so we don't keep money for no slot.
    await refundIfPaid(paymentIntentId)
    return { ok: false, reason: 'cancelled' }
  }

  // Try to take the slot. Fails only if someone else already confirmed it.
  const { data: slot } = await sb
    .from('slots')
    .update({ status: 'booked', held_until: null })
    .eq('id', booking.slot_id)
    .neq('status', 'booked')
    .select('id')
    .maybeSingle()

  if (!slot) {
    // Slot already booked. Is it *this* booking (re-delivered webhook)?
    const { data: existing } = await sb
      .from('bookings')
      .select('id')
      .eq('slot_id', booking.slot_id)
      .eq('status', 'confirmed')
      .maybeSingle()
    if (existing?.id === booking.id) return { ok: true, booking: { ...booking, status: 'confirmed' } }

    await sb.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
    await refundIfPaid(paymentIntentId)
    return { ok: false, reason: 'conflict' }
  }

  const { data: updated, error } = await sb
    .from('bookings')
    .update({ status: 'confirmed', stripe_payment_intent_id: paymentIntentId })
    .eq('id', booking.id)
    .select('*')
    .single()
  if (error) throw error

  return { ok: true, booking: updated as BookingRow }
}

/**
 * Checkout abandoned / expired / taken over → cancel the pending booking and
 * put the slot back to 'open' if this booking still holds it.
 */
export async function releaseBooking(booking: BookingRow): Promise<void> {
  if (booking.status !== 'pending') return
  const sb = getSupabaseAdmin()

  await sb.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)

  // If another customer has since taken over this slot (their booking is
  // pending), the hold is theirs now — leave it alone.
  const { data: other } = await sb
    .from('bookings')
    .select('id')
    .eq('slot_id', booking.slot_id)
    .eq('status', 'pending')
    .neq('id', booking.id)
    .limit(1)
    .maybeSingle()
  if (other) return // someone else is mid-checkout on this slot; leave their hold alone

  await sb
    .from('slots')
    .update({ status: 'open', held_until: null })
    .eq('id', booking.slot_id)
    .eq('status', 'held')
}

export async function getBookingBySessionId(sessionId: string): Promise<BookingRow | null> {
  const { data } = await getSupabaseAdmin()
    .from('bookings')
    .select('*')
    .eq('stripe_session_id', sessionId)
    .maybeSingle()
  return (data as BookingRow) ?? null
}

async function refundIfPaid(paymentIntentId: string | null) {
  if (!paymentIntentId) return
  try {
    await getStripe().refunds.create({ payment_intent: paymentIntentId })
  } catch (err) {
    // Already refunded / not captured — log and move on; the organizer can refund manually.
    console.error('[booking] refund failed for', paymentIntentId, err)
  }
}
