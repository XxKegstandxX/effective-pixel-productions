import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-ep-charcoal">
      {/* Top accent line */}
      <div className="sep-line-accent" />
      
      <div className="px-6 md:px-12 lg:px-20 xl:px-32 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Brand + tagline */}
          <div className="lg:col-span-5">
            <Link href="/" className="font-display text-2xl tracking-tight text-ep-white inline-block mb-6">
              Effective Pixel Productions<span className="text-ep-accent">.</span>
            </Link>
            <p className="text-ep-silver text-sm leading-relaxed max-w-sm">
              Elite commercial photography and production for brands that demand excellence.
            </p>
          </div>

          {/* Navigation */}
          <div className="lg:col-span-3">
            <p className="text-xs uppercase tracking-widest text-ep-gray mb-6">Navigate</p>
            <div className="flex flex-col gap-4">
              <Link href="/" className="text-ep-silver hover:text-ep-white transition-colors text-sm">Home</Link>
              <Link href="/services" className="text-ep-silver hover:text-ep-white transition-colors text-sm">Services</Link>
              <Link href="/team" className="text-ep-silver hover:text-ep-white transition-colors text-sm">Team</Link>
              <Link href="/contact" className="text-ep-silver hover:text-ep-white transition-colors text-sm">Contact</Link>
            </div>
          </div>

          {/* Contact */}
          <div className="lg:col-span-4">
            <p className="text-xs uppercase tracking-widest text-ep-gray mb-6">Get in Touch</p>
            <a 
              href="mailto:hello@effectivepixelproductions.com" 
              className="text-ep-white hover:text-ep-accent transition-colors text-lg font-display"
            >
              hello@effectivepixelproductions.com
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="sep-line mt-16 mb-8" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-ep-gray">
          <p>© {new Date().getFullYear()} Effective Pixel Productions</p>
          <p className="text-ep-accent">Creating exceptional imagery</p>
        </div>
      </div>
    </footer>
  )
}
