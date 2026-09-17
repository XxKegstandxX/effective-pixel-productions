import { NextResponse } from 'next/server'
import { cancelBookingWithRefund, getBookingContext } from '@/lib/booking/manage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STATUS: Record<string, number> = { not_modifiable: 403, no_payment: 409, fee_unavailable: 503, refund_failed: 502, db_failed: 500 }

export async function POST(_req: Request, { params }: { params: { bookingId: string } }) {
  const ctx = await getBookingContext(params.bookingId)
  if (!ctx) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })

  const result = await cancelBookingWithRefund(ctx)
  if (!result.ok) return NextResponse.json({ error: result.message, code: result.code }, { status: STATUS[result.code] ?? 500 })
  return NextResponse.json({ ok: true, refundCents: result.refundCents, feeCents: result.feeCents })
}
