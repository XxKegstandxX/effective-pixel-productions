import Link from 'next/link'

const services = [
  {
    num: '01',
    title: 'Photography',
    subtitle: 'Product & Lifestyle',
    description: 'Our photographers bring decades of combined experience shooting for the world\'s most recognized brands. From intricate product shots to dynamic lifestyle imagery, we capture every detail with precision and artistry.',
    features: [
      'Product photography',
      'Lifestyle & editorial',
      'E-commerce & catalog',
      'Campaign imagery',
      'On-location & studio'
    ]
  },
  {
    num: '02',
    title: 'Retouching',
    subtitle: 'Post-Production Excellence',
    description: 'Every image is refined to perfection. Our retouching team ensures color accuracy, flawless compositing, and the polished finish that major brands expect.',
    features: [
      'Color correction & grading',
      'Background compositing',
      'Product cleanup',
      'Skin retouching',
      'High-volume workflows'
    ]
  },
  {
    num: '03',
    title: 'Set Design',
    subtitle: 'Custom Environments',
    description: 'From simple tabletop setups to elaborate custom environments, our set designers and builders create the perfect backdrop for every product and story.',
    features: [
      'Set construction',
      'Prop sourcing & creation',
      'Custom builds',
      'Thematic environments',
      'Quick-turn modifications'
    ]
  },
  {
    num: '04',
    title: 'Styling',
    subtitle: 'Wardrobe, Hair & Makeup',
    description: 'Our styling team brings products and talent to life. With experts in wardrobe, hair, and makeup, we ensure every element of your shoot is camera-ready.',
    features: [
      'Wardrobe styling',
      'Hair styling',
      'Makeup artistry',
      'Product styling',
      'Talent preparation'
    ]
  },
  {
    num: '05',
    title: 'Specialty',
    subtitle: 'Unique Capabilities',
    description: 'Some projects require something special. Our team includes specialists in sculpting, food styling, and custom prop creation for those one-of-a-kind shots.',
    features: [
      'Food & product sculpting',
      'Play-Doh & clay work',
      'Custom prop building',
      'Special effects elements',
      'Miniatures & models'
    ]
  }
]

export default function Services() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 lg:pt-40 pb-20 section-padding relative">
        {/* Large decorative number */}
        <div className="absolute right-0 top-20 translate-x-1/4 display-number opacity-0 animate-fade-in">
          02
        </div>

        <div className="relative max-w-3xl">
          <div className="flex items-center gap-4 mb-8 opacity-0 animate-fade-in">
            <span className="w-12 h-px bg-ep-accent" />
            <span className="text-xs uppercase tracking-widest text-ep-accent">What We Offer</span>
          </div>
          <h1 className="font-display text-display-lg lg:text-display-xl text-ep-white mb-6 opacity-0 animate-fade-in-up stagger-1">
            Our Services
          </h1>
          <p className="text-xl text-ep-silver leading-relaxed opacity-0 animate-fade-in-up stagger-2">
            Everything you need for world-class commercial photography, 
            all under one roof. We've built a team that covers every aspect 
            of production, so you can focus on your brand.
          </p>
        </div>
      </section>

      {/* Separator */}
      <div className="sep-line-accent" />

      {/* Services List */}
      <section className="section-padding">
        <div className="space-y-0">
          {services.map((service, index) => (
            <div 
              key={service.num}
              className="group"
            >
              {/* Service Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 py-16 lg:py-24">
                {/* Number + Title */}
                <div className="lg:col-span-4">
                  <span className="text-xs text-ep-accent mb-4 block">{service.num}</span>
                  <h2 className="font-display text-display-md text-ep-white mb-2 group-hover:text-ep-accent transition-colors duration-300">
                    {service.title}
                  </h2>
                  <p className="text-ep-gray uppercase tracking-wide text-sm">
                    {service.subtitle}
                  </p>
                </div>

                {/* Description */}
                <div className="lg:col-span-4">
                  <p className="text-ep-silver leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Features */}
                <div className="lg:col-span-4">
                  <ul className="space-y-3">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center text-ep-silver text-sm">
                        <span className="w-1.5 h-1.5 bg-ep-accent mr-4 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Separator between services */}
              {index < services.length - 1 && (
                <div className="sep-line" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative">
        <div className="sep-line-accent" />
        
        <div className="section-padding bg-ep-charcoal/50">
          <div className="max-w-2xl mx-auto text-center">
            <span className="text-xs uppercase tracking-widest text-ep-accent mb-6 block">Ready to Start?</span>
            <h2 className="font-display text-display-md text-ep-white mb-6">
              Let's build something together
            </h2>
            <p className="text-ep-silver leading-relaxed mb-10">
              Have a project in mind? We'd love to hear about it and discuss 
              how our team can bring your vision to life.
            </p>
            <Link href="/contact" className="btn-primary">
              Start a Conversation
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
