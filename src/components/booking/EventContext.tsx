interface Props {
  charityInfo: string | null
  imageUrl: string | null
}

/**
 * Optional "about this event" band between the hero and the slot grid.
 * Renders nothing when both fields are empty so plain events skip it entirely.
 */
export default function EventContext({ charityInfo, imageUrl }: Props) {
  const text = charityInfo?.trim() ?? ''
  const image = imageUrl?.trim() ?? ''
  if (!text && !image) return null

  // Blank lines separate paragraphs; single newlines inside a paragraph are kept via whitespace-pre-line.
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  const both = Boolean(text && image)

  return (
    <>
      <div className="sep-line" />
      <section className="section-padding-sm bg-ep-charcoal/40">
        <div className={both ? 'grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start' : ''}>
          {image && (
            <figure className={both ? 'lg:col-span-5' : 'max-w-xl'}>
              {/* Plain <img>: the URL is pasted into events.image_url and can live on any host. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt=""
                loading="lazy"
                className="w-full max-h-[28rem] object-cover border border-ep-graphite"
              />
            </figure>
          )}

          {text && (
            <div className={both ? 'lg:col-span-7' : 'max-w-3xl'}>
              <div className="flex items-center gap-4 mb-6">
                <span className="w-12 h-px bg-ep-accent" />
                <span className="text-xs uppercase tracking-widest text-ep-accent">About this event</span>
              </div>
              <div className="space-y-5">
                {paragraphs.map((p, i) => (
                  <p key={i} className="text-lg text-ep-mist leading-relaxed whitespace-pre-line">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
