'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Vendor {
  id: string
  name: string
  bio: string
  photo: string
}

interface Category {
  id: string
  title: string
  description: string
  categoryImage: string
  vendors: Vendor[]
}

interface TeamAccordionProps {
  categories: Category[]
}

export default function TeamAccordion({ categories }: TeamAccordionProps) {
  const [openCategory, setOpenCategory] = useState<string | null>(categories[0]?.id || null)

  const toggleCategory = (categoryId: string) => {
    setOpenCategory(openCategory === categoryId ? null : categoryId)
  }

  return (
    <div className="space-y-4">
      {categories.map((category, index) => (
        <div key={category.id} className="border border-ep-graphite overflow-hidden">
          {/* Category Header */}
          <button
            onClick={() => toggleCategory(category.id)}
            className="w-full relative h-20 md:h-24 group cursor-pointer bg-ep-charcoal hover:bg-ep-slate transition-colors duration-300"
          >
            {/* Content */}
            <div className="relative h-full flex items-center justify-between px-6 md:px-10">
              <div className="flex items-center gap-6">
                {/* Number indicator */}
                <span className="text-xs text-ep-accent">0{index + 1}</span>
                
                <h3 className="font-display text-xl md:text-2xl text-ep-white group-hover:text-ep-accent transition-colors duration-300">
                  {category.title}
                </h3>
                <span className="text-ep-gray text-sm hidden sm:inline">
                  ({category.vendors.length})
                </span>
              </div>
              
              {/* Expand Icon */}
              <div className={`w-10 h-10 flex items-center justify-center border border-ep-graphite group-hover:border-ep-accent transition-all duration-300 ${openCategory === category.id ? 'rotate-180 bg-ep-accent border-ep-accent' : ''}`}>
                <svg 
                  className={`w-4 h-4 transition-colors duration-300 ${openCategory === category.id ? 'text-ep-black' : 'text-ep-white'}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Hover accent line */}
            <div className="absolute bottom-0 left-0 w-0 h-px bg-ep-accent transition-all duration-500 group-hover:w-full" />
          </button>

          {/* Expanded Content */}
          <div 
            className={`transition-all duration-500 ease-in-out overflow-hidden ${
              openCategory === category.id ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="bg-ep-black/50 p-6 md:p-10 space-y-0">
              {category.vendors.map((vendor, vendorIndex) => (
                <div 
                  key={vendor.id}
                  className={`flex flex-col md:flex-row gap-6 md:gap-10 py-8 ${
                    vendorIndex !== category.vendors.length - 1 ? 'border-b border-ep-graphite' : ''
                  }`}
                >
                  {/* Vendor Photo */}
                  <div className="flex-shrink-0">
                    <div className="relative w-28 h-28 md:w-36 md:h-36 bg-ep-slate overflow-hidden border border-ep-graphite">
                      {/* Placeholder - will show actual image when available */}
                      <div className="absolute inset-0 flex items-center justify-center text-ep-gray text-xs uppercase tracking-wide">
                        Photo
                      </div>
                      {/* Uncomment when you have real images:
                      <Image
                        src={`/images/headshots/${vendor.photo}`}
                        alt={vendor.name}
                        fill
                        className="object-cover"
                      />
                      */}
                      {/* Corner accent */}
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-ep-accent" />
                    </div>
                  </div>

                  {/* Vendor Info */}
                  <div className="flex-grow flex flex-col justify-center">
                    <h4 className="font-display text-xl md:text-2xl text-ep-white mb-3">
                      {vendor.name}
                    </h4>
                    <p className="text-ep-silver leading-relaxed">
                      {vendor.bio}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
