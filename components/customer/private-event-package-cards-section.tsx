/** Reusable events-page package card grid for private party booking deep links. */
'use client'

import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { buildPrivateEventBookingHref } from '@/lib/event-package-catalog'
import type { EventPackage } from '@/lib/types'

function tierBadgeClass(tier: EventPackage['tier']): string {
  switch (tier) {
    case 'SILVER':
      return 'bg-slate-100 text-slate-700'
    case 'GOLD':
      return 'bg-amber-100 text-amber-800'
    case 'PLATINUM':
      return 'bg-purple-100 text-purple-700'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function defaultGuestCapacityLabel(pkg: EventPackage): string | null {
  const guestFeature = pkg.features.find((feature) =>
    feature.toLowerCase().startsWith('up to'),
  )
  if (guestFeature) {
    return guestFeature
  }
  if (pkg.maxChildSeats == null || pkg.maxAdultSeats == null) {
    return null
  }
  return `Up to ${pkg.maxChildSeats} children · ${pkg.maxAdultSeats} adults`
}

function defaultDurationLabel(pkg: EventPackage): string {
  if (pkg.duration == null) {
    return pkg.isWholeVenue ? 'Whole venue party' : '2 Hours (Party Room)'
  }
  const hours = Math.round((pkg.duration / 60) * 10) / 10
  if (pkg.isWholeVenue) {
    return `${hours} Hours Party Time`
  }
  return `${hours} Hours (Party Room)`
}

interface PrivateEventPackageCardProps {
  readonly pkg: EventPackage
  readonly bookingServiceId: string
  readonly imageUrl: string
  readonly priceLabel: string
  readonly guestLabel: string | null
  readonly durationLabel: string
  readonly featurePreviewCount?: number
}

function PrivateEventPackageCard({
  pkg,
  bookingServiceId,
  imageUrl,
  priceLabel,
  guestLabel,
  durationLabel,
  featurePreviewCount = 6,
}: Readonly<PrivateEventPackageCardProps>) {
  const highlights = pkg.features
    .filter(Boolean)
    .filter((feature) => feature !== guestLabel)
    .filter(
      (feature) =>
        pkg.depositAmount == null || !feature.toLowerCase().includes('deposit'),
    )
    .slice(0, featurePreviewCount)
  const href = buildPrivateEventBookingHref(bookingServiceId, pkg.id)

  return (
    <Link
      href={href}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card',
        'shadow-sm transition-all duration-200 hover:border-accent/40 hover:shadow-lg',
      )}
    >
      <div
        className="relative h-36 bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.02]"
        style={{ backgroundImage: `url(${imageUrl})` }}
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
          <span
            className={cn(
              'inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
              tierBadgeClass(pkg.tier),
            )}
          >
            {pkg.tier}
          </span>
          <span className="text-lg font-black text-white">{priceLabel}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3
          className="text-xl font-black text-foreground"
          style={{ fontFamily: 'var(--font-barlow)' }}
        >
          {pkg.name}
        </h3>
        {guestLabel ? (
          <p className="mt-1 text-sm font-medium text-muted-foreground">{guestLabel}</p>
        ) : null}
        <p className="mt-1 text-sm text-muted-foreground">{durationLabel}</p>
        {pkg.depositAmount != null ? (
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            ${pkg.depositAmount} non-refundable deposit
          </p>
        ) : null}

        <ul className="mt-4 flex-1 space-y-2">
          {highlights.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          type="button"
          className="mt-5 w-full gap-2 group-hover:bg-accent/90"
          tabIndex={-1}
          aria-hidden
        >
          Book this package
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </Link>
  )
}

export interface PrivateEventPackageCardsSectionProps {
  readonly sectionId: string
  readonly eyebrow: string
  readonly title: string
  readonly description: string
  readonly packages: readonly EventPackage[]
  readonly bookingServiceId: string
  readonly cardImages: Record<string, string>
  readonly priceLabels: Record<string, string>
  readonly defaultImageUrl: string
}

export function PrivateEventPackageCardsSection({
  sectionId,
  eyebrow,
  title,
  description,
  packages,
  bookingServiceId,
  cardImages,
  priceLabels,
  defaultImageUrl,
}: Readonly<PrivateEventPackageCardsSectionProps>) {
  if (packages.length === 0) {
    return null
  }

  return (
    <section
      className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8"
      aria-labelledby={sectionId}
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>
        <h2
          id={sectionId}
          className="text-balance text-3xl font-black text-foreground md:text-4xl"
          style={{ fontFamily: 'var(--font-barlow)' }}
        >
          {title}
        </h2>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">{description}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {packages.map((pkg) => {
          const guestLabel = defaultGuestCapacityLabel(pkg)
          return (
            <PrivateEventPackageCard
              key={pkg.id}
              pkg={pkg}
              bookingServiceId={bookingServiceId}
              imageUrl={cardImages[pkg.id] ?? defaultImageUrl}
              priceLabel={priceLabels[pkg.id] ?? `$${pkg.basePrice}`}
              guestLabel={guestLabel}
              durationLabel={defaultDurationLabel(pkg)}
              featurePreviewCount={pkg.isWholeVenue ? 7 : 6}
            />
          )
        })}
      </div>
    </section>
  )
}
