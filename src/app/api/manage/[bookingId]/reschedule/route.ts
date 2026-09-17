import { NextResponse } from 'next/server'
import { getBookingContext, rescheduleBooking } from '@/lib/booking/manage'
import { revalidateBookingPages } from '@/lib/booking/revalidate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STATUS: Record<string, number> = { not_found: 404, not_confirmed: 409, cutoff: 403, same_slot: 400, unavailable: 409, error: 500 }

export async function POST(req: Request, { params }: { params: { bookingId: string } }) {
  const ctx = await getBookingContext(params.bookingId)
  if (!ctx) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })

  let slotId = ''
  try {
    slotId = String((await req.json()).slotId ?? '')
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  if (!/^[0-9a-f-]{36}$/i.test(slotId)) return NextResponse.json({ error: 'Invalid slot.' }, { status: 400 })

  // reschedule_booking() re-checks status + cutoff inside the transaction; this is just a fast path.
  if (!ctx.canModify) return NextResponse.json({ error: 'This booking can no longer be changed.' }, { status: 403 })

  const result = await rescheduleBooking(ctx.booking.id, slotId)
  if (!result.ok) return NextResponse.json({ error: result.message, code: result.code }, { status: STATUS[result.code] ?? 500 })
  revalidateBookingPages(ctx.booking.id)
  return NextResponse.json({ ok: true, slot: result.slot })
}
