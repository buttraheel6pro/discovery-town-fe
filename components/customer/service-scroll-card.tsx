/** Compact reusable service listing card for horizontal rails. */
import { Clock3, MapPin, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ListingCard } from '@/components/customer/listing-card'
import type { SchedulingService } from '@/lib/types'

interface ServiceScrollCardProps {
  readonly service: SchedulingService
}

function getServiceHref(service: SchedulingService): string {
  if (service.categoryId === 'cat-private-play') {
    return '/events/svc-5?privateEvent=1'
  }
  if (service.categoryId === 'cat-we-bring-play') {
    return '/we-bring-to-play'
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

function getCtaLabel(service: SchedulingService): string {
  if (service.serviceType === 'PRIVATE_HIRE') {
    return 'Plan booking'
  }
  if (service.bookingMode === 'SCHEDULED') {
    return 'View times'
  }
  return 'Book now'
}

export function ServiceScrollCard({ service }: Readonly<ServiceScrollCardProps>) {
  return (
    <div className="w-[280px] shrink-0 snap-start sm:w-[300px]">
      <ListingCard
        href={getServiceHref(service)}
        title={service.name}
        description={service.description ?? ''}
        imageUrl={service.imageUrl ?? undefined}
        topLeft={
          <Badge className="bg-accent text-accent-foreground text-[10px] font-semibold">
            {service.category.name}
          </Badge>
        }
        bottomRight={
          <span className="rounded-md bg-black/70 px-2.5 py-1 text-sm font-bold text-white">
            £{service.basePrice}
          </span>
        }
        meta={
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" />
              <span>{service.durationMinutes} mins</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>Up to {service.capacity} guests</span>
            </p>
            {service.location ? (
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                <span>{service.location}</span>
              </p>
            ) : null}
          </div>
        }
        footer={
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            size="sm"
          >
            {getCtaLabel(service)}
          </Button>
        }
      />
    </div>
  )
}
