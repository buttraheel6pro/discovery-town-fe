/** Compact reusable service listing card for horizontal rails. */
'use client'

import { useMemo } from 'react'
import { Clock3, MapPin, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ListingCard } from '@/components/customer/listing-card'
import {
  isOpenPlayPassCatalogService,
  OPEN_PLAY_MEMBERSHIP_PASS_SERVICE_ID,
  OPEN_PLAY_SEASONAL_PASS_SERVICE_ID,
} from '@/lib/open-play-pass-catalog'
import type { SchedulingCategoryPlacementFields } from '@/lib/catalog-placement'
import { useScheduling } from '@/lib/scheduling-store'
import { buildSchedulingCategoryById } from '@/lib/scheduling-visibility'
import { cn } from '@/lib/utils'
import {
  isEventSlotCartCheckoutService,
  isGymClassCartCheckoutService,
  isPlayClassCartCheckoutService,
  usesBuyNowListingCta,
} from '@/lib/play-cart'
import {
  isPrivatePlayService,
  shouldUsePrivatePlayDetailLayout,
  usesPlayPackageBookingLayout,
} from '@/lib/private-play-packages'
import { usesEventTicketBookingSidebar } from '@/lib/scheduling-slot-availability'
import type { EventPackage, SchedulingService } from '@/lib/types'

interface ServiceScrollCardProps {
  readonly service: SchedulingService
}

function getServiceHref(
  service: SchedulingService,
  packages: readonly EventPackage[],
): string {
  if (shouldUsePrivatePlayDetailLayout(service, packages)) {
    return `/facilities/${service.id}`
  }
  if (usesEventTicketBookingSidebar(service)) {
    return `/events/${service.id}`
  }
  if (service.categoryId === 'cat-we-bring-play') {
    return '/play#product-menu-pcat-we-bring-party'
  }

  if (
    service.serviceType === 'OPEN_PLAY' ||
    service.serviceType === 'COURT_BOOKING' ||
    service.serviceType === 'PRIVATE_HIRE'
  ) {
    return `/facilities/${service.id}`
  }

  if (
    service.serviceType === 'GYM_CLASS' ||
    service.serviceType === 'SWIM_CLASS' ||
    service.serviceType === 'COACHING_SESSION' ||
    service.serviceType === 'FITNESS_ASSESSMENT'
  ) {
    return `/classes/${service.id}`
  }

  return `/events/${service.id}`
}

function getCtaLabel(
  service: SchedulingService,
  packages: readonly EventPackage[],
  categoryById: ReadonlyMap<string, SchedulingCategoryPlacementFields>,
): string {
  if (isPrivatePlayService(service) || usesPlayPackageBookingLayout(service, packages)) {
    return 'Buy now'
  }
  if (usesBuyNowListingCta(service)) {
    return 'Buy now'
  }
  if (service.categoryId === 'cat-we-bring-play') {
    return 'Book now'
  }
  if (service.serviceType === 'PRIVATE_HIRE') {
    return 'Plan booking'
  }
  if (service.bookingMode === 'SCHEDULED') {
    const category = categoryById.get(service.categoryId) ?? null
    const addsToCartFromDetail =
      isPlayClassCartCheckoutService(service, category) ||
      isGymClassCartCheckoutService(service) ||
      (isEventSlotCartCheckoutService(service, categoryById) &&
        !isGymClassCartCheckoutService(service))
    if (addsToCartFromDetail) {
      return 'Add to cart'
    }
    return 'View times'
  }
  return 'Book now'
}

export function ServiceScrollCard({ service }: Readonly<ServiceScrollCardProps>) {
  const { packages, categories } = useScheduling()
  const categoryById = useMemo(
    () => buildSchedulingCategoryById(categories),
    [categories],
  )
  const isPassCatalog = isOpenPlayPassCatalogService(service)
  const activePackageCount = useMemo(
    () => packages.filter((pkg) => pkg.serviceId === service.id && pkg.isActive).length,
    [packages, service.id],
  )

  const priceSuffix =
    service.id === OPEN_PLAY_MEMBERSHIP_PASS_SERVICE_ID
      ? '/mo'
      : service.id === OPEN_PLAY_SEASONAL_PASS_SERVICE_ID
        ? '/season'
        : service.pricingModel === 'per_hour'
          ? '/hr'
          : service.pricingModel === 'per_person'
            ? '/person'
            : ''

  return (
    <div className="flex w-[280px] shrink-0 snap-start self-stretch sm:w-[300px]">
      <ListingCard
        fillHeight
        className="w-full"
        href={getServiceHref(service, packages)}
        title={service.name}
        description={service.description ?? ''}
        imageUrl={service.imageUrl ?? undefined}
        topLeft={
          <div className="flex items-center gap-1.5">
            <Badge className="bg-accent text-accent-foreground text-[10px] font-semibold">
              {service.category.name}
            </Badge>
            {activePackageCount > 0 ? (
              <Badge variant="secondary" className="text-[10px] font-semibold">
                {activePackageCount} package{activePackageCount === 1 ? '' : 's'}
              </Badge>
            ) : null}
          </div>
        }
        bottomRight={
          <span className="rounded-md bg-black/70 px-2.5 py-1 text-sm font-bold text-white">
            ${service.basePrice}
            {priceSuffix}
          </span>
        }
        meta={
          <div className="flex min-h-[4.25rem] flex-col justify-start space-y-2 text-xs text-muted-foreground">
            {isPassCatalog ? (
              <p className="flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 shrink-0" />
                <span>Unlimited play — no slots</span>
              </p>
            ) : (
              <p className="flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 shrink-0" />
                <span>{service.durationMinutes} mins</span>
              </p>
            )}
            <p className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span>Up to {service.capacity} guests</span>
            </p>
            <p
              className={cn(
                'flex items-center gap-1.5',
                !service.location && 'invisible',
              )}
              aria-hidden={!service.location}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">{service.location ?? '—'}</span>
            </p>
          </div>
        }
        footer={
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            size="sm"
          >
            {getCtaLabel(service, packages, categoryById)}
          </Button>
        }
      />
    </div>
  )
}
