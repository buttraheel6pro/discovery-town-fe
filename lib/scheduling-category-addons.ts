/** Resolve category-linked add-ons for customer booking flows. */

import {
  sampleClassAddOns,
  sampleEventAddOns,
  sampleFacilityAddOns,
  samplePreschoolAddOns,
} from '@/lib/mock-data'
import { isExcludedFromCategoryAddOnPicker } from '@/lib/booking-additional-adult'
import { bookingAddOnToSchedulingAddOn } from '@/lib/utils'
import type { AddOn, CategoryAddOn, SchedulingCategory, SchedulingService, SchedulingServiceAddOn } from '@/lib/types'

const STATIC_BOOKING_ADD_ONS: readonly SchedulingServiceAddOn[] = [
  ...sampleFacilityAddOns,
  ...sampleClassAddOns,
  ...sampleEventAddOns,
  ...samplePreschoolAddOns,
]

/** Latest category row (linked add-ons) for a service — not the embedded snapshot on the service. */
export function resolveSchedulingCategoryForService(
  service: Pick<SchedulingService, 'categoryId' | 'category'>,
  categories: readonly SchedulingCategory[],
): SchedulingCategory {
  return categories.find((entry) => entry.id === service.categoryId) ?? service.category
}

/** Catalog used to resolve linked add-on ids (inventory + service + mock samples). */
export function buildSchedulingAddOnCatalog(
  services: readonly SchedulingService[],
  bookingAddOns: readonly AddOn[] = [],
): Map<string, SchedulingServiceAddOn> {
  const map = new Map<string, SchedulingServiceAddOn>()

  for (const addOn of STATIC_BOOKING_ADD_ONS) {
    if (addOn.isActive) {
      map.set(addOn.id, addOn)
    }
  }

  for (const schedulingService of services) {
    for (const addOn of schedulingService.addOns ?? []) {
      if (addOn.isActive && !map.has(addOn.id)) {
        map.set(addOn.id, addOn)
      }
    }
  }

  for (const addOn of bookingAddOns) {
    if (addOn.isActive && !map.has(addOn.id)) {
      map.set(addOn.id, bookingAddOnToSchedulingAddOn(addOn))
    }
  }

  return map
}

function resolveAddOnFromCategoryLink(
  link: CategoryAddOn,
  catalog: Map<string, SchedulingServiceAddOn>,
): SchedulingServiceAddOn | null {
  const catalogEntry = catalog.get(link.addOnId)
  const name = link.addOnName?.trim() || catalogEntry?.name
  if (!name) {
    return null
  }

  const price = link.unitPrice ?? catalogEntry?.price ?? 0
  const pricingType = catalogEntry?.pricingType ?? 'FLAT'

  return {
    id: link.addOnId,
    name,
    description: catalogEntry?.description,
    price,
    pricingType,
    isActive: catalogEntry?.isActive ?? true,
  }
}

export function resolveCategoryIncludedAddOns(
  category: Pick<SchedulingCategory, 'linkedAddOns'>,
  catalog: Map<string, SchedulingServiceAddOn>,
): SchedulingServiceAddOn[] {
  return (category.linkedAddOns ?? [])
    .filter((link) => link.isFree && !isExcludedFromCategoryAddOnPicker(link.addOnId))
    .map((link) => resolveAddOnFromCategoryLink(link, catalog))
    .filter((addOn): addOn is SchedulingServiceAddOn => addOn != null)
}

export function resolveCategoryOptionalAddOns(
  category: Pick<SchedulingCategory, 'linkedAddOns'>,
  catalog: Map<string, SchedulingServiceAddOn>,
): SchedulingServiceAddOn[] {
  return (category.linkedAddOns ?? [])
    .filter((link) => !link.isFree && !isExcludedFromCategoryAddOnPicker(link.addOnId))
    .map((link) => resolveAddOnFromCategoryLink(link, catalog))
    .filter((addOn): addOn is SchedulingServiceAddOn => addOn != null)
}
