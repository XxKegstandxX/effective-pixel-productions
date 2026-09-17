import type { SlotRow, SlotStatus } from './types'

/**
 * Lazy hold expiry: a 'held' slot whose hold has lapsed is shown (and treated)
 * as open. The DB row isn't touched until someone re-holds it via hold_slot().
 */
export function effectiveStatus(slot: SlotRow, now: Date = new Date()): SlotStatus {
  if (slot.status === 'held') {
    if (!slot.held_until || new Date(slot.held_until) <= now) return 'open'
  }
  return slot.status
}

export function formatSlotTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(new Date(iso))
}

export function formatSlotRange(startIso: string, endIso: string, timeZone: string): string {
  return `${formatSlotTime(startIso, timeZone)} – ${formatSlotTime(endIso, timeZone)}`
}

export function formatEventDate(dateYmd: string, timeZone: string): string {
  // Anchor at noon in the event zone so the date can't roll over.
  const [y, m, d] = dateYmd.split('-').map(Number)
  const anchor = new Date(Date.UTC(y, m - 1, d, 12))
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  }).format(anchor)
}

export function formatTimeOfDay(hms: string): string {
  const [h, m] = hms.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${hour12}${suffix}` : `${hour12}:${String(m).padStart(2, '0')}${suffix}`
}

export function formatTimeZoneAbbr(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' }).formatToParts(new Date(iso))
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
}
