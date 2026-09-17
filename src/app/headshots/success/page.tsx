import type { Metadata } from 'next'
import Link from 'next/link'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { confirmBooking, getBookingBySessionId } from '@/lib/booking/transitions'
import { formatUsd } from '@/lib/booking/pricing'
import { formatEventDate, formatSlotRange, formatTimeZoneAbbr } from '@/lib/booking/slots'
import type { BookingRow, EventRow, SlotRow } from '@/lib/booking/types'
import ManageLinkBox from '@/components/booking/ManageLinkBox'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: "You're all set | Effective Pixel Productions" }

export default async function SuccessPage({ searchParams }: { searchParams: { session_id?: string } }) {
  const sessionId = searchParams.session_id
  let booking = sessionId ? await getBookingBySessionId(sessionId) : null
  let conflict = false

  // The webhook usually beats the redirect, but if it hasn't landed yet, verify
  // with Stripe directly and confirm here. confirmBooking() is idempotent.
  if (booking && booking.status === 'pending' && sessionId) {
    const session = await getStripe().checkout.sessions.retrieve(sessionId)
    if (session.payment_status === 'paid') {
      const pi = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null
      const result = await confirmBooking(booking, pi)
      if (result.ok) booking = result.booking
      else conflict = true
    }
  }

  if (!booking || conflict || booking.status === 'cancelled') {
    return (
      <Shell eyebrow="Booking" title={conflict ? 'That slot was taken' : 'We couldn’t find that booking'}>
        <p className="text-ep-silver leading-relaxed">
          {conflict
            ? 'Someone completed payment for that time just before you. Your payment has been refunded — please pick another slot.'
            : 'If you completed payment, check your email for a Stripe receipt and reach out to us and we’ll sort it out.'}
        </p>
        <Link href="/headshots" className="btn-outline mt-10">Back to slots</Link>
      </Shell>
    )
  }

  if (booking.status === 'pending') {
    return (
      <Shell eyebrow="Booking" title="Payment still processing">
        <p className="text-ep-silver leading-relaxed">We haven’t received confirmation from Stripe yet. Refresh this page in a moment.</p>
        <Link href="/headshots" className="btn-outline mt-10">Back to slots</Link>
      </Shell>
    )
  }

  const { slot, event } = await loadSlotAndEvent(booking)

  return (
    <Shell eyebrow="Confirmed" title="You’re all set.">
      <p className="text-xl text-ep-silver leading-relaxed mb-12">
        Thanks, {booking.full_name.split(' ')[0]}. Your headshot session is booked.
      </p>

      <div className="border border-ep-graphite bg-ep-charcoal p-8 md:p-10 max-w-lg space-y-8">
        <Row label="When">
          <span className="font-display text-2xl text-ep-white block">{formatSlotRange(slot.start_time, slot.end_time, event.timezone)}</span>
          <span className="text-ep-silver">{formatEventDate(event.event_date, event.timezone)} ({formatTimeZoneAbbr(slot.start_time, event.timezone)})</span>
        </Row>
        <div className="sep-line" />
        <Row label="Event"><span className="text-ep-white">{event.name}</span></Row>
        <Row label="Paid">
          <span className="text-ep-white">{formatUsd(booking.amount_cents)}</span>
          {booking.fee_covered && <span className="text-ep-gray text-sm ml-2">(processing fee covered — thank you)</span>}
        </Row>
        <Row label="Receipt"><span className="text-ep-white">{booking.email}</span></Row>
      </div>

      <ManageLinkBox path={`/headshots/manage/${booking.id}`} />

      <p className="text-sm text-ep-gray mt-8 max-w-lg">
        Please arrive about 5 minutes early. Stripe will email your receipt.
      </p>
      <Link href="/" className="btn-ghost mt-10">Back to home</Link>
    </Shell>
  )
}

async function loadSlotAndEvent(booking: BookingRow) {
  const sb = getSupabaseAdmin()
  const { data: slot } = await sb.from('slots').select('*').eq('id', booking.slot_id).single()
  const { data: event } = await sb.from('events').select('*').eq('id', (slot as SlotRow).event_id).single()
  return { slot: slot as SlotRow, event: event as EventRow }
}

function Shell({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="pt-32 lg:pt-40 pb-24 section-padding relative min-h-[70vh]">
      <div className="relative max-w-3xl">
        <div className="flex items-center gap-4 mb-8 opacity-0 animate-fade-in">
          <span className="w-12 h-px bg-ep-accent" />
          <span className="text-xs uppercase tracking-widest text-ep-accent">{eyebrow}</span>
        </div>
        <h1 className="font-display text-display-lg lg:text-display-xl text-ep-white mb-8 opacity-0 animate-fade-in-up stagger-1">{title}</h1>
        <div className="opacity-0 animate-fade-in-up stagger-2">{children}</div>
      </div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs uppercase tracking-widest text-ep-gray mb-2 block">{label}</span>
      {children}
    </div>
  )
}
