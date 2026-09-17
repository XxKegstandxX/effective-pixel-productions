import Link from 'next/link'

export default function BookingNotFound() {
  return (
    <section className="pt-32 lg:pt-40 pb-24 section-padding min-h-[60vh]">
      <div className="max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <span className="w-12 h-px bg-ep-accent" />
          <span className="text-xs uppercase tracking-widest text-ep-accent">Booking</span>
        </div>
        <h1 className="font-display text-display-lg text-ep-white mb-6">We couldn’t find that booking</h1>
        <p className="text-ep-silver leading-relaxed max-w-xl">
          Double-check the link from your confirmation page — it has to match exactly. If you’ve lost it, contact us and we’ll look it up for you.
        </p>
        <Link href="/headshots" className="btn-outline mt-10">Back to slots</Link>
      </div>
    </section>
  )
}
