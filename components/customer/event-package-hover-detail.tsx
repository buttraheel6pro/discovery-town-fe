/** Hover preview card for an event package — opens when hovering the list thumbnail. */
'use client'

import Image from 'next/image'
import { Clock3, Users } from 'lucide-react'

import { CatalogItemImagePreview } from '@/components/customer/catalog-item-image-preview'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import type { EventPackage, SchedulingService } from '@/lib/types'

const IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1200&q=80'

export interface EventPackageHoverDetailProps {
  readonly pkg: EventPackage
  readonly bookingService: SchedulingService
  readonly imageSrc: string
  readonly label: string
}

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

export function EventPackageHoverDetail({
  pkg,
  bookingService,
  imageSrc,
  label,
}: Readonly<EventPackageHoverDetailProps>) {
  const previewImageUrl = bookingService.imageUrl ?? IMAGE_FALLBACK
  const guestLabel = guestCapacityLabel(pkg)

  return (
    <CatalogItemImagePreview imageSrc={imageSrc} label={label}>
      <div className="relative aspect-[16/10] overflow-hidden bg-muted/30">
        <Image
          src={previewImageUrl}
          alt={pkg.name}
          fill
          className="object-cover"
          sizes="320px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <Badge className={`text-[10px] ${tierBadgeClass(pkg.tier)}`}>{pkg.tier}</Badge>
            <Badge className="bg-accent text-accent-foreground text-[10px]">
              {bookingService.category.name}
            </Badge>
          </div>
          <p
            className="text-lg font-black text-white"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            {pkg.name}
          </p>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {bookingService.description ??
            (pkg.features.length > 0 ? pkg.features.join(' · ') : 'No description available.')}
        </p>
        <div className="space-y-1.5 text-xs text-muted-foreground">
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
        <p className="text-base font-bold text-foreground">{formatPrice(pkg.basePrice)}</p>
      </div>
    </CatalogItemImagePreview>
  )
}
