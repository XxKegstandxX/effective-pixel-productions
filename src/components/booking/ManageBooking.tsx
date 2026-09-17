'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SlotBoard from './SlotBoard'
import { formatSlotRange } from '@/lib/booking/slots'
import { formatUsd, STRIPE_FIXED_FEE_CENTS, STRIPE_PERCENT_FEE } from '@/lib/booking/pricing'
import type { EventRow, SlotRow } from '@/lib/booking/types'

interface Props {
  bookingId: string
  amountCents: number
  event: EventRow
  currentSlot: SlotRow
  slots: SlotRow[]
  changesLockAt: string
}

type Mode = 'view' | 'reschedule' | 'cancel'

export default function ManageBooking({ bookingId, amountCents, event, currentSlot, slots, changesLockAt }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('view')
  const [pending, setPending] = useState<SlotRow | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  // Estimate only — the real fee comes from Stripe at cancel time.
  const estFeeCents = Math.round(amountCents * STRIPE_PERCENT_FEE + STRIPE_FIXED_FEE_CENTS)
  const lockAt = new Date(changesLockAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: event.timezone })

  const reset = (next: Mode) => {
    setMode(next)
    setPending(null)
    setError(null)
  }

  const confirmReschedule = async () => {
    if (!pending) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/manage/${bookingId}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId: pending.id }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; slot?: SlotRow }
      if (!res.ok || !data.slot) {
        setError(data.error ?? 'Could not move your booking. Please try again.')
        setPending(null) // back to the grid; realtime/refresh will show the current state
        router.refresh()
        return
      }
      setDone(`Moved to ${formatSlotRange(data.slot.start_time, data.slot.end_time, event.timezone)}.`)
      reset('view')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const confirmCancel = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/manage/${bookingId}/cancel`, { method: 'POST' })
      const data = (await res.json().catch(() => ({}))) as { error?: string; refundCents?: number; feeCents?: number }
      if (!res.ok || data.refundCents == null) {
        setError(data.error ?? 'The refund could not be processed. Your booking is unchanged.')
        return
      }
      setDone(`Your booking is cancelled. ${formatUsd(data.refundCents)} is on its way back to your card (${formatUsd(data.feeCents ?? 0)} processing fee withheld).`)
      reset('view')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="border border-ep-accent/50 bg-ep-accent/10 px-6 py-5 text-ep-mist max-w-lg">{done}</div>
    )
  }

  if (mode === 'view') {
    return (
      <div className="max-w-lg">
        <p className="text-sm text-ep-gray mb-6">Need to make a change? You can reschedule or cancel until {lockAt}.</p>
        <div className="flex flex-wrap gap-4">
          <button type="button" onClick={() => reset('reschedule')} className="btn-primary">Reschedule</button>
          <button type="button" onClick={() => reset('cancel')} className="btn-outline">Cancel &amp; refund</button>
        </div>
      </div>
    )
  }

  if (mode === 'cancel') {
    return (
      <div className="border border-red-400/40 bg-red-500/5 p-8 max-w-lg space-y-6">
        <h2 className="font-display text-display-sm text-ep-white">Are you sure?</h2>
        <p className="text-ep-silver leading-relaxed">
          A processing fee will be deducted from your refund — roughly {formatUsd(estFeeCents)} of the {formatUsd(amountCents)} you paid. The exact amount is
          whatever Stripe charged us for the transaction. Your slot will be released for someone else.
        </p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex flex-wrap gap-4">
          <button type="button" onClick={confirmCancel} disabled={busy} className="btn-primary bg-red-500/80 hover:bg-red-500 disabled:opacity-60">
            {busy ? 'Processing refund…' : 'Yes, cancel my booking'}
          </button>
          <button type="button" onClick={() => reset('view')} disabled={busy} className="btn-outline disabled:opacity-60">Keep my booking</button>
        </div>
      </div>
    )
  }

  // mode === 'reschedule'
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 max-w-3xl">
        <p className="text-ep-silver">Pick a new open time. Your current slot stays yours until you confirm.</p>
        <button type="button" onClick={() => reset('view')} disabled={busy} className="btn-ghost">Never mind</button>
      </div>

      {error && <div className="border border-amber-500/40 bg-amber-500/5 px-6 py-4 text-sm text-ep-mist max-w-3xl">{error}</div>}

      {pending && (
        <div className="border border-ep-accent bg-ep-accent/10 p-6 max-w-3xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-ep-accent mb-1 block">Move to</span>
            <span className="font-display text-xl text-ep-white">{formatSlotRange(pending.start_time, pending.end_time, event.timezone)}</span>
            <span className="block text-sm text-ep-silver mt-1">
              from {formatSlotRange(currentSlot.start_time, currentSlot.end_time, event.timezone)}
            </span>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={confirmReschedule} disabled={busy} className="btn-primary disabled:opacity-60">
              {busy ? 'Moving…' : 'Confirm'}
            </button>
            <button type="button" onClick={() => setPending(null)} disabled={busy} className="btn-outline disabled:opacity-60">Pick another</button>
          </div>
        </div>
      )}

      <SlotBoard event={event} initialSlots={slots} mode="reschedule" currentSlotId={currentSlot.id} onSelect={setPending} />
    </div>
  )
}
