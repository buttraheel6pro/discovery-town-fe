/** Radio list + detail panel for Private Play package selection (Open Play pass UX). */
'use client'

import { useEffect, useMemo } from 'react'

import { PrivatePlayPackageDetail } from '@/components/customer/private-play-package-detail'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn, formatPrice } from '@/lib/utils'
import type { EventPackage } from '@/lib/types'

function sortPackages(packages: readonly EventPackage[]): EventPackage[] {
  const tierOrder: Record<EventPackage['tier'], number> = {
    SILVER: 1,
    GOLD: 2,
    PLATINUM: 3,
  }
  return [...packages].sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier])
}

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
    <div className={cn('space-y-6', className)}>
      {sectionTitle ? (
        <p className="text-sm font-semibold text-foreground">{sectionTitle}</p>
      ) : null}
      <p className="text-sm font-medium text-muted-foreground">
        Select a package to view full details
      </p>

      <RadioGroup
        value={selectedId ?? ''}
        onValueChange={onSelect}
        className="space-y-2"
        aria-label="Private Play packages"
      >
        {sorted.map((pkg) => {
          const inputId = `private-play-pkg-${pkg.id}`
          return (
            <div
              key={pkg.id}
              className={cn(
                'flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-4 transition-colors',
                selectedId === pkg.id && 'border-accent bg-accent/5 ring-1 ring-accent/30',
              )}
            >
              <RadioGroupItem
                value={pkg.id}
                id={inputId}
                className="mt-1"
                aria-label={pkg.name}
              />
              <Label
                htmlFor={inputId}
                className="flex flex-1 cursor-pointer flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                      tierBadgeClass(pkg.tier),
                    )}
                  >
                    {pkg.tier}
                  </span>
                  <span className="text-base font-semibold text-foreground">{pkg.name}</span>
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatPrice(pkg.basePrice)}
                </span>
              </Label>
            </div>
          )
        })}
      </RadioGroup>

      {selectedPackage ? (
        <PrivatePlayPackageDetail
          package={selectedPackage}
          defaultDurationMinutes={defaultDurationMinutes}
        />
      ) : null}
    </div>
  )
}
