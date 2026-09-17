import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { HOLD_MINUTES, totalCents } from '@/lib/booking/pricing'
import { formatEventDate, formatSlotRange } from '@/lib/booking/slots'
import type { BookingRow, EventRow, SlotRow } from '@/lib/booking/types'
import { revalidateBookingPages } from '@/lib/booking/revalidate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Stripe's minimum Checkout session lifetime. HOLD_MINUTES matches it, and
// after the session is created we sync held_until to Stripe's exact expires_at
// so the hold can never lapse while the session is still payable.
const STRIPE_SESSION_TTL_SECONDS = 30 * 60

interface CheckoutBody {
  slotId?: string
  fullName?: string
  email?: string
  phone?: string
  coverFee?: boolean
}

export async function POST(req: Request) {
  let body: CheckoutBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const slotId = String(body.slotId ?? '').trim()
  const fullName = String(body.fullName ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const phone = String(body.phone ?? '').trim()
  const coverFee = Boolean(body.coverFee)

  if (!/^[0-9a-f-]{36}$/i.test(slotId)) return NextResponse.json({ error: 'Invalid slot' }, { status: 400 })
  if (fullName.length < 2 || fullName.length > 120) return NextResponse.json({ error: 'Please enter your full name' }, { status: 400 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({ error: 'Please enter a valid email' }, { status: 400 })
  if (phone.replace(/\D/g, '').length < 7 || phone.length > 40) return NextResponse.json({ error: 'Please enter a valid phone number' }, { status: 400 })

  const sb = getSupabaseAdmin()

  const { data: slotData } = await sb.from('slots').select('*').eq('id', slotId).maybeSingle()
  const slot = slotData as SlotRow | null
  if (!slot) return NextResponse.json({ error: 'Slot not found' }, { status: 404 })
  if (new Date(slot.end_time) <= new Date()) return NextResponse.json({ error: 'That time has already passed' }, { status: 409 })

  const { data: eventData } = await sb.from('events').select('*').eq('id', slot.event_id).single()
  const event = eventData as EventRow

  // 1. Atomically claim the slot (open, or held-but-expired).
  const { data: held, error: holdError } = await sb.rpc('hold_slot', {
    p_slot_id: slotId,
    p_hold_minutes: HOLD_MINUTES,
  })
  if (holdError) {
    console.error('[checkout] hold_slot failed', holdError)
    return NextResponse.json({ error: 'Could not hold that slot. Please try again.' }, { status: 500 })
  }
  if (!held || (held as SlotRow[]).length === 0) {
    return NextResponse.json({ error: 'Sorry — that slot was just taken. Please pick another.' }, { status: 409 })
  }

  // 2. If we took over an expired hold, kill the previous customer's Checkout
  //    so they can't pay for a slot they no longer have.
  await takeoverSlot(slotId)

  // 3. Pending booking row.
  const amountCents = totalCents(event.price_cents, coverFee)
  const { data: bookingData, error: bookingError } = await sb
    .from('bookings')
    .insert({
      slot_id: slotId,
      full_name: fullName,
      email,
      phone,
      amount_cents: amountCents,
      fee_covered: coverFee,
      status: 'pending',
    })
    .select('*')
    .single()
  if (bookingError || !bookingData) {
    console.error('[checkout] booking insert failed', bookingError)
    await sb.from('slots').update({ status: 'open', held_until: null }).eq('id', slotId).eq('status', 'held')
    return NextResponse.json({ error: 'Could not start your booking. Please try again.' }, { status: 500 })
  }
  const booking = bookingData as BookingRow

  // 4. Stripe Checkout with a dynamic amount.
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin
  const slotLabel = `${formatEventDate(event.event_date, event.timezone)} · ${formatSlotRange(slot.start_time, slot.end_time, event.timezone)}`

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: {
              name: `${event.name} — Headshot Session`,
              description: coverFee ? `${slotLabel} (includes processing fee)` : slotLabel,
            },
          },
        },
      ],
      metadata: { booking_id: booking.id, slot_id: slotId, event_id: event.id },
      payment_intent_data: {
        description: `${event.name}: ${slotLabel} — ${fullName}`,
        metadata: { booking_id: booking.id, slot_id: slotId },
      },
      expires_at: Math.floor(Date.now() / 1000) + STRIPE_SESSION_TTL_SECONDS,
      success_url: `${origin}/headshots/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/api/checkout/cancel?session_id={CHECKOUT_SESSION_ID}`,
    })

    revalidateBookingPages(booking.id)
    await Promise.all([
      sb.from('bookings').update({ stripe_session_id: session.id }).eq('id', booking.id),
      sb
        .from('slots')
        .update({ held_until: new Date(session.expires_at * 1000).toISOString() })
        .eq('id', slotId)
        .eq('status', 'held'),
    ])

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[checkout] stripe session create failed', err)
    await sb.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
    await sb.from('slots').update({ status: 'open', held_until: null }).eq('id', slotId).eq('status', 'held')
    return NextResponse.json({ error: 'Payment setup failed. Please try again.' }, { status: 502 })
  }
}

/** Cancel any other pending bookings on this slot and expire their Stripe sessions. */
async function takeoverSlot(slotId: string) {
  const sb = getSupabaseAdmin()
  const { data } = await sb
    .from('bookings')
    .select('id, stripe_session_id')
    .eq('slot_id', slotId)
    .eq('status', 'pending')
  const stale = (data ?? []) as Pick<BookingRow, 'id' | 'stripe_session_id'>[]
  if (stale.length === 0) return

  const stripe = getStripe()
  for (const b of stale) {
    if (b.stripe_session_id) {
      try {
        await stripe.checkout.sessions.expire(b.stripe_session_id)
      } catch {
        // Already expired/completed. If completed, the webhook + confirmBooking()
        // conflict path handles the refund.
      }
    }
    await sb.from('bookings').update({ status: 'cancelled' }).eq('id', b.id).eq('status', 'pending')
  }
}
