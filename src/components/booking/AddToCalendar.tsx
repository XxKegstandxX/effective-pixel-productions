import { headers } from 'next/headers'
import { calendarEventFor, googleCalendarUrl } from '@/lib/booking/calendar'
import type { BookingRow, EventRow, SlotRow } from '@/lib/booking/types'

interface Props {
  booking: BookingRow
  slot: SlotRow
  event: EventRow
  className?: string
}

/** Server component: plain links, no JS needed. Only render for confirmed bookings. */
export default function AddToCalendar({ booking, slot, event, className = '' }: Props) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? originFromHeaders()
  const ev = calendarEventFor(booking, slot, event, origin)

  return (
    <div className={className}>
      <span className="text-xs uppercase tracking-widest text-ep-gray mb-4 block">Add to calendar</span>
      <div className="flex flex-wrap gap-3">
        <a href={googleCalendarUrl(ev)} target="_blank" rel="noopener noreferrer" className="btn-outline !py-3 !px-6 text-xs">
          <CalendarIcon />
          Google Calendar
        </a>
        <a href={`/api/calendar/${booking.id}`} download="headshot-session.ics" className="btn-outline !py-3 !px-6 text-xs">
          <DownloadIcon />
          Download .ics
        </a>
      </div>
      <p className="text-xs text-ep-gray mt-3">The .ics file works with Apple Calendar, Outlook, and most other apps.</p>
      <p className="text-xs text-ep-gray mt-2">If you already added the previous time to your calendar, you may want to remove that old entry.</p>
    </div>
  )
}

function originFromHeaders(): string {
  const h = headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}
