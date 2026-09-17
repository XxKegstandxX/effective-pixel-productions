import type { Metadata } from 'next'
import Link from 'next/link'
import FindBookingForm from '@/components/booking/FindBookingForm'

export const metadata: Metadata = {
  title: 'Find your booking | Effective Pixel Productions',
  robots: { index: false, follow: false },
}

export default function FindBookingPage() {
  return (
    <section className="pt-32 lg:pt-40 pb-24 section-padding relative min-h-[70vh]">
      <div className="relative max-w-3xl">
        <div className="flex items-center gap-4 mb-8 opacity-0 animate-fade-in">
          <span className="w-12 h-px bg-ep-accent" />
          <span className="text-xs uppercase tracking-widest text-ep-accent">Already booked?</span>
        </div>
        <h1 className="font-display text-display-lg lg:text-display-xl text-ep-white mb-6 opacity-0 animate-fade-in-up stagger-1">
          Find your booking
        </h1>
        <p className="text-xl text-ep-silver leading-relaxed mb-12 max-w-xl opacity-0 animate-fade-in-up stagger-2">
          Enter the email and phone number you booked with and we&apos;ll take you to your booking, where you can reschedule or cancel.
        </p>

        <div className="max-w-lg opacity-0 animate-fade-in-up stagger-3">
          <FindBookingForm />
        </div>

        <Link href="/headshots" className="btn-ghost mt-16">
          <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
          Back to booking
        </Link>
      </div>
    </section>
  )
}
