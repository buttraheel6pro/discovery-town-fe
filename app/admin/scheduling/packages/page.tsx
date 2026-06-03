/** Admin packages — CRUD for tiered event packages across services. */
'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import {
  buildDuplicatePackagePatch,
  DuplicatePackageDialog,
} from '@/components/admin/duplicate-package-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  buildPackageEditHref,
  filterPackagesForPlacement,
  formatPackagePlacementSummary,
} from '@/lib/package-placement'
import { getSchedulingTopLevelId } from '@/lib/scheduling-consumer-categories'
import { isCurrentCatalogService } from '@/lib/scheduling-visibility'
import { useScheduling } from '@/lib/scheduling-store'
import { formatPrice } from '@/lib/utils'
import type { EventPackage } from '@/lib/types'

function AdminSchedulingPackagesPageInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const categoryFilterId = searchParams.get('category')
  const { services, packages, categories, removePackage, duplicatePackage } = useScheduling()

  const [q, setQ] = useState('')
  const [serviceId, setServiceId] = useState<string>('ALL')
  const [duplicateSource, setDuplicateSource] = useState<EventPackage | null>(null)

  useEffect(() => {
    if (categoryFilterId === 'cat-private-play') {
      setServiceId('ALL')
    }
  }, [categoryFilterId])

  const assignableServices = useMemo(() => {
    return services.filter((service) => isCurrentCatalogService(service.id))
  }, [services])

  const categoryName = useMemo(() => {
    if (!categoryFilterId) {
      return null
    }
    return categories.find((entry) => entry.id === categoryFilterId)?.name ?? categoryFilterId
  }, [categories, categoryFilterId])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    let rows = packages

    if (categoryFilterId) {
      const page =
        getSchedulingTopLevelId(categoryFilterId) === 'EVENT' ? 'events' : 'play'
      rows = filterPackagesForPlacement(rows, page, categoryFilterId)
    }

    return rows.filter((p) => {
      const isAlignedPackage =
        p.serviceId === 'unassigned' || isCurrentCatalogService(p.serviceId)
      if (!isAlignedPackage) {
        return false
      }
      if (serviceId !== 'ALL') {
        if (serviceId === 'unassigned' && p.serviceId !== 'unassigned') {
          return false
        }
        if (serviceId !== 'unassigned' && p.serviceId !== serviceId) {
          return false
        }
      }
      if (!query) {
        return true
      }
      return (
        p.name.toLowerCase().includes(query) ||
        p.tier.toLowerCase().includes(query) ||
        p.serviceId.toLowerCase().includes(query)
      )
    })
  }, [packages, q, serviceId, categoryFilterId])

  const newPackageHref =
    categoryFilterId != null
      ? `/admin/scheduling/packages/new?category=${encodeURIComponent(categoryFilterId)}`
      : '/admin/scheduling/packages/new'

  const backHref = useMemo(() => {
    if (categoryFilterId) {
      const params = new URLSearchParams({
        serviceCategoryFilterId: categoryFilterId,
      })
      return `/admin/scheduling/services?${params.toString()}`
    }
    return '/admin/scheduling/services'
  }, [categoryFilterId])

  const editReturnTo = useMemo(() => {
    const query = searchParams.toString()
    return query ? `${pathname}?${query}` : pathname
  }, [pathname, searchParams])

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link href={backHref}>
          <Button type="button" variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Packages
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {categoryName
                ? `Packages placed on ${categoryName}.`
                : 'Manage tiered packages across all events and services.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categoryFilterId ? (
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/scheduling/packages">All packages</Link>
              </Button>
            ) : null}
            <Link href={newPackageHref}>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                New package
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search packages..."
            className="max-w-sm"
          />
          <Select value={serviceId} onValueChange={setServiceId}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All services</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {assignableServices.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Packages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No packages match your filters.</p>
          ) : (
            filtered.map((p) => {
              const svc =
                p.serviceId === 'unassigned'
                  ? null
                  : (assignableServices.find((s) => s.id === p.serviceId) ?? null)
              const serviceLabel =
                p.serviceId === 'unassigned' ? 'Unassigned' : (svc?.name ?? p.serviceId)
              const placementLabel = formatPackagePlacementSummary(p, categories)
              return (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {p.tier} · {p.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {serviceLabel} · {formatPrice(p.basePrice)} ·{' '}
                      {p.isActive ? 'Active' : 'Inactive'}
                    </p>
                    <p className="text-xs text-muted-foreground">{placementLabel}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" variant="outline" asChild>
                      <Link
                        href={buildPackageEditHref(p.id, {
                          returnTo: editReturnTo,
                          category: categoryFilterId ?? undefined,
                        })}
                      >
                        Edit
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setDuplicateSource(p)}
                    >
                      Duplicate
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive"
                      onClick={() => removePackage(p.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <DuplicatePackageDialog
        open={duplicateSource != null}
        onOpenChange={(next) => {
          if (!next) {
            setDuplicateSource(null)
          }
        }}
        sourcePackage={duplicateSource}
        defaultSubCategoryId={categoryFilterId ?? undefined}
        onConfirm={({ packageId, serviceId, placement }) => {
          duplicatePackage(packageId, buildDuplicatePackagePatch(serviceId, placement))
          setDuplicateSource(null)
        }}
      />
    </div>
  )
}

export default function AdminSchedulingPackagesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <AdminSchedulingPackagesPageInner />
    </Suspense>
  )
}
