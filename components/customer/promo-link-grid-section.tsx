/** Reusable promotional image grid section with linked cards and optional CTA. */
import Link from 'next/link'

import { Button } from '@/components/ui/button'

interface PromoLinkItem {
  readonly id: string
  readonly title: string
  readonly imageUrl: string
  readonly href: string
}

interface PromoLinkGridSectionProps {
  readonly eyebrow?: string
  readonly title: string
  readonly description: string
  readonly items: readonly PromoLinkItem[]
  readonly ctaLabel?: string
  readonly ctaHref?: string
}

export function PromoLinkGridSection({
  eyebrow,
  title,
  description,
  items,
  ctaLabel,
  ctaHref,
}: Readonly<PromoLinkGridSectionProps>) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>
        ) : null}
        <h2
          className="text-balance text-3xl font-black text-foreground md:text-4xl"
          style={{ fontFamily: 'var(--font-barlow)' }}
        >
          {title}
        </h2>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">{description}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group relative h-36 overflow-hidden rounded-2xl border border-border"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
              style={{ backgroundImage: `url(${item.imageUrl})` }}
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-black/20" />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-sm font-semibold text-white">{item.title}</p>
            </div>
          </Link>
        ))}
      </div>

      {ctaLabel && ctaHref ? (
        <div className="mt-6 flex justify-end">
          <Link href={ctaHref}>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              {ctaLabel}
            </Button>
          </Link>
        </div>
      ) : null}
    </section>
  )
}
