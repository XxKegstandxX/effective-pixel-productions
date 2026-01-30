import Link from 'next/link'
import ClientLogos from '@/components/ClientLogos'
import vendorData from '../../content/team/vendors.json'

export default function Home() {
  return (
    <>
      {/* Hero Section - Asymmetric layout */}
      <section className="min-h-screen relative overflow-hidden">
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" 
          style={{
            backgroundImage: `linear-gradient(ep-graphite 1px, transparent 1px), linear-gradient(90deg, ep-graphite 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        
        {/* Large decorative number */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 display-number opacity-0 animate-fade-in">
          01
        </div>

        {/* Main content */}
        <div className="relative min-h-screen flex items-end pb-20 lg:pb-32">
          <div className="section-padding w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
              {/* Left: Main headline */}
              <div className="lg:col-span-7 xl:col-span-6">
                <div className="flex items-center gap-4 mb-8 opacity-0 animate-fade-in">
                  <span className="w-12 h-px bg-ep-accent" />
                  <span className="text-xs uppercase tracking-widest text-ep-accent">Commercial Photography</span>
                </div>
                
                <h1 className="font-display text-display-lg lg:text-display-xl xl:text-display-2xl text-ep-white mb-8 opacity-0 animate-fade-in-up stagger-1">
                  We craft
                  <br />
                  <span className="text-ep-accent">visual</span> stories
                </h1>
                
                <p className="text-ep-silver text-lg md:text-xl leading-relaxed max-w-md mb-12 opacity-0 animate-fade-in-up stagger-2">
                  An elite production team trusted by the world's 
                  most demanding brands.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 opacity-0 animate-fade-in-up stagger-3">
                  <Link href="/contact" className="btn-primary">
                    Start a Project
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  <Link href="/team" className="btn-outline">
                    Meet the Team
                  </Link>
                </div>
              </div>

              {/* Right: Image placeholder + stats */}
              <div className="lg:col-span-5 xl:col-span-6">
                <div className="relative">
                  {/* Image frame */}
                  <div className="relative aspect-[4/5] bg-ep-slate overflow-hidden opacity-0 animate-slide-in-left stagger-2">
                    <div className="absolute inset-0 flex items-center justify-center text-ep-gray text-sm uppercase tracking-wide">
                      Featured Image
                    </div>
                    {/* Decorative corner accent */}
                    <div className="absolute top-0 right-0 w-24 h-24">
                      <div className="absolute top-4 right-4 w-full h-px bg-ep-accent" />
                      <div className="absolute top-4 right-4 w-px h-full bg-ep-accent" />
                    </div>
                  </div>

                  {/* Floating stats card */}
                  <div className="absolute -bottom-8 -left-8 lg:-left-16 bg-ep-charcoal border border-ep-graphite p-6 opacity-0 animate-fade-in-up stagger-4">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <p className="font-display text-3xl text-ep-white mb-1">15+</p>
                        <p className="text-xs uppercase tracking-wide text-ep-gray">Years Combined</p>
                      </div>
                      <div>
                        <p className="font-display text-3xl text-ep-accent mb-1">50+</p>
                        <p className="text-xs uppercase tracking-wide text-ep-gray">Major Brands</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-0 animate-fade-in stagger-5">
          <span className="text-xs uppercase tracking-widest text-ep-gray">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-ep-accent to-transparent" />
        </div>
      </section>

      {/* Clients Strip */}
      <section className="border-y border-ep-graphite bg-ep-charcoal/50">
        <div className="section-padding-sm">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <p className="text-xs uppercase tracking-widest text-ep-gray whitespace-nowrap">Trusted By</p>
            <div className="w-px h-8 bg-ep-graphite hidden lg:block" />
            <ClientLogos clients={vendorData.clients} />
          </div>
        </div>
      </section>

      {/* Services Section - Horizontal scroll feel */}
      <section className="section-padding relative">
        {/* Section header */}
        <div className="flex items-end justify-between mb-20">
          <div>
            <span className="text-xs uppercase tracking-widest text-ep-accent mb-4 block">What We Do</span>
            <h2 className="font-display text-display-md lg:text-display-lg text-ep-white">
              Full-service<br />production
            </h2>
          </div>
          <Link href="/services" className="btn-ghost hidden md:flex">
            View All Services
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {/* Service cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { num: '01', title: 'Photography', desc: 'Product & lifestyle imagery that tells your brand story' },
            { num: '02', title: 'Retouching', desc: 'Pixel-perfect post-production and color grading' },
            { num: '03', title: 'Set Design', desc: 'Custom environments built for your vision' },
            { num: '04', title: 'Styling', desc: 'Wardrobe, hair, makeup — the complete package' },
          ].map((service) => (
            <div 
              key={service.num}
              className="group relative p-8 border border-ep-graphite bg-ep-charcoal/30 card-hover"
            >
              {/* Number */}
              <span className="text-xs text-ep-accent mb-6 block">{service.num}</span>
              
              {/* Content */}
              <h3 className="font-display text-xl text-ep-white mb-3 group-hover:text-ep-accent transition-colors">
                {service.title}
              </h3>
              <p className="text-ep-silver text-sm leading-relaxed">
                {service.desc}
              </p>

              {/* Hover accent */}
              <div className="absolute bottom-0 left-0 w-0 h-px bg-ep-accent transition-all duration-500 group-hover:w-full" />
            </div>
          ))}
        </div>

        <Link href="/services" className="btn-ghost mt-12 md:hidden">
          View All Services
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </section>

      {/* Large statement section */}
      <section className="relative py-32 lg:py-48 overflow-hidden">
        {/* Background accent */}
        <div className="absolute inset-y-0 left-0 w-1/3 bg-ep-accent/5" />
        
        <div className="section-padding relative">
          <div className="max-w-4xl mx-auto text-center">
            <span className="text-xs uppercase tracking-widest text-ep-accent mb-8 block">Our Approach</span>
            <p className="font-display text-display-sm md:text-display-md lg:text-display-lg text-ep-white leading-tight">
              We don't just take pictures.
              <span className="text-ep-accent"> We build worlds</span> around your products.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative">
        {/* Top accent */}
        <div className="sep-line-accent" />
        
        <div className="section-padding">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-xs uppercase tracking-widest text-ep-accent mb-6 block">Ready to Start?</span>
              <h2 className="font-display text-display-md lg:text-display-lg text-ep-white mb-6">
                Let's create something exceptional
              </h2>
              <p className="text-ep-silver text-lg leading-relaxed mb-10 max-w-md">
                Tell us about your project. We'll assemble the perfect team 
                to bring your vision to life.
              </p>
              <Link href="/contact" className="btn-primary">
                Start the Conversation
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            {/* Decorative element */}
            <div className="hidden lg:block relative">
              <div className="aspect-square max-w-sm ml-auto border border-ep-graphite relative">
                <div className="absolute inset-8 border border-ep-accent/30" />
                <div className="absolute inset-16 bg-ep-accent/10" />
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-ep-accent" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-ep-accent" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-ep-accent" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-ep-accent" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
