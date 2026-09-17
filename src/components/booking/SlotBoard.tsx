'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { effectiveStatus, formatSlotTime, formatTimeZoneAbbr } from '@/lib/booking/slots'
import type { EventRow, SlotRow, SlotStatus } from '@/lib/booking/types'
import BookingModal from './BookingModal'

interface Props {
  event: EventRow
  initialSlots: SlotRow[]
  /** 'book' (default) opens the payment form; 'reschedule' hands the picked slot to onSelect. */
  mode?: 'book' | 'reschedule'
  /** In reschedule mode: the customer's existing slot, shown as "Yours" and not selectable. */
  currentSlotId?: string
  onSelect?: (slot: SlotRow) => void
}

export default function SlotBoard({ event, initialSlots, mode = 'book', currentSlotId, onSelect }: Props) {
  const [slots, setSlots] = useState<SlotRow[]>(initialSlots)
  useEffect(() => setSlots(initialSlots), [initialSlots])
  const [now, setNow] = useState(() => new Date())
  const [selected, setSelected] = useState<SlotRow | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [live, setLive] = useState(false)

  const refetch = useCallback(async () => {
    const { data } = await getSupabaseBrowserClient()
      .from('slots')
      .select('*')
      .eq('event_id', event.id)
      .order('start_time', { ascending: true })
    if (data) setSlots(data as SlotRow[])
  }, [event.id])

  // Realtime: apply row changes as they land, refetch on (re)connect to catch anything missed.
  useEffect(() => {
    const sb = getSupabaseBrowserClient()
    const channel = sb
      .channel(`slots:${event.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'slots', filter: `event_id=eq.${event.id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as Partial<SlotRow>).id
            setSlots((prev) => prev.filter((s) => s.id !== oldId))
            return
          }
          const row = payload.new as SlotRow
          setSlots((prev) => {
            const idx = prev.findIndex((s) => s.id === row.id)
            if (idx === -1) return [...prev, row].sort((a, b) => a.start_time.localeCompare(b.start_time))
            const next = prev.slice()
            next[idx] = row
            return next
          })
        },
      )
      .subscribe((status) => {
        const ok = status === 'SUBSCRIBED'
        setLive(ok)
        if (ok) refetch()
      })

    // Tab comes back, window regains focus, or the page is restored from the
    // back/forward cache: the grid may be seconds-to-minutes old, so refetch.
    const onVisible = () => {
      if (document.visibilityState === 'visible') refetch()
    }
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) refetch()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', refetch)
    window.addEventListener('pageshow', onPageShow)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', refetch)
      window.removeEventListener('pageshow', onPageShow)
      sb.removeChannel(channel)
    }
  }, [event.id, refetch])

  // Tick so expired holds visibly flip back to open without a DB write.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15_000)
    return () => clearInterval(t)
  }, [])

  const counts = useMemo(() => {
    const c: Record<SlotStatus, number> = { open: 0, held: 0, booked: 0 }
    for (const s of slots) c[effectiveStatus(s, now)]++
    return c
  }, [slots, now])

  // Group by hour (in event tz) → rows of :00 :15 :30 :45
  const rows = useMemo(() => {
    const byHour = new Map<string, SlotRow[]>()
    for (const s of slots) {
      const hour = new Intl.DateTimeFormat('en-US', { hour: 'numeric', timeZone: event.timezone }).format(new Date(s.start_time))
      byHour.set(hour, [...(byHour.get(hour) ?? []), s])
    }
    return Array.from(byHour.entries())
  }, [slots, event.timezone])

  const tz = slots[0] ? formatTimeZoneAbbr(slots[0].start_time, event.timezone) : ''

  const onPick = (slot: SlotRow) => {
    if (effectiveStatus(slot, new Date()) !== 'open') return
    setNotice(null)
    if (mode === 'reschedule') onSelect?.(slot)
    else setSelected(slot)
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
        <div>
          <span className="text-xs uppercase tracking-widest text-ep-gray mb-3 block">Choose a time {tz && `(${tz})`}</span>
          <h2 className="font-display text-display-sm text-ep-white">
            {counts.open} of {slots.length} slots open
          </h2>
        </div>
        <div className="flex items-center gap-6 text-xs uppercase tracking-widest">
          <Legend swatch="border-ep-accent" label="Open" />
          <Legend swatch="border-amber-500/70 bg-amber-500/10" label="Held" />
          <Legend swatch="border-ep-graphite bg-ep-charcoal" label="Booked" />
          {currentSlotId && <Legend swatch="border-ep-accent bg-ep-accent/20" label="Yours" />}
          <span className="flex items-center gap-2 text-ep-gray">
            <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-ep-accent animate-pulse' : 'bg-ep-gray'}`} />
            {live ? 'Live' : 'Connecting'}
          </span>
        </div>
      </div>

      {notice && (
        <div className="mb-8 border border-amber-500/40 bg-amber-500/5 px-6 py-4 text-sm text-ep-mist max-w-3xl">{notice}</div>
      )}

      {/* Grid */}
      <div className="space-y-3">
        {rows.map(([hour, hourSlots]) => (
          <div key={hour} className="grid grid-cols-[3.5rem_1fr] md:grid-cols-[5rem_1fr] gap-3 items-stretch">
            <div className="flex items-center text-xs uppercase tracking-widest text-ep-gray">{hour}</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {hourSlots.map((slot) => (
                <SlotButton
                  key={slot.id}
                  slot={slot}
                  status={effectiveStatus(slot, now)}
                  isCurrent={slot.id === currentSlotId}
                  timeZone={event.timezone}
                  onClick={() => onPick(slot)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {counts.open === 0 && (
        <p className="mt-10 text-ep-silver">All slots are taken. Thank you for the incredible response!</p>
      )}

      {mode === 'book' && selected && (
        <BookingModal
          event={event}
          slot={selected}
          onClose={() => setSelected(null)}
          onTaken={(message) => {
            setSelected(null)
            setNotice(message)
            refetch()
          }}
        />
      )}
    </div>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-2 text-ep-silver">
      <span className={`w-3 h-3 border ${swatch}`} />
      {label}
    </span>
  )
}

function SlotButton({
  slot,
  status,
  isCurrent,
  timeZone,
  onClick,
}: {
  slot: SlotRow
  status: SlotStatus
  isCurrent?: boolean
  timeZone: string
  onClick: () => void
}) {
  const time = formatSlotTime(slot.start_time, timeZone)
  const base = 'relative h-14 px-4 flex items-center justify-between border text-sm transition-all duration-300'

  if (isCurrent) {
    return (
      <div className={`${base} border-ep-accent bg-ep-accent/20 text-ep-white cursor-default`} aria-current="true">
        <span>{time}</span>
        <span className="text-[10px] uppercase tracking-widest text-ep-accent-light">Yours</span>
      </div>
    )
  }

  if (status === 'booked') {
    return (
      <div className={`${base} border-ep-graphite bg-ep-charcoal text-ep-gray cursor-not-allowed`} aria-disabled>
        <span className="line-through">{time}</span>
        <span className="text-[10px] uppercase tracking-widest">Booked</span>
      </div>
    )
  }
  if (status === 'held') {
    return (
      <div className={`${base} border-amber-500/50 bg-amber-500/10 text-ep-mist cursor-not-allowed`} aria-disabled>
        <span>{time}</span>
        <span className="text-[10px] uppercase tracking-widest text-amber-400">Held</span>
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} border-ep-graphite text-ep-white hover:border-ep-accent hover:bg-ep-accent/10 focus:outline-none focus-visible:border-ep-accent`}
    >
      <span>{time}</span>
      <span className="text-[10px] uppercase tracking-widest text-ep-accent">Open</span>
    </button>
  )
}
