import Image from 'next/image'
import TeamAccordion from '@/components/TeamAccordion'
import vendorData from '../../../content/team/vendors.json'

export default function Team() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 lg:pt-40 pb-20 section-padding relative">
        {/* Large decorative number */}
        <div className="absolute right-0 top-20 translate-x-1/4 display-number opacity-0 animate-fade-in">
          03
        </div>

        <div className="relative max-w-3xl">
          <div className="flex items-center gap-4 mb-8 opacity-0 animate-fade-in">
            <span className="w-12 h-px bg-ep-accent" />
            <span className="text-xs uppercase tracking-widest text-ep-accent">Who We Are</span>
          </div>
          <h1 className="font-display text-display-lg lg:text-display-xl text-ep-white mb-6 opacity-0 animate-fade-in-up stagger-1">
            Meet the Team
          </h1>
          <p className="text-xl text-ep-silver leading-relaxed opacity-0 animate-fade-in-up stagger-2">
            A collective of elite professionals who've spent years crafting 
            imagery for the world's most demanding brands.
          </p>
        </div>
      </section>

      {/* Separator */}
      <div className="sep-line-accent" />

      {/* Studio Manager */}
      <section className="section-padding">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Photo */}
          <div className="lg:col-span-4">
            <div className="relative aspect-[4/5] bg-ep-slate overflow-hidden border border-ep-graphite">
              <Image
                src={`/images/headshots/${vendorData.studioLead.photo}`}
                alt={vendorData.studioLead.name}
                fill
                className="object-cover"
              />
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-ep-accent" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-ep-accent" />
            </div>
          </div>

          {/* Info */}
          <div className="lg:col-span-8 flex flex-col justify-center">
            <span className="text-xs uppercase tracking-widest text-ep-accent mb-4">Studio Manager</span>
            <h2 className="font-display text-display-md lg:text-display-lg text-ep-white mb-3">
              {vendorData.studioLead.name}
            </h2>
            <p className="text-ep-gray mb-8">
              {vendorData.studioLead.title}
            </p>
            <div className="w-16 h-px bg-ep-graphite mb-8" />
            <p className="text-ep-silver leading-relaxed text-lg max-w-2xl">
              {vendorData.studioLead.bio}
            </p>
          </div>
        </div>
      </section>

      {/* Separator */}
      <div className="sep-line" />

      {/* Team Section Header */}
      <section className="section-padding-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-widest text-ep-accent mb-4 block">The Crew</span>
            <h2 className="font-display text-display-sm text-ep-white">
              Our talented team
            </h2>
          </div>
          <p className="text-ep-gray text-sm hidden md:block">
            Click to expand each category
          </p>
        </div>
      </section>

      {/* Team Accordion */}
      <section className="px-6 md:px-12 lg:px-20 xl:px-32 pb-24 md:pb-32">
        <TeamAccordion categories={vendorData.categories} />
      </section>
    </>
  )
}