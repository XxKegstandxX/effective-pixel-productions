import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { confirmBooking, getBookingBySessionId, releaseBooking } from '@/lib/booking/transitions'
import type { BookingRow } from '@/lib/booking/types'
import { revalidateBookingPages } from '@/lib/booking/revalidate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const signature = req.headers.get('stripe-signature')
  if (!secret || !signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  // Raw body is required for signature verification.
  const payload = await req.text()

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret)
  } catch (err) {
    console.error('[webhook] signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.payment_status !== 'paid') break // async method still pending
        const booking = await findBooking(session)
        if (!booking) {
          console.error('[webhook] no booking for session', session.id)
          break
        }
        const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null
        const result = await confirmBooking(booking, paymentIntentId)
        revalidateBookingPages(booking.id)
        if (!result.ok) console.warn('[webhook] booking not confirmed:', result.reason, booking.id)
        break
      }

      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session
        const booking = await findBooking(session)
        if (booking) {
          await releaseBooking(booking)
          revalidateBookingPages(booking.id)
        }
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('[webhook] handler error', event.type, err)
    // 500 → Stripe retries. Handlers are idempotent.
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function findBooking(session: Stripe.Checkout.Session): Promise<BookingRow | null> {
  const bySession = await getBookingBySessionId(session.id)
  if (bySession) return bySession
  // Fallback for the tiny window where the session exists but the id hasn't been written yet.
  const bookingId = session.metadata?.booking_id
  if (!bookingId) return null
  const { data } = await getSupabaseAdmin().from('bookings').select('*').eq('id', bookingId).maybeSingle()
  return (data as BookingRow) ?? null
}
