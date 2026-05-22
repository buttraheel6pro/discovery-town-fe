/** Admin — event packages placed on a Play / Gym / Events sub-category. */
'use client'

import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  buildPackageEditHref,
  filterPackagesForPlacement,
  servicesListHref,
  type PackageDisplayPage,
} from '@/lib/package-placement'
import { useScheduling } from '@/lib/scheduling-store'
import { formatPrice } from '@/lib/utils'

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

  return (
    <section className={className}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">Event packages</h3>
          <p className="text-xs text-muted-foreground">
            Tiered packages with placement on {categoryName}. Managed in Packages — not
            scheduling services.
          </p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href={packagesManageHref(categoryId)}>Manage packages</Link>
        </Button>
      </div>

      {placedPackages.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-xs text-muted-foreground">
            No active packages placed here. Create or edit a package and set category to
            Play with sub-category {categoryName}, or open Manage packages.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {placedPackages.map((pkg) => {
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
      )}
    </section>
  )
}
