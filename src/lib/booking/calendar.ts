import type { BookingRow, EventRow, SlotRow } from './types'

// TODO: replace with the real studio address (shown in the calendar entry's Location field).
export const STUDIO_ADDRESS = 'Effective Pixel Productions Studio, 123 Studio Way, Providence, RI 02903'

export interface CalendarEvent {
  uid: string
  title: string
  start: Date
  end: Date
  location: string
  description: string
}

export function calendarEventFor(booking: BookingRow, slot: SlotRow, event: EventRow, siteOrigin: string): CalendarEvent {
  return {
    uid: `booking-${booking.id}@effectivepixelproductions`,
    title: 'Headshot Session – Effective Pixel Productions',
    start: new Date(slot.start_time),
    end: new Date(slot.end_time),
    location: STUDIO_ADDRESS,
    description: [
      `Booked via ${event.name}.`,
      'Please arrive about 5 minutes early.',
      `Reschedule or cancel: ${siteOrigin}/headshots/manage/${booking.id}`,
    ].join('\n'),
  }
}

/** 2026-10-10T13:00:00.000Z → 20261010T130000Z */
function toUtcStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

export function googleCalendarUrl(ev: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    dates: `${toUtcStamp(ev.start)}/${toUtcStamp(ev.end)}`,
    location: ev.location,
    details: ev.description,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** RFC 5545 text escaping. */
function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** Fold lines longer than 75 octets (continuation lines start with a space). */
function icsFold(line: string): string {
  const enc = new TextEncoder()
  if (enc.encode(line).length <= 75) return line
  const out: string[] = []
  let chunk = ''
  let size = 0
  for (const ch of line) {
    const b = enc.encode(ch).length
    if (size + b > (out.length === 0 ? 75 : 74)) {
      out.push(chunk)
      chunk = ''
      size = 0
    }
    chunk += ch
    size += b
  }
  if (chunk) out.push(chunk)
  return out.join('\r\n ')
}

export function buildIcs(ev: CalendarEvent): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Effective Pixel Productions//Headshot Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${ev.uid}`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(ev.start)}`,
    `DTEND:${toUtcStamp(ev.end)}`,
    `SUMMARY:${icsEscape(ev.title)}`,
    `LOCATION:${icsEscape(ev.location)}`,
    `DESCRIPTION:${icsEscape(ev.description)}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Headshot session in 1 hour',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(icsFold).join('\r\n') + '\r\n'
}
