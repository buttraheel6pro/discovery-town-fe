/** Shared visibility helpers for scheduling services across admin and customer routes. */
import {
  buildProductRootIdsBySlug,
  effectiveSchedulingCatalogSlug,
  schedulingCategoryAppearsOnCustomerProductMenu,
  schedulingCategoryAppearsOnCustomerSchedulingMenu,
  type SchedulingCategoryPlacementFields,
} from '@/lib/catalog-placement'
import { isSchedulingCatalogSlug, type SchedulingCatalogSlug } from '@/lib/catalog-slugs'
import { isApiEnabled } from '@/lib/config/data-source'
import {
  isConsumerAlignedCategoryId,
  isLegacySchedulingCategoryId,
} from '@/lib/scheduling-consumer-categories'
import { isPackageOnlyCatalogService } from '@/lib/event-catalog-display'
import { isOpenPlayPassCatalogService } from '@/lib/open-play-pass-catalog'
import { isPackageServiceOffering } from '@/lib/scheduling-listing-kind'
import type {
  EventPackage,
  ProductCategory,
  SchedulingCategory,
  SchedulingService,
  SchedulingSlot,
} from '@/lib/types'

const LEGACY_SERVICE_ID_PREFIXES = [
  'svc-play-',
  'svc-swim-',
  'svc-class-',
  'svc-party-',
  'svc-camp-adventure',
  'svc-ph-',
  'event-',
] as const

const LEGACY_SERVICE_IDS = new Set([
  'svc-1',
  'svc-2',
  'svc-3',
  'svc-4',
  'svc-6',
  'svc-preschool-1',
])

const EVENT_CATALOG_CATEGORY_PREFIX = 'cat-event-'

type SchedulingCategoryConsumerVisibilityFields = Pick<
  SchedulingCategory,
  'id' | 'isActive' | 'catalogSlug' | 'placementCatalogSlug' | 'name'
>

export type { SchedulingCategoryConsumerVisibilityFields }

export function isConsumerVisibleSchedulingCategory(
  category: SchedulingCategoryConsumerVisibilityFields,
): boolean {
  if (isLegacySchedulingCategoryId(category.id)) {
    return false
  }
  if (category.isActive === false) {
    return false
  }
  if (isConsumerAlignedCategoryId(category.id)) {
    return true
  }
  const catalogSlug = effectiveSchedulingCatalogSlug(category)
  if (isSchedulingCatalogSlug(catalogSlug)) {
    return true
  }
  return category.name.trim().toLowerCase() === 'open play'
}

export function buildSchedulingCategoryById(
  categories: readonly SchedulingCategory[],
): Map<string, SchedulingCategory> {
  return new Map(categories.map((category) => [category.id, category]))
}

function isApiBackedActiveConsumerService(
  service: Pick<SchedulingService, 'id' | 'isActive'>,
): boolean {
  return isApiEnabled && service.isActive && isCurrentCatalogService(service.id)
}

export function isSchedulingCategoryActiveForConsumer(
  categoryId: string,
  categoryById: ReadonlyMap<string, SchedulingCategoryConsumerVisibilityFields>,
  fallbackCategory?: SchedulingCategoryConsumerVisibilityFields | null,
): boolean {
  const category = categoryById.get(categoryId) ?? fallbackCategory
  if (!category) {
    return false
  }
  return isConsumerVisibleSchedulingCategory(category)
}

export function isConsumerVisibleSchedulingService(
  service: Pick<SchedulingService, 'id' | 'isActive' | 'categoryId' | 'category'>,
  categoryById: ReadonlyMap<string, SchedulingCategoryConsumerVisibilityFields>,
  options?: { readonly requireCurrentCatalog?: boolean },
): boolean {
  if (!service.isActive) {
    return false
  }
  if (options?.requireCurrentCatalog && !isCurrentCatalogService(service.id)) {
    return false
  }
  const category = categoryById.get(service.categoryId) ?? service.category
  if (category && isConsumerVisibleSchedulingCategory(category)) {
    return true
  }
  return isApiBackedActiveConsumerService(service)
}

export function isConsumerListedSchedulingService(
  service: SchedulingService,
  categoryById: ReadonlyMap<string, SchedulingCategoryConsumerVisibilityFields>,
  slots: readonly SchedulingSlot[],
  options?: { readonly requireCurrentCatalog?: boolean },
): boolean {
  if (!isConsumerVisibleSchedulingService(service, categoryById, options)) {
    return false
  }
  return hasAssignedConsumerSlot(service, slots)
}

/** Listed on customer menus — slots, or active packages for package-only offerings. */
export function isConsumerListableSchedulingService(
  service: SchedulingService,
  categoryById: ReadonlyMap<string, SchedulingCategoryConsumerVisibilityFields>,
  slots: readonly SchedulingSlot[],
  packages: readonly EventPackage[] = [],
  options?: { readonly requireCurrentCatalog?: boolean },
): boolean {
  if (!isConsumerVisibleSchedulingService(service, categoryById, options)) {
    return false
  }
  if (isOpenPlayPassCatalogService(service)) {
    return false
  }
  if (hasAssignedConsumerSlot(service, slots)) {
    return true
  }
  if (isPackageServiceOffering(service) || isPackageOnlyCatalogService(service)) {
    return packages.some((pkg) => pkg.isActive && pkg.serviceId === service.id)
  }
  return service.bookingMode !== 'SCHEDULED'
}

export function isConsumerEventCatalogService(
  service: SchedulingService,
  categoryById: ReadonlyMap<
    string,
    SchedulingCategoryPlacementFields & SchedulingCategoryConsumerVisibilityFields
  >,
  productRootIdsBySlug: Readonly<Record<string, string | undefined>> = {},
): boolean {
  return (
    isEventCatalogService(service, categoryById, productRootIdsBySlug) &&
    isSchedulingCategoryActiveForConsumer(service.categoryId, categoryById)
  )
}

export function filterConsumerSchedulingCategoriesForMenu(
  menuSlug: SchedulingCatalogSlug,
  categories: readonly SchedulingCategory[],
  productRootIdsBySlug: Readonly<Record<string, string | undefined>> = {},
): SchedulingCategory[] {
  return categories
    .filter(
      (category) =>
        isConsumerVisibleSchedulingCategory(category) &&
        schedulingCategoryAppearsOnCustomerSchedulingMenu(
          category,
          menuSlug,
          productRootIdsBySlug,
        ),
    )
    .slice()
    .sort((left, right) => left.displayOrder - right.displayOrder)
}

/** Scheduling sub-categories placed on a customer store menu (Gifts, Shop, Rentals, Cafe). */
export function filterConsumerSchedulingCategoriesForProductMenu(
  productType: string,
  categories: readonly SchedulingCategory[],
  productRootIdsBySlug: Readonly<Record<string, string | undefined>> = {},
  productCategories: readonly Pick<ProductCategory, 'id' | 'parentId' | 'productType'>[] = [],
): SchedulingCategory[] {
  return categories
    .filter(
      (category) =>
        isConsumerVisibleSchedulingCategory(category) &&
        schedulingCategoryAppearsOnCustomerProductMenu(
          category,
          productType,
          productRootIdsBySlug,
          productCategories,
        ),
    )
    .slice()
    .sort((left, right) => left.displayOrder - right.displayOrder)
}

export function hasConsumerSchedulingOnProductMenu(
  productType: string,
  categories: readonly SchedulingCategory[],
  productCategories: readonly Pick<ProductCategory, 'id' | 'parentId' | 'productType'>[],
): boolean {
  const productRootIdsBySlug = buildProductRootIdsBySlug(productCategories)
  return (
    filterConsumerSchedulingCategoriesForProductMenu(
      productType,
      categories,
      productRootIdsBySlug,
      productCategories,
    ).length > 0
  )
}

export function isCurrentCatalogService(serviceId: string): boolean {
  if (LEGACY_SERVICE_IDS.has(serviceId)) {
    return false
  }

  return !LEGACY_SERVICE_ID_PREFIXES.some((prefix) => serviceId.startsWith(prefix))
}

export function isEventsOnlyCatalogService(
  service: Pick<SchedulingService, 'eventsOnly'>,
): boolean {
  return service.eventsOnly === true
}

export function isEventCatalogService(
  service: SchedulingService,
  categoryById?: ReadonlyMap<string, SchedulingCategoryPlacementFields>,
  productRootIdsBySlug: Readonly<Record<string, string | undefined>> = {},
): boolean {
  if (!service.isActive || !isCurrentCatalogService(service.id)) {
    return false
  }

  if (isOpenPlayPassCatalogService(service)) {
    return false
  }

  if (isEventsOnlyCatalogService(service)) {
    return true
  }

  const category =
    categoryById?.get(service.categoryId) ??
    (service.category as SchedulingCategoryConsumerVisibilityFields | undefined)
  if (
    category &&
    isConsumerVisibleSchedulingCategory(category as SchedulingCategoryConsumerVisibilityFields) &&
    schedulingCategoryAppearsOnCustomerSchedulingMenu(
      category,
      'events',
      productRootIdsBySlug,
    )
  ) {
    return true
  }

  if (service.bookingMode !== 'SCHEDULED') {
    return false
  }

  return service.categoryId.startsWith(EVENT_CATALOG_CATEGORY_PREFIX)
}

export function hasAssignedConsumerSlot(
  service: SchedulingService,
  slots: readonly SchedulingSlot[],
): boolean {
  if (isOpenPlayPassCatalogService(service)) {
    return false
  }

  if (service.bookingMode !== 'SCHEDULED') {
    return true
  }

  return slots.some(
    (slot) =>
      slot.serviceId === service.id &&
      slot.status !== 'CANCELLED' &&
      slot.status !== 'COMPLETED',
  )
}
