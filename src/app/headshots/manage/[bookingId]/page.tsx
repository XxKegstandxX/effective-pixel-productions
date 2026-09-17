import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getBookingContext, CHANGE_CUTOFF_HOURS } from '@/lib/booking/manage'
import { getSlotsForEvent } from '@/lib/supabase/public'
import { formatEventDate, formatSlotRange, formatTimeZoneAbbr } from '@/lib/booking/slots'
import { formatUsd } from '@/lib/booking/pricing'
import ManageBooking from '@/components/booking/ManageBooking'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Manage your booking | Effective Pixel Productions',
  robots: { index: false, follow: false },
}

export default async function ManagePage({ params }: { params: { bookingId: string } }) {
  const ctx = await getBookingContext(params.bookingId)
  if (!ctx) notFound()

  const { booking, slot, event, canModify, changesLockAt } = ctx
  const slots = canModify ? await getSlotsForEvent(event.id) : []

  const statusLabel = { confirmed: 'Confirmed', pending: 'Payment pending', cancelled: 'Cancelled' }[booking.status]
  const lockedReason =
    booking.status === 'cancelled'
      ? 'This booking has been cancelled.'
      : booking.status === 'pending'
        ? 'This booking hasn’t been paid for yet, so it can’t be changed.'
        : `Changes are no longer available within ${CHANGE_CUTOFF_HOURS} hours of the event. Contact us directly if you need help.`

  return (
    <section className="pt-32 lg:pt-40 pb-24 section-padding relative">
      <div className="relative max-w-3xl">
        <div className="flex items-center gap-4 mb-8 opacity-0 animate-fade-in">
          <span className="w-12 h-px bg-ep-accent" />
          <span className="text-xs uppercase tracking-widest text-ep-accent">Your booking</span>
        </div>
        <h1 className="font-display text-display-lg lg:text-display-xl text-ep-white mb-8 opacity-0 animate-fade-in-up stagger-1">
          {booking.full_name.split(' ')[0]}’s session
        </h1>
      </div>

      <div className="border border-ep-graphite bg-ep-charcoal p-8 md:p-10 max-w-lg space-y-8 opacity-0 animate-fade-in-up stagger-2">
        <div>
          <span className="text-xs uppercase tracking-widest text-ep-gray mb-2 block">When</span>
          <span className="font-display text-2xl text-ep-white block">{formatSlotRange(slot.start_time, slot.end_time, event.timezone)}</span>
          <span className="text-ep-silver">
            {formatEventDate(event.event_date, event.timezone)} ({formatTimeZoneAbbr(slot.start_time, event.timezone)})
          </span>
        </div>
        <div className="sep-line" />
        <div className="grid grid-cols-2 gap-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-ep-gray mb-2 block">Event</span>
            <span className="text-ep-white">{event.name}</span>
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-ep-gray mb-2 block">Status</span>
            <span className={booking.status === 'confirmed' ? 'text-ep-accent-light' : booking.status === 'cancelled' ? 'text-red-400' : 'text-amber-400'}>
              {statusLabel}
            </span>
            {booking.status === 'cancelled' && booking.refund_cents != null && (
              <span className="block text-ep-gray text-sm mt-1">{formatUsd(booking.refund_cents)} refunded</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12 opacity-0 animate-fade-in-up stagger-3">
        {canModify ? (
          <ManageBooking
            bookingId={booking.id}
            amountCents={booking.amount_cents}
            event={event}
            currentSlot={slot}
            slots={slots}
            changesLockAt={changesLockAt.toISOString()}
          />
        ) : (
          <div className="border border-ep-graphite px-6 py-5 text-sm text-ep-silver max-w-lg">{lockedReason}</div>
        )}
      </div>
    </section>
  )
}
