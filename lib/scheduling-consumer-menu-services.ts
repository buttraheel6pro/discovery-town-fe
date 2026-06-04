/** Shared service listing rules for Gym / Play / Events customer menus. */

import {
  isSchedulingCategoryCrossPlacedOnSchedulingMenu,
  isSchedulingCategoryPlacedOnProductMenu,
  isSchedulingCategoryPlacedOnSchedulingMenu,
  nativeSchedulingCatalogSlug,
  usesEventStyleSchedulingListing,
} from '@/lib/catalog-placement'
import {
  isSchedulingCatalogSlug,
  normalizeCatalogSlug,
  type CatalogSlug,
  type SchedulingCatalogSlug,
} from '@/lib/catalog-slugs'
import { isOpenPlayPassCatalogService } from '@/lib/open-play-pass-catalog'
import {
  isConsumerListedSchedulingService,
  isConsumerListableSchedulingService,
} from '@/lib/scheduling-visibility'
import type {
  EventPackage,
  SchedulingCategory,
  SchedulingService,
  SchedulingSlot,
} from '@/lib/types'

function matchesSchedulingCategoryService(
  service: SchedulingService,
  categoryId: string,
): boolean {
  return service.categoryId === categoryId && !isOpenPlayPassCatalogService(service)
}

function usesRelaxedListabilityForSchedulingMenu(
  category: SchedulingCategory,
  menuSlug: CatalogSlug,
): boolean {
  if (isSchedulingCategoryPlacedOnProductMenu(category)) {
    return true
  }
  if (isSchedulingCatalogSlug(menuSlug)) {
    return (
      isSchedulingCategoryPlacedOnSchedulingMenu(category, menuSlug) ||
      isSchedulingCategoryCrossPlacedOnSchedulingMenu(category, menuSlug)
    )
  }
  return false
}

/** Scheduling rows placed on a menu from another scheduling or product menu. */
export function isSchedulingCategoryMovedToSchedulingMenu(
  category: SchedulingCategory,
  menuSlug: SchedulingCatalogSlug,
): boolean {
  if (isSchedulingCategoryPlacedOnProductMenu(category)) {
    return true
  }
  const placement = normalizeCatalogSlug(category.placementCatalogSlug ?? null)
  if (placement && isSchedulingCatalogSlug(placement) && placement === menuSlug) {
    return nativeSchedulingCatalogSlug(category) !== menuSlug
  }
  return isSchedulingCategoryCrossPlacedOnSchedulingMenu(category, menuSlug)
}

/**
 * Services for a scheduling menu section.
 * Native categories use slot-based listing; moved rows also allow package-only shells.
 */
export function collectServicesForSchedulingConsumerMenu(
  category: SchedulingCategory,
  menuSlug: CatalogSlug,
  services: readonly SchedulingService[],
  slots: readonly SchedulingSlot[],
  packages: readonly EventPackage[],
  categoryById: ReadonlyMap<string, SchedulingCategory>,
): SchedulingService[] {
  const relaxed = usesRelaxedListabilityForSchedulingMenu(category, menuSlug)

  if (relaxed) {
    return services.filter(
      (service) =>
        matchesSchedulingCategoryService(service, category.id) &&
        isConsumerListableSchedulingService(service, categoryById, slots, packages),
    )
  }

  if (usesEventStyleSchedulingListing(category)) {
    return services.filter(
      (service) =>
        matchesSchedulingCategoryService(service, category.id) &&
        isConsumerListableSchedulingService(service, categoryById, slots, packages),
    )
  }

  return services.filter(
    (service) =>
      matchesSchedulingCategoryService(service, category.id) &&
      isConsumerListedSchedulingService(service, categoryById, slots),
  )
}
