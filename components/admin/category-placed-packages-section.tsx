/** Admin — packages placed on a Play / Events sub-category, grouped by linked service. */
'use client'

import { useMemo } from 'react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  buildPackageEditHref,
  filterPackagesForPlacement,
  getPackageDisplayPageLabel,
  servicesListHref,
  type PackageDisplayPage,
} from '@/lib/package-placement'
import { isCurrentCatalogService } from '@/lib/scheduling-visibility'
import { useScheduling } from '@/lib/scheduling-store'
import { formatPrice } from '@/lib/utils'
import type { EventPackage, SchedulingService } from '@/lib/types'

export interface CategoryPlacedPackagesSectionProps {
  readonly page: PackageDisplayPage
  readonly categoryId: string
  readonly categoryName: string
  readonly className?: string
}

function packagesManageHref(categoryId: string): string {
  const params = new URLSearchParams({ category: categoryId })
  return `/admin/scheduling/packages?${params.toString()}`
}

interface PackageServiceGroup {
  readonly service: SchedulingService | null
  readonly serviceLabel: string
  readonly packages: EventPackage[]
}

function PackageCardsGrid({
  packages: packageRows,
  serviceNameById,
  servicesReturnTo,
  categoryId,
}: Readonly<{
  packages: readonly EventPackage[]
  serviceNameById: ReadonlyMap<string, string>
  servicesReturnTo: string
  categoryId: string
}>) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {packageRows.map((pkg) => {
        const serviceLabel =
          pkg.serviceId === 'unassigned'
            ? 'Unassigned'
            : (serviceNameById.get(pkg.serviceId) ?? pkg.serviceId)
        return (
          <Card key={pkg.id}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-foreground">{pkg.name}</p>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {pkg.tier}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{serviceLabel}</p>
              <p className="text-xs font-semibold text-muted-foreground">
                {formatPrice(pkg.basePrice)}
                {!pkg.isActive ? ' · Inactive' : ''}
              </p>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link
                  href={buildPackageEditHref(pkg.id, {
                    returnTo: servicesReturnTo,
                    category: categoryId,
                  })}
                >
                  Edit package
                </Link>
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export function CategoryPlacedPackagesSection({
  page,
  categoryId,
  categoryName,
  className,
}: Readonly<CategoryPlacedPackagesSectionProps>) {
  const { packages, services } = useScheduling()

  const placedPackages = filterPackagesForPlacement(packages, page, categoryId)
  const serviceNameById = new Map(services.map((service) => [service.id, service.name]))
  const servicesReturnTo = servicesListHref(categoryId)
  const pageLabel = getPackageDisplayPageLabel(page)

  const packageGroups = useMemo((): PackageServiceGroup[] => {
    const catalogServices = services.filter(
      (service) =>
        service.categoryId === categoryId && isCurrentCatalogService(service.id),
    )
    const packageOnlyServices = catalogServices.filter(
      (service) => service.isPackageService === true,
    )

    if (packageOnlyServices.length === 0) {
      return [
        {
          service: null,
          serviceLabel: 'All packages',
          packages: placedPackages,
        },
      ]
    }

    const groups: PackageServiceGroup[] = packageOnlyServices.map((service) => ({
      service,
      serviceLabel: service.name,
      packages: placedPackages.filter((pkg) => pkg.serviceId === service.id),
    }))

    const linkedIds = new Set(
      packageOnlyServices.map((service) => service.id),
    )
    const ungrouped = placedPackages.filter((pkg) => !linkedIds.has(pkg.serviceId))
    if (ungrouped.length > 0) {
      groups.push({
        service: null,
        serviceLabel: 'Other linked services',
        packages: ungrouped,
      })
    }

    return groups
  }, [categoryId, placedPackages, services])

  const totalPackageCount = placedPackages.length

  return (
    <section className={className}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">Packages</h3>
          <p className="text-xs text-muted-foreground">
            Tiered packages placed on {pageLabel} · {categoryName}. Each package links to
            a package-only service — same as Private Play.
          </p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href={packagesManageHref(categoryId)}>Manage packages</Link>
        </Button>
      </div>

      {totalPackageCount === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-xs text-muted-foreground">
            No active packages placed here. Create a package with {pageLabel} ·{' '}
            {categoryName}, link it to a package-only service, or open Manage packages.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {packageGroups.map((group) => (
            <div key={group.service?.id ?? 'other-packages'} className="space-y-3">
              {packageGroups.length > 1 ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.serviceLabel}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {group.packages.length}{' '}
                    {group.packages.length === 1 ? 'package' : 'packages'}
                  </span>
                </div>
              ) : null}
              {group.packages.length === 0 ? (
                <Card>
                  <CardContent className="py-4 text-center text-xs text-muted-foreground">
                    No packages linked to this service yet. Edit the service and use Link
                    package, or duplicate an existing tier.
                  </CardContent>
                </Card>
              ) : (
                <PackageCardsGrid
                  packages={group.packages}
                  serviceNameById={serviceNameById}
                  servicesReturnTo={servicesReturnTo}
                  categoryId={categoryId}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
