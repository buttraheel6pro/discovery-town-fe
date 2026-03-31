import Link from 'next/link'
import Image from 'next/image'
import { Star, Clock, Users, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Facility } from '@/lib/types'

interface FacilityCardProps {
  facility: Facility
}

export function FacilityCard({ facility }: FacilityCardProps) {
  return (
    <article className="group bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex flex-col">
      <div className="relative h-52 overflow-hidden">
        <Image
          src={facility.imageUrl}
          alt={facility.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Badge className="bg-accent text-accent-foreground text-xs font-semibold">
            {facility.sport}
          </Badge>
          {!facility.isAvailable && (
            <Badge variant="destructive" className="text-xs">Unavailable</Badge>
          )}
        </div>
        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-sm font-bold px-2.5 py-1 rounded-md">
          £{facility.pricePerHour}/hr
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-bold text-foreground text-base leading-tight">{facility.name}</h3>
          <p className="text-muted-foreground text-sm mt-1 line-clamp-2 leading-relaxed">
            {facility.description}
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold text-foreground">{facility.rating}</span>
            <span>({facility.reviewCount})</span>
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {facility.capacity}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {facility.floor}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {facility.amenities.slice(0, 3).map((a) => (
            <span key={a} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
              {a}
            </span>
          ))}
          {facility.amenities.length > 3 && (
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
              +{facility.amenities.length - 3}
            </span>
          )}
        </div>

        <div className="mt-auto pt-2">
          <Link href={`/facilities/${facility.id}`}>
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-colors font-semibold"
              disabled={!facility.isAvailable}
            >
              {facility.isAvailable ? 'Book Now' : 'Unavailable'}
            </Button>
          </Link>
        </div>
      </div>
    </article>
  )
}
