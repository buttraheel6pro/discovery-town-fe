/** Full detail panel for the selected Private Play event package (below tier tabs). */
'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BOOKING_CART_SURFACE_CLASS } from '@/components/customer/booking-cart-card'
import { cn, formatPrice } from '@/lib/utils'
import type { EventPackage } from '@/lib/types'

function tierBadgeClass(tier: EventPackage['tier']): string {
  switch (tier) {
    case 'SILVER':
      return 'border border-slate-300 bg-white text-slate-700'
    case 'GOLD':
      return 'border border-amber-300 bg-white text-amber-800'
    case 'PLATINUM':
      return 'border border-purple-300 bg-white text-purple-700'
    default:
      return 'border border-border bg-white text-muted-foreground'
  }
}

export interface PrivatePlayPackageDetailProps {
  readonly package: EventPackage
  readonly defaultDurationMinutes: number
  /** When true, renders inside a tab panel (no outer card chrome). */
  readonly embedded?: boolean
}

export function PrivatePlayPackageDetail({
  package: pkg,
  defaultDurationMinutes,
  embedded = false,
}: Readonly<PrivatePlayPackageDetailProps>) {
  const [showAllFeatures, setShowAllFeatures] = useState(false)
  const features = pkg.features.filter(Boolean)
  const visibleFeatures = showAllFeatures ? features : features.slice(0, 8)
  const partyMinutes = pkg.duration ?? defaultDurationMinutes
  const partyHours = Math.round((partyMinutes / 60) * 10) / 10
  const guestSummary =
    pkg.maxChildSeats != null && pkg.maxAdultSeats != null
      ? `Up to ${pkg.maxChildSeats} children · ${pkg.maxAdultSeats} adults`
      : null

  return (
    <div
      className={cn(
        embedded
          ? undefined
          : cn(
              'rounded-2xl border border-border p-6 shadow-sm sm:p-8',
              BOOKING_CART_SURFACE_CLASS,
            ),
      )}
      style={embedded ? undefined : { backgroundColor: 'var(--nav-cream)' }}
    >
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <h3
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            {pkg.name}
          </h3>
          <div className="flex flex-wrap gap-2">
            <Badge
              className={`text-xs font-bold uppercase tracking-wider ${tierBadgeClass(pkg.tier)}`}
            >
              {pkg.tier}
            </Badge>
            {pkg.isWholeVenue ? (
              <Badge className="border-amber-500/50 bg-amber-500/15 text-xs font-semibold text-amber-950 dark:text-amber-100">
                Whole venue · approval required
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-white text-xs">
                Private party room
              </Badge>
            )}
            {pkg.depositAmount != null ? (
              <Badge variant="outline" className="bg-white text-xs">
                {formatPrice(pkg.depositAmount)} deposit
                {pkg.depositNonRefundable ? ' (non-refundable)' : ''}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="text-3xl font-black text-foreground sm:text-4xl">
            {formatPrice(pkg.basePrice)}
          </p>
          <p className="mt-1 text-sm font-medium text-muted-foreground">Package price</p>
        </div>
      </div>

      <div className="space-y-6 pt-6">
        {guestSummary ? (
          <p className="text-sm font-medium text-muted-foreground md:text-base">{guestSummary}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          {partyHours} hours party time
          {pkg.setupTime != null ? ` · ${pkg.setupTime} min setup` : ''}
        </p>

        {features.length > 0 ? (
          <section className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              What&apos;s included
            </h4>
            <ul className="grid gap-2 sm:grid-cols-2">
              {visibleFeatures.map((feature, index) => (
                <li
                  key={`${feature}-${index}`}
                  className="flex items-start gap-3 text-sm text-foreground md:text-base"
                >
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                    aria-hidden
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {features.length > 8 ? (
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-sm font-medium text-accent"
                onClick={() => setShowAllFeatures((prev) => !prev)}
              >
                {showAllFeatures
                  ? 'Show fewer inclusions'
                  : `Show all ${features.length} inclusions`}
              </Button>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  )
}
