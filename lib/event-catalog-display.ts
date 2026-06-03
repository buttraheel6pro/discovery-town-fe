/** Expand events catalog scroll rows — package-only services list tiers, not the shell service. */
import { isPackageServiceOffering } from '@/lib/scheduling-listing-kind'
import type { EventPackage, SchedulingService } from '@/lib/types'

export type EventCatalogScrollItem =
  | { readonly kind: 'service'; readonly service: SchedulingService }
  | {
      readonly kind: 'package'
      readonly pkg: EventPackage
      readonly bookingService: SchedulingService
    }

const TIER_ORDER: Record<EventPackage['tier'], number> = {
  SILVER: 1,
  GOLD: 2,
  PLATINUM: 3,
}

function sortPackagesByTier(packages: readonly EventPackage[]): EventPackage[] {
  return [...packages].sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier])
}

export function isPackageOnlyCatalogService(
  service: Pick<SchedulingService, 'isPackageService'>,
): boolean {
  return isPackageServiceOffering(service)
}

export function buildEventCatalogScrollItems(
  services: readonly SchedulingService[],
  packages: readonly EventPackage[],
): EventCatalogScrollItem[] {
  const items: EventCatalogScrollItem[] = []

  for (const service of services) {
    if (isPackageOnlyCatalogService(service)) {
      const linked = sortPackagesByTier(
        packages.filter((pkg) => pkg.isActive && pkg.serviceId === service.id),
      )
      for (const pkg of linked) {
        items.push({ kind: 'package', pkg, bookingService: service })
      }
      continue
    }
    items.push({ kind: 'service', service })
  }

  return items
}

export function eventCatalogItemMatchesSearch(
  item: EventCatalogScrollItem,
  query: string,
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) {
    return true
  }
  if (item.kind === 'service') {
    const service = item.service
    return (
      service.name.toLowerCase().includes(q) ||
      (service.sport?.toLowerCase().includes(q) ?? false) ||
      (service.description?.toLowerCase().includes(q) ?? false)
    )
  }
  return (
    item.pkg.name.toLowerCase().includes(q) ||
    item.pkg.tier.toLowerCase().includes(q) ||
    item.pkg.features.some((feature) => feature.toLowerCase().includes(q))
  )
}
