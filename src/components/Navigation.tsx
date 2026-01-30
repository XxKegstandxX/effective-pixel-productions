'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-ep-black border-b border-ep-graphite">
      {/* Main nav bar */}
      <nav className="flex items-center justify-between px-6 md:px-12 lg:px-20 xl:px-32 py-5">
        {/* Logo */}
        <Link href="/" className="font-display text-base md:text-lg tracking-tight text-ep-white">
          Effective Pixel Productions<span className="text-ep-accent">.</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-12">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/services" className="nav-link">Services</Link>
          <Link href="/team" className="nav-link">Team</Link>
          <Link href="/contact" className="nav-link">Contact</Link>
        </div>

        {/* CTA */}
        <div className="hidden lg:block">
          <Link href="/contact" className="btn-ghost">
            Let's Talk
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden flex flex-col justify-center items-center w-10 h-10"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <span className={`w-6 h-px bg-ep-white transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-[1px]' : '-translate-y-1'}`} />
          <span className={`w-6 h-px bg-ep-white transition-all duration-300 ${isOpen ? '-rotate-45' : 'translate-y-1'}`} />
        </button>
      </nav>

      {/* Mobile Menu */}
      <div className={`md:hidden fixed inset-0 top-0 bg-ep-black z-40 transition-all duration-500 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className="flex flex-col items-center justify-center h-full gap-8">
          <Link href="/" className="font-display text-3xl text-ep-white hover:text-ep-accent transition-colors" onClick={() => setIsOpen(false)}>Home</Link>
          <Link href="/services" className="font-display text-3xl text-ep-white hover:text-ep-accent transition-colors" onClick={() => setIsOpen(false)}>Services</Link>
          <Link href="/team" className="font-display text-3xl text-ep-white hover:text-ep-accent transition-colors" onClick={() => setIsOpen(false)}>Team</Link>
          <Link href="/contact" className="font-display text-3xl text-ep-white hover:text-ep-accent transition-colors" onClick={() => setIsOpen(false)}>Contact</Link>
        </div>
      </div>
    </header>
  )
}
