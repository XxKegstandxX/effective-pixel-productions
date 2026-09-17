import { NextResponse } from 'next/server'
import { getBookingBySessionId, releaseBooking } from '@/lib/booking/transitions'
import { getStripe } from '@/lib/stripe'
import { revalidateBookingPages } from '@/lib/booking/revalidate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Stripe's cancel_url lands here when the customer hits "back" on Checkout.
 * Release the hold right away (instead of waiting for lazy expiry), then send
 * them back to the grid.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const sessionId = url.searchParams.get('session_id')
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin

  if (sessionId) {
    const booking = await getBookingBySessionId(sessionId)
    if (booking?.status === 'pending') {
      try {
        await getStripe().checkout.sessions.expire(sessionId)
      } catch {
        /* already expired or paid — webhook will sort it out */
      }
      await releaseBooking(booking)
      revalidateBookingPages(booking.id)
    }
  }

  return NextResponse.redirect(`${origin}/headshots?cancelled=1`, { status: 303 })
}
