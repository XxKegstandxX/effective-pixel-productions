'use client'

import { useState } from 'react'

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    
    // TODO: Connect to your email service (Formspree, Resend, etc.)
    // For now, this simulates a submission
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Reset form
    setFormData({ name: '', email: '', company: '', message: '' })
    setStatus('success')
    
    // Reset status after 3 seconds
    setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="group">
          <label htmlFor="name" className="block text-xs uppercase tracking-widest text-ep-gray mb-3 group-focus-within:text-ep-accent transition-colors">
            Name
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-0 py-3 bg-transparent border-b border-ep-graphite text-ep-white placeholder-ep-gray focus:border-ep-accent outline-none transition-colors"
            placeholder="Your name"
          />
        </div>
        <div className="group">
          <label htmlFor="email" className="block text-xs uppercase tracking-widest text-ep-gray mb-3 group-focus-within:text-ep-accent transition-colors">
            Email
          </label>
          <input
            type="email"
            id="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-0 py-3 bg-transparent border-b border-ep-graphite text-ep-white placeholder-ep-gray focus:border-ep-accent outline-none transition-colors"
            placeholder="your@email.com"
          />
        </div>
      </div>
      
      <div className="group">
        <label htmlFor="company" className="block text-xs uppercase tracking-widest text-ep-gray mb-3 group-focus-within:text-ep-accent transition-colors">
          Company <span className="text-ep-gray/50">(optional)</span>
        </label>
        <input
          type="text"
          id="company"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          className="w-full px-0 py-3 bg-transparent border-b border-ep-graphite text-ep-white placeholder-ep-gray focus:border-ep-accent outline-none transition-colors"
          placeholder="Your company"
        />
      </div>
      
      <div className="group">
        <label htmlFor="message" className="block text-xs uppercase tracking-widest text-ep-gray mb-3 group-focus-within:text-ep-accent transition-colors">
          Tell us about your project
        </label>
        <textarea
          id="message"
          required
          rows={5}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full px-0 py-3 bg-transparent border-b border-ep-graphite text-ep-white placeholder-ep-gray focus:border-ep-accent outline-none transition-colors resize-none"
          placeholder="What are you working on?"
        />
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'submitting' ? (
            'Sending...'
          ) : status === 'success' ? (
            <>
              Message Sent
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </>
          ) : (
            <>
              Send Message
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
