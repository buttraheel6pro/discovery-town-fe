/** Event package catalog — IDs, tiers, and per-service package resolution. */
import { isPackageServiceOffering } from '@/lib/scheduling-listing-kind'
import type { EventPackage, SchedulingService } from '@/lib/types'

const PRIVATE_PLAY_CATEGORY_ID = 'cat-private-play'

export const EVENT_PRIVATE_PARTY_ROOM_SUBCATEGORY_ID =
  'cat-event-private-party-room-open-play' as const

export const EVENT_WHOLE_PLACE_SUBCATEGORY_ID =
  'cat-event-whole-place-private-party-open-play' as const

export const EVENT_PARTY_BOOKING_SERVICE_ID = 'svc-event-party-booking' as const
export const LEGACY_PARTY_SERVICE_ID = 'svc-5' as const

/** Play (/play) — private party room & whole venue booking entry points. */
export const PRIVATE_PLAY_ROOM_SERVICE_ID = 'svc-private-play-room-open-play' as const
export const PRIVATE_PLAY_FULL_VENUE_SERVICE_ID = 'svc-private-play-full-venue' as const

/** Events (/events) — package-only shells (distinct names from play services). */
export const EVENT_PARTY_ROOM_PACKAGES_SERVICE_ID = 'svc-event-party-room-packages' as const
export const EVENT_WHOLE_VENUE_PACKAGES_SERVICE_ID = 'svc-event-whole-venue-packages' as const
export const PRIVATE_PLAY_MEETING_ROOMS_SERVICE_ID =
  'svc-private-play-meeting-rooms' as const

/** Play — preschool / school field trip package shell (see mock-data). */
export { FIELD_TRIP_PRESCHOOL_SCHOOL_SERVICE_ID } from '@/lib/mock-data'

/** Original six party packages (room + whole venue). */
export const PARTY_ROOM_PACKAGE_IDS = [
  'pkg-evt-room-001',
  'pkg-evt-room-002',
  'pkg-evt-room-003',
] as const

/** Legacy party room tiers (play hub); kept for persisted bookings and deep links. */
export const LEGACY_PARTY_ROOM_PACKAGE_IDS = ['pkg-001', 'pkg-002', 'pkg-003'] as const

const PARTY_ROOM_PACKAGE_ID_SET = new Set<string>(PARTY_ROOM_PACKAGE_IDS)

export function isPartyRoomCatalogPackage(pkg: Pick<EventPackage, 'id'>): boolean {
  return PARTY_ROOM_PACKAGE_ID_SET.has(pkg.id)
}

export const WHOLE_VENUE_PACKAGE_IDS = [
  'pkg-evt-venue-004',
  'pkg-evt-venue-005',
  'pkg-evt-venue-006',
] as const

/** Legacy whole-venue tiers on Play (svc-5 hub). */
export const LEGACY_WHOLE_VENUE_PACKAGE_IDS = ['pkg-004', 'pkg-005', 'pkg-006'] as const

const WHOLE_VENUE_PACKAGE_ID_SET = new Set<string>(WHOLE_VENUE_PACKAGE_IDS)

export function isWholeVenueCatalogPackage(pkg: Pick<EventPackage, 'id'>): boolean {
  return WHOLE_VENUE_PACKAGE_ID_SET.has(pkg.id)
}

/** Party room or whole-venue tier deep-linked from the events page cards. */
export function isEventsPagePreselectedPackage(pkg: Pick<EventPackage, 'id'>): boolean {
  return isPartyRoomCatalogPackage(pkg) || isWholeVenueCatalogPackage(pkg)
}

/** Meeting Room Reservation tiers. */
export const MEETING_ROOM_PACKAGE_IDS = [
  'pkg-meeting-001',
  'pkg-meeting-002',
  'pkg-meeting-003',
] as const

export const EVENT_CATALOG_PACKAGE_IDS = [
  ...PARTY_ROOM_PACKAGE_IDS,
  ...LEGACY_PARTY_ROOM_PACKAGE_IDS,
  ...WHOLE_VENUE_PACKAGE_IDS,
  ...LEGACY_WHOLE_VENUE_PACKAGE_IDS,
  ...MEETING_ROOM_PACKAGE_IDS,
] as const

const EVENT_CATALOG_PACKAGE_ID_SET = new Set<string>(EVENT_CATALOG_PACKAGE_IDS)
const MEETING_ROOM_PACKAGE_ID_SET = new Set<string>(MEETING_ROOM_PACKAGE_IDS)

const PARTY_FALLBACK_SERVICE_IDS = new Set<string>([
  EVENT_PARTY_BOOKING_SERVICE_ID,
  LEGACY_PARTY_SERVICE_ID,
])

function sortByTier(packages: EventPackage[]): EventPackage[] {
  const tierOrder: Record<EventPackage['tier'], number> = {
    SILVER: 1,
    GOLD: 2,
    PLATINUM: 3,
  }
  return [...packages].sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier])
}

export function isEventCatalogPackage(pkg: Pick<EventPackage, 'id'>): boolean {
  return EVENT_CATALOG_PACKAGE_ID_SET.has(pkg.id)
}

export function isMeetingRoomCatalogPackage(pkg: Pick<EventPackage, 'id'>): boolean {
  return MEETING_ROOM_PACKAGE_ID_SET.has(pkg.id)
}

export function filterEventCatalogPackages(
  packages: readonly EventPackage[],
): EventPackage[] {
  return packages.filter((pkg) => pkg.isActive && isEventCatalogPackage(pkg))
}

export function partyRoomPackagesFromCatalog(
  packages: readonly EventPackage[],
): EventPackage[] {
  const idSet = new Set<string>(PARTY_ROOM_PACKAGE_IDS)
  return sortByTier(
    packages.filter((pkg) => pkg.isActive && idSet.has(pkg.id)),
  )
}

export function wholeVenuePackagesFromCatalog(
  packages: readonly EventPackage[],
): EventPackage[] {
  const idSet = new Set<string>(WHOLE_VENUE_PACKAGE_IDS)
  return sortByTier(
    packages.filter((pkg) => pkg.isActive && idSet.has(pkg.id)),
  )
}

export function meetingRoomPackagesFromCatalog(
  packages: readonly EventPackage[],
): EventPackage[] {
  const idSet = new Set<string>(MEETING_ROOM_PACKAGE_IDS)
  return sortByTier(
    packages.filter((pkg) => pkg.isActive && idSet.has(pkg.id)),
  )
}

/** Legacy party hub (`svc-5`, `svc-event-party-booking`) for combined private-event booking. */
export function isPrivateEventHubService(
  service: Pick<SchedulingService, 'id' | 'serviceType'>,
): boolean {
  return (
    service.serviceType === 'PARTY_PACKAGE' &&
    (service.id === LEGACY_PARTY_SERVICE_ID ||
      service.id === EVENT_PARTY_BOOKING_SERVICE_ID)
  )
}

/** All nine catalog tiers on `/events/svc-5?privateEvent=1` and party-booking. */
export function resolvePrivateEventHubPackages(
  packages: readonly EventPackage[],
): EventPackage[] {
  return filterEventCatalogPackages(packages)
}

/** Consumer URL for the private-event booking journey (optional pre-selected package). */
export function buildPrivateEventBookingHref(
  serviceId: string,
  packageId?: string | null,
): string {
  const base = `/events/${serviceId}?privateEvent=1`
  if (packageId == null || packageId === '') {
    return base
  }
  return `${base}&package=${encodeURIComponent(packageId)}`
}

/** Preferred service for private-event booking links (no dedicated events catalog row). */
export function resolvePrivateEventBookingServiceId(
  services: readonly Pick<SchedulingService, 'id' | 'serviceType' | 'isActive'>[],
): string | null {
  const room = services.find(
    (entry) => entry.isActive && entry.id === EVENT_PARTY_ROOM_PACKAGES_SERVICE_ID,
  )
  if (room) {
    return room.id
  }
  const hub = services.find(
    (entry) => entry.isActive && isPrivateEventHubService(entry),
  )
  return hub?.id ?? null
}

/** Whole-venue private party booking links from the events page cards. */
export function resolveWholeVenuePrivateEventBookingServiceId(
  services: readonly Pick<SchedulingService, 'id' | 'isActive'>[],
): string | null {
  const venue = services.find(
    (entry) => entry.isActive && entry.id === EVENT_WHOLE_VENUE_PACKAGES_SERVICE_ID,
  )
  return venue?.id ?? null
}

export function resolvePackagesForSchedulingService(
  service: SchedulingService,
  packages: readonly EventPackage[],
): EventPackage[] {
  const active = packages.filter((pkg) => pkg.isActive)

  if (isPackageServiceOffering(service)) {
    return sortByTier(active.filter((pkg) => pkg.serviceId === service.id))
  }

  if (service.id === PRIVATE_PLAY_MEETING_ROOMS_SERVICE_ID) {
    return meetingRoomPackagesFromCatalog(active)
  }

  if (service.id === EVENT_WHOLE_VENUE_PACKAGES_SERVICE_ID) {
    return wholeVenuePackagesFromCatalog(active)
  }

  if (service.id === EVENT_PARTY_ROOM_PACKAGES_SERVICE_ID) {
    return partyRoomPackagesFromCatalog(active)
  }

  if (service.id === PRIVATE_PLAY_FULL_VENUE_SERVICE_ID) {
    return sortByTier(
      active.filter(
        (pkg) =>
          pkg.isWholeVenue === true &&
          (pkg.serviceId === service.id ||
            PARTY_FALLBACK_SERVICE_IDS.has(pkg.serviceId)),
      ),
    )
  }

  if (
    service.id === PRIVATE_PLAY_ROOM_SERVICE_ID ||
    (service.categoryId === PRIVATE_PLAY_CATEGORY_ID &&
      service.id !== PRIVATE_PLAY_MEETING_ROOMS_SERVICE_ID &&
      service.id !== PRIVATE_PLAY_FULL_VENUE_SERVICE_ID)
  ) {
    return sortByTier(
      active.filter(
        (pkg) =>
          !pkg.isWholeVenue &&
          pkg.serviceId !== PRIVATE_PLAY_MEETING_ROOMS_SERVICE_ID &&
          !MEETING_ROOM_PACKAGE_ID_SET.has(pkg.id) &&
          (pkg.serviceId === service.id ||
            PARTY_FALLBACK_SERVICE_IDS.has(pkg.serviceId)),
      ),
    )
  }

  if (service.serviceType === 'PARTY_PACKAGE') {
    const serviceIds = new Set<string>([
      service.id,
      ...PARTY_FALLBACK_SERVICE_IDS,
    ])
    return sortByTier(active.filter((pkg) => serviceIds.has(pkg.serviceId)))
  }

  return sortByTier(active.filter((pkg) => pkg.serviceId === service.id))
}
