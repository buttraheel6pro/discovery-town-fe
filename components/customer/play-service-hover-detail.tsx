/** Hover preview card for a play service — opens when hovering the list thumbnail. */
'use client'

import Image from 'next/image'
import { Clock3, MapPin, Users } from 'lucide-react'

import { CatalogItemImagePreview } from '@/components/customer/catalog-item-image-preview'
import { Badge } from '@/components/ui/badge'
import {
  OPEN_PLAY_MEMBERSHIP_PASS_SERVICE_ID,
  OPEN_PLAY_SEASONAL_PASS_SERVICE_ID,
} from '@/lib/open-play-pass-catalog'
import { formatPrice } from '@/lib/utils'
import type { SchedulingService } from '@/lib/types'

export interface PlayServiceHoverDetailProps {
  readonly service: SchedulingService
  readonly imageSrc: string
  readonly label: string
}

function resolvePriceSuffix(service: SchedulingService): string {
  if (service.id === OPEN_PLAY_MEMBERSHIP_PASS_SERVICE_ID) {
    return '/mo'
  }
  if (service.id === OPEN_PLAY_SEASONAL_PASS_SERVICE_ID) {
    return '/season'
  }
  if (service.pricingModel === 'per_hour') {
    return '/hr'
  }
  if (service.pricingModel === 'per_person') {
    return '/person'
  }
  return ''
}

export function PlayServiceHoverDetail({
  service,
  imageSrc,
  label,
}: Readonly<PlayServiceHoverDetailProps>) {
  const priceSuffix = resolvePriceSuffix(service)
  const previewImageSrc = service.imageUrl ?? imageSrc

  return (
    <CatalogItemImagePreview imageSrc={imageSrc} label={label}>
      <div className="relative aspect-[16/10] overflow-hidden bg-muted/30">
        {previewImageSrc ? (
          <Image
            src={previewImageSrc}
            alt={service.name}
            fill
            className="object-cover"
            sizes="320px"
          />
        ) : (
          <div className="absolute inset-0 bg-secondary" aria-hidden />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <Badge className="mb-2 bg-accent text-accent-foreground text-[10px]">
            {service.category.name}
          </Badge>
          <p
            className="text-lg font-black text-white"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            {service.name}
          </p>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {service.description ?? 'No description available.'}
        </p>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5 shrink-0" />
            <span>{service.durationMinutes} mins</span>
          </p>
          <p className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>Up to {service.capacity} guests</span>
          </p>
          {service.location ? (
            <p className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-2">{service.location}</span>
            </p>
          ) : null}
        </div>
        <p className="text-base font-bold text-foreground">
          {formatPrice(service.basePrice)}
          {priceSuffix}
        </p>
      </div>
    </CatalogItemImagePreview>
  )
}
