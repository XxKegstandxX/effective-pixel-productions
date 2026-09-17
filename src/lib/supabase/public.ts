import { createClient } from '@supabase/supabase-js'
import type { EventRow, SlotRow } from '@/lib/booking/types'

/** Anon-key client for server components (no cookies/auth needed — everything public is RLS-readable). */
function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY (check .env.local and restart the dev server)')
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Never let Next's fetch cache serve a stale row, even from a page that isn't force-dynamic.
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  })
}

/** Log the full Supabase error and rethrow — a config/RLS problem must not look like "no events". */
function fail(where: string, error: { message: string; code?: string; details?: string | null; hint?: string | null }): never {
  console.error(`[supabase] ${where} failed:`, { code: error.code, message: error.message, details: error.details, hint: error.hint })
  throw new Error(`Supabase query failed (${where}): ${error.message}`)
}

/** The event to show on /headshots: the next one on or after today, else the most recent. */
export async function getCurrentEvent(): Promise<EventRow | null> {
  const sb = publicClient()
  const today = new Date().toISOString().slice(0, 10)

  const upcoming = await sb
    .from('events')
    .select('*')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (upcoming.error) fail('events (upcoming)', upcoming.error)
  if (upcoming.data) return upcoming.data as EventRow

  const latest = await sb
    .from('events')
    .select('*')
    .order('event_date', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (latest.error) fail('events (latest)', latest.error)
  return (latest.data as EventRow) ?? null
}

export async function getSlotsForEvent(eventId: string): Promise<SlotRow[]> {
  const sb = publicClient()
  const { data, error } = await sb
    .from('slots')
    .select('*')
    .eq('event_id', eventId)
    .order('start_time', { ascending: true })
  if (error) fail('slots', error)
  return (data ?? []) as SlotRow[]
}
