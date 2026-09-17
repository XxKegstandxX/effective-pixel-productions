import { createClient } from '@supabase/supabase-js'
import type { EventRow, SlotRow } from '@/lib/booking/types'

/** Anon-key client for server components (no cookies/auth needed — everything public is RLS-readable). */
function publicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** The event to show on /headshots: the next one on or after today, else the most recent. */
export async function getCurrentEvent(): Promise<EventRow | null> {
  const sb = publicClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: upcoming } = await sb
    .from('events')
    .select('*')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (upcoming) return upcoming as EventRow

  const { data: latest } = await sb
    .from('events')
    .select('*')
    .order('event_date', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (latest as EventRow) ?? null
}

export async function getSlotsForEvent(eventId: string): Promise<SlotRow[]> {
  const sb = publicClient()
  const { data, error } = await sb
    .from('slots')
    .select('*')
    .eq('event_id', eventId)
    .order('start_time', { ascending: true })
  if (error) throw error
  return (data ?? []) as SlotRow[]
}
