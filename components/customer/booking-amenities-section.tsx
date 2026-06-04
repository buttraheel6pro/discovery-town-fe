/** Amenities grid — service amenities plus free category-linked add-ons. */
'use client'

import { CheckCircle2 } from 'lucide-react'

import { buildBookingAmenityLabels } from '@/lib/booking-amenities'
import type { SchedulingServiceAddOn } from '@/lib/types'

export interface BookingAmenitiesSectionProps {
  readonly serviceAmenities?: readonly string[]
  readonly freeCategoryAddOns: readonly SchedulingServiceAddOn[]
  readonly title?: string
  readonly className?: string
}

export function BookingAmenitiesSection({
  serviceAmenities,
  freeCategoryAddOns,
  title = 'Amenities',
  className,
}: Readonly<BookingAmenitiesSectionProps>) {
  const labels = buildBookingAmenityLabels(serviceAmenities, freeCategoryAddOns)

  if (labels.length === 0) {
    return null
  }

  return (
    <section className={className}>
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {labels.map((label) => (
          <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" aria-hidden />
            {label}
          </div>
        ))}
      </div>
    </section>
  )
}
