/** Package selector — choose a tiered event package for pricing/features. */
'use client'

import { CheckCircle2, Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { EventPackage } from '@/lib/types'

export interface PackageSelectorProps {
  readonly packages: EventPackage[]
  readonly selectedId: string | null
  readonly onSelect: (packageId: string) => void
  readonly className?: string
}

function tierStyles(tier: EventPackage['tier']): { border: string; badge: string } {
  switch (tier) {
    case 'SILVER':
      return { border: 'border-slate-200', badge: 'bg-slate-100 text-slate-700' }
    case 'GOLD':
      return { border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800' }
    case 'PLATINUM':
      return { border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' }
    default:
      return { border: 'border-border', badge: 'bg-muted text-muted-foreground' }
  }
}

export function PackageSelector({
  packages,
  selectedId,
  onSelect,
  className,
}: Readonly<PackageSelectorProps>) {
  const sorted = [...packages].sort((a, b) => {
    const order: Record<EventPackage['tier'], number> = {
      SILVER: 1,
      GOLD: 2,
      PLATINUM: 3,
    }
    return order[a.tier] - order[b.tier]
  })

  return (
    <div
      className={cn(
        'flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
      role="radiogroup"
      aria-label="Package selection"
    >
      {sorted.map((p) => {
        const selected = p.id === selectedId
        const styles = tierStyles(p.tier)
        const features = p.features.filter(Boolean)
        const visibleFeatures = features.slice(0, 3)
        const remainingCount = Math.max(0, features.length - visibleFeatures.length)
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={cn(
              'group relative w-[260px] shrink-0 snap-start overflow-hidden rounded-xl border bg-card p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-[280px]',
              styles.border,
              selected
                ? 'border-accent ring-1 ring-accent/40'
                : 'hover:bg-secondary',
            )}
            role="radio"
            aria-checked={selected}
          >
            {selected ? (
              <div className="pointer-events-none absolute inset-0 bg-accent/5" />
            ) : null}

            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                      styles.badge,
                    )}
                  >
                    {p.tier}
                  </span>
                  {p.tier === 'PLATINUM' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden />
                      Best value
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 truncate text-sm font-semibold text-foreground">
                  {p.name}
                </p>
              </div>

              {selected ? (
                <CheckCircle2 className="h-5 w-5 text-accent" aria-hidden />
              ) : (
                <span className="h-5 w-5 rounded-full border border-border bg-background/40 opacity-0 transition-opacity group-hover:opacity-100" />
              )}
            </div>

            <div className="relative mt-3 flex items-end justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Per booking</p>
                <p className="text-xl font-black text-foreground">
                  £{p.basePrice.toFixed(2)}
                </p>
              </div>
              {selected ? (
                <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-foreground">
                  Selected
                </span>
              ) : (
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                  Choose
                </span>
              )}
            </div>

            {visibleFeatures.length > 0 ? (
              <div className="relative mt-3">
                <p className="text-xs font-semibold text-foreground/90">
                  Includes
                </p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {visibleFeatures.map((f) => (
                    <li key={f} className="leading-relaxed">
                      {f}
                    </li>
                  ))}
                </ul>
                {remainingCount > 0 ? (
                  <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                    +{remainingCount} more
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="relative mt-3 text-xs text-muted-foreground">
                No package features listed.
              </p>
            )}
          </button>
        )
      })}
    </div>
  )
}

