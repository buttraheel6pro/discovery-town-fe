/** Shared visibility helpers for scheduling services across admin and customer routes. */
import type { SchedulingService, SchedulingSlot } from '@/lib/types'

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

const EVENT_SERVICE_TYPES = new Set<string>(['PARTY_PACKAGE', 'WORKSHOP', 'CAMP'])
const EVENT_CATALOG_CATEGORY_ID = 'cat-5'
const EVENT_CATALOG_CATEGORY_PREFIX = 'cat-event-'

export function isCurrentCatalogService(serviceId: string): boolean {
  if (LEGACY_SERVICE_IDS.has(serviceId)) {
    return false
  }

  return !LEGACY_SERVICE_ID_PREFIXES.some((prefix) => serviceId.startsWith(prefix))
}

export function isEventCatalogService(service: SchedulingService): boolean {
  if (!service.isActive || !isCurrentCatalogService(service.id)) {
    return false
  }

  if (service.bookingMode !== 'SCHEDULED') {
    return false
  }

  return (
    service.categoryId === EVENT_CATALOG_CATEGORY_ID ||
    service.categoryId.startsWith(EVENT_CATALOG_CATEGORY_PREFIX) ||
    EVENT_SERVICE_TYPES.has(service.serviceType)
  )
}

export function hasAssignedConsumerSlot(
  service: SchedulingService,
  slots: readonly SchedulingSlot[],
): boolean {
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
