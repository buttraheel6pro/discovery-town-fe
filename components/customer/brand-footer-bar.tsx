/** Shared teal footer bar — location, tagline, and stars on brand teal. */

import { Heart, MapPin, Star } from 'lucide-react'

import { locations } from '@/lib/mock-data'

const mainLocation = locations[0]
const cityLine = mainLocation
  ? `${mainLocation.city.toUpperCase()}, ${(mainLocation.country ?? 'Indiana').toUpperCase()}`
  : 'FISHERS, INDIANA'

export function BrandFooterBar() {
  return (
    <div className="bg-brand-teal text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 py-7 text-center sm:px-6 lg:flex-row lg:justify-between lg:gap-3 lg:py-8">
        <div className="flex shrink-0 items-center justify-center gap-2.5 lg:justify-start">
          <MapPin className="h-5 w-5 shrink-0 text-white" aria-hidden />
          <span
            className="text-sm font-bold uppercase tracking-[0.14em] sm:text-base"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            {cityLine}
          </span>
        </div>

        <div className="brand-footer-tagline-wrap flex min-w-0 max-w-full items-center justify-center gap-2 px-1 lg:flex-1">
          <Heart
            className="h-4 w-4 shrink-0 text-white"
            fill="none"
            strokeWidth={2.25}
            aria-hidden
          />
          <p className="brand-footer-tagline">
            A Place for Families to Play, Connect &amp; Thrive
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-center gap-2 lg:justify-end">
          <Star
            className="h-5 w-5 text-brand-gold"
            fill="none"
            strokeWidth={2}
            aria-hidden
          />
          <Star
            className="h-5 w-5 text-brand-gold"
            fill="none"
            strokeWidth={2}
            aria-hidden
          />
          <Star
            className="h-5 w-5 text-white"
            fill="none"
            strokeWidth={2}
            aria-hidden
          />
        </div>
      </div>
    </div>
  )
}
