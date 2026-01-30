import ContactForm from '@/components/ContactForm'

export default function Contact() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 lg:pt-40 pb-20 section-padding relative">
        {/* Large decorative number */}
        <div className="absolute right-0 top-20 translate-x-1/4 display-number opacity-0 animate-fade-in">
          04
        </div>

        <div className="relative max-w-3xl">
          <div className="flex items-center gap-4 mb-8 opacity-0 animate-fade-in">
            <span className="w-12 h-px bg-ep-accent" />
            <span className="text-xs uppercase tracking-widest text-ep-accent">Get in Touch</span>
          </div>
          <h1 className="font-display text-display-lg lg:text-display-xl text-ep-white mb-6 opacity-0 animate-fade-in-up stagger-1">
            Let's Talk
          </h1>
          <p className="text-xl text-ep-silver leading-relaxed opacity-0 animate-fade-in-up stagger-2">
            Have a project in mind? We'd love to hear about it. 
            Tell us what you're working on and we'll get back to you shortly.
          </p>
        </div>
      </section>

      {/* Separator */}
      <div className="sep-line-accent" />

      {/* Contact Form Section */}
      <section className="section-padding">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          {/* Form */}
          <div className="lg:col-span-7">
            <ContactForm />
          </div>

          {/* Contact Info Sidebar */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32 space-y-12">
              {/* Email */}
              <div>
                <span className="text-xs uppercase tracking-widest text-ep-gray mb-4 block">Email</span>
                <a 
                  href="mailto:hello@effectivepixelproductions.com"
                  className="text-xl text-ep-white hover:text-ep-accent transition-colors font-display"
                >
                  hello@effectivepixelproductions.com
                </a>
              </div>

              {/* Separator */}
              <div className="sep-line" />

              {/* What to expect */}
              <div>
                <span className="text-xs uppercase tracking-widest text-ep-gray mb-6 block">What to Expect</span>
                <ul className="space-y-5">
                  <li className="flex items-start gap-4">
                    <span className="w-6 h-6 flex items-center justify-center border border-ep-accent text-ep-accent text-xs flex-shrink-0 mt-0.5">1</span>
                    <div>
                      <p className="text-ep-white mb-1">Quick Response</p>
                      <p className="text-ep-gray text-sm">We typically respond within 24 hours</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="w-6 h-6 flex items-center justify-center border border-ep-accent text-ep-accent text-xs flex-shrink-0 mt-0.5">2</span>
                    <div>
                      <p className="text-ep-white mb-1">Discovery Call</p>
                      <p className="text-ep-gray text-sm">We'll discuss your project scope and timeline</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="w-6 h-6 flex items-center justify-center border border-ep-accent text-ep-accent text-xs flex-shrink-0 mt-0.5">3</span>
                    <div>
                      <p className="text-ep-white mb-1">Custom Proposal</p>
                      <p className="text-ep-gray text-sm">We'll provide a tailored team recommendation</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Decorative element */}
              <div className="hidden lg:block relative h-32">
                <div className="absolute left-0 top-0 w-px h-full bg-gradient-to-b from-ep-accent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
