'use client'

import { useEffect, useState } from 'react'

export default function ManageLinkBox({ path }: { path: string }) {
  const [href, setHref] = useState(path)
  const [copied, setCopied] = useState(false)

  useEffect(() => setHref(window.location.origin + path), [path])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      /* clipboard blocked — the URL is visible to copy by hand */
    }
  }

  return (
    <div className="mt-10 max-w-lg border-2 border-amber-400 bg-amber-400/10 p-6 md:p-8">
      <div className="flex items-center gap-3 mb-3">
        <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <span className="font-display text-lg text-ep-white">Save this link</span>
      </div>
      <p className="text-sm text-ep-mist leading-relaxed mb-5">
        Save this page or copy this link — it’s the only way to reschedule or cancel your booking, and we don’t currently email it to you.
      </p>
      <a href={path} className="block break-all text-sm text-amber-300 underline underline-offset-4 hover:text-amber-200 mb-5">
        {href}
      </a>
      <button type="button" onClick={copy} className="btn-outline !py-3 !px-6 text-xs">
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  )
}
