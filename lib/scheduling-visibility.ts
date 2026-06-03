/** Shared visibility helpers for scheduling services across admin and customer routes. */
import { isOpenPlayPassCatalogService } from '@/lib/open-play-pass-catalog'
import type { SchedulingCategory, SchedulingService, SchedulingSlot } from '@/lib/types'

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

export function isConsumerVisibleSchedulingCategory(
  category: Pick<SchedulingCategory, 'isActive'>,
): boolean {
  return category.isActive !== false
}

export function buildSchedulingCategoryById(
  categories: readonly SchedulingCategory[],
): Map<string, SchedulingCategory> {
  return new Map(categories.map((category) => [category.id, category]))
}

export function isSchedulingCategoryActiveForConsumer(
  categoryId: string,
  categoryById: ReadonlyMap<string, Pick<SchedulingCategory, 'isActive'>>,
): boolean {
  const category = categoryById.get(categoryId)
  if (!category) {
    return false
  }
  return isConsumerVisibleSchedulingCategory(category)
}

export function isConsumerVisibleSchedulingService(
  service: Pick<SchedulingService, 'id' | 'isActive' | 'categoryId'>,
  categoryById: ReadonlyMap<string, Pick<SchedulingCategory, 'isActive'>>,
  options?: { readonly requireCurrentCatalog?: boolean },
): boolean {
  if (!service.isActive) {
    return false
  }
  if (options?.requireCurrentCatalog && !isCurrentCatalogService(service.id)) {
    return false
  }
  return isSchedulingCategoryActiveForConsumer(service.categoryId, categoryById)
}

export function isConsumerListedSchedulingService(
  service: SchedulingService,
  categoryById: ReadonlyMap<string, Pick<SchedulingCategory, 'isActive'>>,
  slots: readonly SchedulingSlot[],
  options?: { readonly requireCurrentCatalog?: boolean },
): boolean {
  return (
    isConsumerVisibleSchedulingService(service, categoryById, options) &&
    hasAssignedConsumerSlot(service, slots)
  )
}

export function isConsumerEventCatalogService(
  service: SchedulingService,
  categoryById: ReadonlyMap<string, Pick<SchedulingCategory, 'isActive'>>,
): boolean {
  return (
    isEventCatalogService(service) &&
    isSchedulingCategoryActiveForConsumer(service.categoryId, categoryById)
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

export function isEventCatalogService(service: SchedulingService): boolean {
  if (!service.isActive || !isCurrentCatalogService(service.id)) {
    return false
  }

  if (service.bookingMode !== 'SCHEDULED') {
    return false
  }

  if (isEventsOnlyCatalogService(service)) {
    return true
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
