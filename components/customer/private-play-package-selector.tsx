/** Classic horizontal tabs + connected detail panel for Private Play packages. */
'use client'

import { useEffect, useMemo } from 'react'

import { PrivatePlayPackageDetail } from '@/components/customer/private-play-package-detail'
import { cn } from '@/lib/utils'
import type { EventPackage } from '@/lib/types'

function sortPackages(packages: readonly EventPackage[]): EventPackage[] {
  const tierOrder: Record<EventPackage['tier'], number> = {
    SILVER: 1,
    GOLD: 2,
    PLATINUM: 3,
  }
  return [...packages].sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier])
}

function formatTierLabel(tier: EventPackage['tier']): string {
  return tier.charAt(0) + tier.slice(1).toLowerCase()
}

export interface PrivatePlayPackageSelectorProps {
  readonly packages: readonly EventPackage[]
  readonly selectedId: string | null
  readonly onSelect: (packageId: string) => void
  readonly defaultDurationMinutes: number
  readonly sectionTitle?: string
  readonly className?: string
}

export function PrivatePlayPackageSelector({
  packages,
  selectedId,
  onSelect,
  defaultDurationMinutes,
  sectionTitle,
  className,
}: Readonly<PrivatePlayPackageSelectorProps>) {
  const sorted = useMemo(() => sortPackages(packages), [packages])

  useEffect(() => {
    if (sorted.length === 0) {
      return
    }
    const stillValid = selectedId != null && sorted.some((pkg) => pkg.id === selectedId)
    if (!stillValid) {
      onSelect(sorted[0].id)
    }
  }, [onSelect, selectedId, sorted])

  const selectedPackage = useMemo(
    () => sorted.find((pkg) => pkg.id === selectedId) ?? null,
    [selectedId, sorted],
  )

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Packages are being updated. Please check back soon or contact reception.
      </p>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      {sectionTitle ? (
        <p className="mb-1 text-sm font-semibold text-foreground">{sectionTitle}</p>
      ) : null}
      <p className="mb-4 text-sm font-medium text-muted-foreground">
        Select a package to view full details
      </p>

      <div className="overflow-hidden">
        <div role="tablist" aria-label="Private Play packages" className="flex flex-wrap items-end">
          {sorted.map((pkg) => {
            const isSelected = selectedId === pkg.id
            return (
              <button
                key={pkg.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={`private-play-pkg-panel-${pkg.id}`}
                id={`private-play-pkg-tab-${pkg.id}`}
                onClick={() => onSelect(pkg.id)}
                className={cn(
                  'rounded-t-lg px-5 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isSelected
                    ? 'relative z-10 bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                {formatTierLabel(pkg.tier)}
              </button>
            )
          })}
        </div>

        <div className="h-0.5 w-full bg-primary" aria-hidden />

        {selectedPackage ? (
          <div
            role="tabpanel"
            id={`private-play-pkg-panel-${selectedPackage.id}`}
            aria-labelledby={`private-play-pkg-tab-${selectedPackage.id}`}
            className="border border-border bg-card p-6 sm:p-8"
          >
            <PrivatePlayPackageDetail
              package={selectedPackage}
              defaultDurationMinutes={defaultDurationMinutes}
              embedded
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
