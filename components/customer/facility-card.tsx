/** Facility listing card — Main Soft Play visual pattern, backed by scheduling service. */
import { Star, Users, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ListingCard } from '@/components/customer/listing-card'
import type { SchedulingService } from '@/lib/types'

interface FacilityCardProps {
  readonly service: SchedulingService
}

function priceChipLabel(service: SchedulingService): string {
  if (service.pricingModel === 'per_hour') {
    return `$${service.basePrice}/hr`
  }
  if (service.pricingModel === 'per_person') {
    return `$${service.basePrice}/person`
  }
  return `$${service.basePrice}`
}

export function FacilityCard({ service }: FacilityCardProps) {
  const sportLabel = service.sport ?? service.serviceType.replace(/_/g, ' ')
  const rating = service.rating ?? 0
  const reviewCount = service.reviewCount ?? 0
  const amenities = service.amenities ?? []
  const floorLabel = service.floor ?? '—'
  const isBookable = service.isActive

  const topLeft = (
    <>
      <Badge className="bg-accent text-accent-foreground text-xs font-semibold">
        {sportLabel}
      </Badge>
      {!isBookable ? (
        <Badge variant="destructive" className="text-xs">
          Unavailable
        </Badge>
      ) : null}
    </>
  )

  const bottomRight = (
    <div className="bg-black/70 backdrop-blur-sm text-white text-sm font-bold px-2.5 py-1 rounded-md">
      {priceChipLabel(service)}
    </div>
  )

  const meta = (
    <>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
          <span className="font-semibold text-foreground">{rating}</span>
          <span>({reviewCount})</span>
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {service.capacity}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          {floorLabel}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {amenities.slice(0, 3).map((a) => (
          <span
            key={a}
            className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full"
          >
            {a}
          </span>
        ))}
        {amenities.length > 3 ? (
          <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
            +{amenities.length - 3}
          </span>
        ) : null}
      </div>
    </>
  )

  const footer = (
    <Button
      className="w-full bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-colors font-semibold"
      disabled={!isBookable}
    >
      {isBookable ? 'Book Now' : 'Unavailable'}
    </Button>
  )

  return (
    <ListingCard
      href={`/facilities/${service.id}`}
      title={service.name}
      description={service.description ?? ''}
      imageUrl={service.imageUrl ?? undefined}
      topLeft={topLeft}
      bottomRight={bottomRight}
      meta={meta}
      footer={footer}
    />
  )
}
