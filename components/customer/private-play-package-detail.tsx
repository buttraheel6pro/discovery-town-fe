/** Full detail panel for a selected Private Play event package (below radio list). */
'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import type { EventPackage } from '@/lib/types'

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

export interface PrivatePlayPackageDetailProps {
  readonly package: EventPackage
  readonly defaultDurationMinutes: number
}

export function PrivatePlayPackageDetail({
  package: pkg,
  defaultDurationMinutes,
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
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
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
              <Badge variant="outline" className="text-xs">
                Private party room
              </Badge>
            )}
            {pkg.depositAmount != null ? (
              <Badge variant="outline" className="text-xs">
                {formatPrice(pkg.depositAmount)} deposit
                {pkg.depositNonRefundable ? ' (non-refundable)' : ''}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-4xl font-black text-foreground sm:text-5xl">
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
