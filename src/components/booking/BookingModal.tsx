'use client'

import { useEffect, useState } from 'react'
import { HOLD_MINUTES, formatUsd, grossUpCents, totalCents } from '@/lib/booking/pricing'
import { formatEventDate, formatSlotRange } from '@/lib/booking/slots'
import type { EventRow, SlotRow } from '@/lib/booking/types'

interface Props {
  event: EventRow
  slot: SlotRow
  onClose: () => void
  onTaken: (message: string) => void
}

const inputClass =
  'w-full px-0 py-3 bg-transparent border-b border-ep-graphite text-ep-white placeholder-ep-gray focus:border-ep-accent outline-none transition-colors'
const labelClass = 'block text-xs uppercase tracking-widest text-ep-gray mb-3 group-focus-within:text-ep-accent transition-colors'

export default function BookingModal({ event, slot, onClose, onTaken }: Props) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [coverFee, setCoverFee] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const feeCents = grossUpCents(event.price_cents) - event.price_cents
  const total = totalCents(event.price_cents, coverFee)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !submitting && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, submitting])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId: slot.id, fullName, email, phone, coverFee }),
      })
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
      if (res.status === 409) {
        onTaken(data.error ?? 'That slot was just taken. Please pick another.')
        return
      }
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }
      window.location.assign(data.url)
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="booking-title">
      <button type="button" aria-label="Close" className="absolute inset-0 blur-backdrop" onClick={() => !submitting && onClose()} />

      <div className="relative w-full sm:max-w-lg bg-ep-charcoal border border-ep-graphite p-8 md:p-10 max-h-[92vh] overflow-y-auto animate-fade-in-up">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="absolute top-5 right-5 text-ep-gray hover:text-ep-white transition-colors disabled:opacity-40"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <span className="text-xs uppercase tracking-widest text-ep-accent mb-3 block">Reserve this slot</span>
        <h3 id="booking-title" className="font-display text-display-sm text-ep-white mb-1">
          {formatSlotRange(slot.start_time, slot.end_time, event.timezone)}
        </h3>
        <p className="text-sm text-ep-silver mb-8">{formatEventDate(event.event_date, event.timezone)}</p>

        <form onSubmit={submit} className="space-y-7">
          <div className="group">
            <label htmlFor="bk-name" className={labelClass}>Full name</label>
            <input id="bk-name" type="text" required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Your name" />
          </div>
          <div className="group">
            <label htmlFor="bk-email" className={labelClass}>Email</label>
            <input id="bk-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="your@email.com" />
          </div>
          <div className="group">
            <label htmlFor="bk-phone" className={labelClass}>Phone</label>
            <input id="bk-phone" type="tel" required autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="(555) 555-5555" />
          </div>

          <label className="flex items-start gap-4 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={coverFee}
              onChange={(e) => setCoverFee(e.target.checked)}
              className="mt-1 w-4 h-4 accent-[#7d8c7a] bg-transparent"
            />
            <span className="text-sm text-ep-mist leading-relaxed">
              Cover the {formatUsd(feeCents)} card processing fee
              <span className="block text-ep-gray text-xs mt-1">So the full {formatUsd(event.price_cents)} goes to the cause.</span>
            </span>
          </label>

          <div className="sep-line" />

          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-ep-gray">Total</span>
            <span className="font-display text-3xl text-ep-white">{formatUsd(total)}</span>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60 disabled:hover:gap-3">
            {submitting ? 'Redirecting to payment…' : 'Continue to payment'}
            {!submitting && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            )}
          </button>
          <p className="text-xs text-ep-gray text-center">
            Your slot is held for {HOLD_MINUTES} minutes while you pay. Secure checkout by Stripe.
          </p>
        </form>
      </div>
    </div>
  )
}
