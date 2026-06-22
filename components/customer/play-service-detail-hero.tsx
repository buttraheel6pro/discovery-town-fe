/** Facility-style hero for play category detail — service or category fallback. */
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, MapPin, Star, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { SchedulingCategory, SchedulingService } from '@/lib/types'

export interface PlayServiceDetailHeroProps {
  readonly service: SchedulingService | null
  readonly category: SchedulingCategory
  readonly categoryImageSrc: string
  readonly categoryDescription: string
  readonly backHref?: string
  readonly backLabel?: string
}

function resolvePriceSuffix(service: SchedulingService): string {
  if (service.pricingModel === 'per_hour') {
    return '/hr'
  }
  if (service.pricingModel === 'per_person') {
    return '/person'
  }
  return ''
}

export function PlayServiceDetailHero({
  service,
  category,
  categoryImageSrc,
  categoryDescription,
  backHref = '/play',
  backLabel = 'Back to Play',
}: Readonly<PlayServiceDetailHeroProps>) {
  const imageUrl = service?.imageUrl ?? categoryImageSrc
  const title = service?.name ?? category.name
  const badgeLabel = service?.sport ?? service?.serviceType ?? category.name
  const rating = service?.rating ?? 0
  const reviewCount = service?.reviewCount ?? 0
  const floorLabel = service?.floor ?? 1
  const capacity = service?.capacity
  const basePrice = service?.basePrice
  const priceSuffix = service ? resolvePriceSuffix(service) : ''

  return (
    <div className="relative h-36 sm:h-48">
      {imageUrl ? (
        <Image src={imageUrl} alt={title} fill className="object-cover" priority />
      ) : (
        <div className="absolute inset-0 bg-secondary" aria-hidden />
      )}
      <div className="absolute inset-0 bg-primary/60" />
      <div className="absolute inset-0 flex flex-col p-6 sm:p-10">
        <Link
          href={backHref}
          className="flex w-fit items-center gap-1 pt-1 text-sm text-white/80 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {backLabel}
        </Link>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge className="mb-2 bg-accent text-accent-foreground">{badgeLabel}</Badge>
            <h1
              className="text-3xl font-black text-balance text-white sm:text-4xl"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              {title}
            </h1>
            {service ? (
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/80">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {rating} ({reviewCount} reviews)
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Floor {floorLabel}
                </span>
                {capacity != null ? (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Capacity: {capacity}
                  </span>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 max-w-xl text-sm text-white/80">{categoryDescription}</p>
            )}
          </div>
          {service && basePrice != null ? (
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-white/60">From</p>
              <p className="text-3xl font-black text-accent">
                ${basePrice}
                <span className="text-base font-normal text-white/80">{priceSuffix}</span>
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
