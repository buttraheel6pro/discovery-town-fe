/** Horizontal-scroll package card for events browse (package-only services). */
'use client'

import { Clock3, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ListingCard } from '@/components/customer/listing-card'
import { buildPrivateEventBookingHref } from '@/lib/event-package-catalog'
import type { EventPackage, SchedulingService } from '@/lib/types'

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

function guestCapacityLabel(pkg: EventPackage): string | null {
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

function durationLabel(pkg: EventPackage): string {
  if (pkg.duration == null) {
    return pkg.isWholeVenue ? 'Whole venue party' : '2 Hours (Party Room)'
  }
  const hours = Math.round((pkg.duration / 60) * 10) / 10
  return pkg.isWholeVenue ? `${hours} Hours Party Time` : `${hours} Hours (Party Room)`
}

interface EventPackageScrollCardProps {
  readonly pkg: EventPackage
  readonly bookingService: SchedulingService
}

export function EventPackageScrollCard({
  pkg,
  bookingService,
}: Readonly<EventPackageScrollCardProps>) {
  const href = buildPrivateEventBookingHref(bookingService.id, pkg.id)
  const guestLabel = guestCapacityLabel(pkg)
  const imageUrl =
    bookingService.imageUrl ??
    'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1200&q=80'

  return (
    <div className="flex w-[280px] shrink-0 snap-start self-stretch sm:w-[300px]">
      <ListingCard
        fillHeight
        className="w-full"
        href={href}
        title={pkg.name}
        description={guestLabel ?? durationLabel(pkg)}
        imageUrl={imageUrl}
        topLeft={
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className={tierBadgeClass(pkg.tier)}>{pkg.tier}</Badge>
            <Badge variant="secondary" className="text-[10px] font-semibold">
              {bookingService.category.name}
            </Badge>
          </div>
        }
        bottomRight={
          <span className="rounded-md bg-black/70 px-2.5 py-1 text-sm font-bold text-white">
            ${pkg.basePrice}
          </span>
        }
        meta={
          <div className="flex min-h-[4.25rem] flex-col justify-start space-y-2 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 shrink-0" />
              <span>{durationLabel(pkg)}</span>
            </p>
            {guestLabel ? (
              <p className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-2">{guestLabel}</span>
              </p>
            ) : null}
          </div>
        }
        footer={
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            size="sm"
            type="button"
          >
            Book this package
          </Button>
        }
      />
    </div>
  )
}
