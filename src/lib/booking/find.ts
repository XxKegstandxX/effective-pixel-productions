import 'server-only'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { SlotRow } from './types'

export const LOOKUP_LIMIT_PER_WINDOW = 5
export const LOOKUP_WINDOW_SECONDS = 60

/**
 * Digits only, and drop a leading US country code so "+1 (555) 555-5555"
 * matches "555-555-5555". Anything else is compared as-is.
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
}

export interface FoundBooking {
  id: string
  slot: Pick<SlotRow, 'start_time' | 'end_time'>
}

/**
 * Confirmed bookings on `eventId` whose email AND phone both match.
 * Email is stored lowercased at checkout; phone is stored as typed, so we
 * narrow by email in SQL and compare normalized phones in code.
 */
export async function findBookings(eventId: string, email: string, phone: string): Promise<FoundBooking[]> {
  const wantPhone = normalizePhone(phone)
  if (!wantPhone) return []

  const { data, error } = await getSupabaseAdmin()
    .from('bookings')
    .select('id, phone, slots!inner(id, start_time, end_time, event_id)')
    .eq('email', email.trim().toLowerCase())
    .eq('status', 'confirmed')
    .eq('slots.event_id', eventId)
  if (error) {
    console.error('[find] lookup failed', error)
    throw new Error('lookup failed')
  }

  type Row = { id: string; phone: string; slots: Pick<SlotRow, 'id' | 'start_time' | 'end_time' | 'event_id'> }
  return ((data ?? []) as unknown as Row[])
    .filter((r) => normalizePhone(r.phone) === wantPhone)
    .map((r) => ({ id: r.id, slot: { start_time: r.slots.start_time, end_time: r.slots.end_time } }))
    .sort((a, b) => a.slot.start_time.localeCompare(b.slot.start_time))
}

/** 'error' fails closed: if we can't count attempts, we don't allow guessing. */
export async function registerLookupAttempt(key: string): Promise<'allowed' | 'limited' | 'error'> {
  const { data, error } = await getSupabaseAdmin().rpc('register_lookup_attempt', {
    p_key: key,
    p_limit: LOOKUP_LIMIT_PER_WINDOW,
    p_window_seconds: LOOKUP_WINDOW_SECONDS,
  })
  if (error) {
    console.error('[find] register_lookup_attempt failed', error)
    return 'error'
  }
  return data === true ? 'allowed' : 'limited'
}

/** Best-effort client IP behind Vercel / proxies. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}
