import { NextResponse } from 'next/server'
import { getCurrentEvent } from '@/lib/supabase/public'
import { clientIp, findBookings, registerLookupAttempt } from '@/lib/booking/find'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// One message for "no match" no matter which field was wrong.
const NOT_FOUND = 'No booking found with that email and phone — double-check for typos, or contact us directly.'

export async function POST(req: Request) {
  const gate = await registerLookupAttempt(`ip:${clientIp(req)}`)
  if (gate === 'limited') {
    return NextResponse.json({ error: 'Too many attempts. Please wait a minute and try again.' }, { status: 429 })
  }
  if (gate === 'error') {
    return NextResponse.json({ error: 'Lookup is temporarily unavailable. Please try again shortly.' }, { status: 503 })
  }

  let email = ''
  let phone = ''
  try {
    const body = await req.json()
    email = String(body.email ?? '').trim().toLowerCase()
    phone = String(body.phone ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  if (!email || !phone || email.length > 254 || phone.length > 40) {
    return NextResponse.json({ error: 'Please enter both your email and phone.' }, { status: 400 })
  }

  const event = await getCurrentEvent()
  if (!event) return NextResponse.json({ error: NOT_FOUND }, { status: 404 })

  const matches = await findBookings(event.id, email, phone)
  if (matches.length === 0) return NextResponse.json({ error: NOT_FOUND }, { status: 404 })

  return NextResponse.json({
    matches: matches.map((m) => ({ id: m.id, start_time: m.slot.start_time, end_time: m.slot.end_time })),
    timezone: event.timezone,
  })
}
