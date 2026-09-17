import type { Metadata } from 'next'
import { getCurrentEvent, getSlotsForEvent } from '@/lib/supabase/public'
import { formatEventDate, formatTimeOfDay } from '@/lib/booking/slots'
import { formatUsd, grossUpCents } from '@/lib/booking/pricing'
import SlotBoard from '@/components/booking/SlotBoard'
import EventContext from '@/components/booking/EventContext'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Book a Headshot | Effective Pixel Productions',
  description: 'Reserve a 15-minute professional headshot session. Every dollar goes to charity.',
}

export default async function BookPage({
  searchParams,
}: {
  searchParams: { cancelled?: string }
}) {
  const event = await getCurrentEvent()

  if (!event) {
    return (
      <section className="pt-32 lg:pt-40 pb-20 section-padding">
        <h1 className="font-display text-display-md text-ep-white mb-4">No upcoming sessions</h1>
        <p className="text-ep-silver">Check back soon — the next headshot day hasn&apos;t been scheduled yet.</p>
      </section>
    )
  }

  const slots = await getSlotsForEvent(event.id)
  const totalSlots = slots.length
  const cancelled = searchParams.cancelled === '1'

  return (
    <>
      {/* Hero */}
      <section className="pt-32 lg:pt-40 pb-16 section-padding relative">
        <div className="absolute right-0 top-20 translate-x-1/4 display-number opacity-0 animate-fade-in">
          {String(totalSlots).padStart(2, '0')}
        </div>

        <div className="relative max-w-3xl">
          <div className="flex items-center gap-4 mb-8 opacity-0 animate-fade-in">
            <span className="w-12 h-px bg-ep-accent" />
            <span className="text-xs uppercase tracking-widest text-ep-accent">{event.name}</span>
          </div>
          <h1 className="font-display text-display-lg lg:text-display-xl text-ep-white mb-6 opacity-0 animate-fade-in-up stagger-1">
            Book Your Headshot
          </h1>
          <p className="text-xl text-ep-silver leading-relaxed opacity-0 animate-fade-in-up stagger-2">
            {formatEventDate(event.event_date, event.timezone)} · {formatTimeOfDay(event.start_time)}–{formatTimeOfDay(event.end_time)}
          </p>
          <p className="mt-4 text-ep-silver leading-relaxed max-w-2xl opacity-0 animate-fade-in-up stagger-3">
            A {event.slot_minutes}-minute professional headshot session for {formatUsd(event.price_cents)}.
            Pick an open time below — your slot is confirmed the moment your payment goes through.
            Optionally add {formatUsd(grossUpCents(event.price_cents) - event.price_cents)} to cover the card processing fee so the full {formatUsd(event.price_cents)} goes to the cause.
          </p>
        </div>

        {/* Facts */}
        <div className="relative mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl opacity-0 animate-fade-in-up stagger-4">
          <Fact label="Date" value={new Date(event.event_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
          <Fact label="Session" value={`${event.slot_minutes} min`} />
          <Fact label="Price" value={formatUsd(event.price_cents)} />
          <Fact label="Slots" value={String(totalSlots)} />
        </div>
      </section>

      <EventContext charityInfo={event.charity_info} imageUrl={event.image_url} />

      <div className="sep-line-accent" />

      {/* Slot grid */}
      <section className="section-padding-sm">
        {cancelled && (
          <div className="mb-10 border border-ep-graphite bg-ep-charcoal px-6 py-4 text-sm text-ep-silver max-w-3xl">
            Checkout was cancelled and your slot has been released. Pick a time whenever you&apos;re ready.
          </div>
        )}
        <SlotBoard event={event} initialSlots={slots} />
      </section>
    </>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs uppercase tracking-widest text-ep-gray mb-2 block">{label}</span>
      <span className="font-display text-2xl text-ep-white">{value}</span>
    </div>
  )
}
