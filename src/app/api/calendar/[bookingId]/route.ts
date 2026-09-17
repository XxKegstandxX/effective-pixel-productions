import { NextResponse } from 'next/server'
import { getBookingContext } from '@/lib/booking/manage'
import { buildIcs, calendarEventFor } from '@/lib/booking/calendar'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET /api/calendar/<bookingId> → .ics for the booking's *current* slot. */
export async function GET(req: Request, { params }: { params: { bookingId: string } }) {
  const ctx = await getBookingContext(params.bookingId)
  if (!ctx || ctx.booking.status !== 'confirmed') {
    return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin
  const ics = buildIcs(calendarEventFor(ctx.booking, ctx.slot, ctx.event, origin))

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="headshot-session.ics"',
      'Cache-Control': 'no-store',
    },
  })
}
