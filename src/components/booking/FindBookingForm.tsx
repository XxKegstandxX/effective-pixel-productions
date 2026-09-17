'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatSlotRange } from '@/lib/booking/slots'

interface Match {
  id: string
  start_time: string
  end_time: string
}

const inputClass =
  'w-full px-0 py-3 bg-transparent border-b border-ep-graphite text-ep-white placeholder-ep-gray focus:border-ep-accent outline-none transition-colors'
const labelClass = 'block text-xs uppercase tracking-widest text-ep-gray mb-3 group-focus-within:text-ep-accent transition-colors'

export default function FindBookingForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [matches, setMatches] = useState<Match[] | null>(null)
  const [timezone, setTimezone] = useState('America/New_York')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setMatches(null)
    try {
      const res = await fetch('/api/find-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; matches?: Match[]; timezone?: string }
      if (!res.ok || !data.matches) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }
      if (data.matches.length === 1) {
        router.push(`/headshots/manage/${data.matches[0].id}`)
        return // keep the spinner on while navigating
      }
      setTimezone(data.timezone ?? timezone)
      setMatches(data.matches)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (matches) {
    return (
      <div>
        <p className="text-ep-silver mb-6">We found {matches.length} bookings with that email and phone. Which one?</p>
        <ul className="space-y-3">
          {matches.map((m) => (
            <li key={m.id}>
              <Link
                href={`/headshots/manage/${m.id}`}
                className="flex items-center justify-between border border-ep-graphite px-6 py-4 hover:border-ep-accent transition-colors"
              >
                <span className="font-display text-lg text-ep-white">{formatSlotRange(m.start_time, m.end_time, timezone)}</span>
                <span className="text-xs uppercase tracking-widest text-ep-accent">Manage →</span>
              </Link>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setMatches(null)} className="btn-ghost mt-8">Search again</button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <div className="group">
        <label htmlFor="find-email" className={labelClass}>Email</label>
        <input id="find-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="your@email.com" />
      </div>
      <div className="group">
        <label htmlFor="find-phone" className={labelClass}>Phone</label>
        <input id="find-phone" type="tel" required autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="(555) 555-5555" />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60 disabled:hover:gap-3">
        {busy ? 'Looking up…' : 'Find my booking'}
        {!busy && (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        )}
      </button>
    </form>
  )
}
