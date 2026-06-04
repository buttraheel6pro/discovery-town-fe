/** Package resolution for Private Play customer listings. */
import { isPackageOnlyCatalogService } from '@/lib/event-catalog-display'
import {
  FIELD_TRIP_PRESCHOOL_SCHOOL_SERVICE_ID,
  PRIVATE_PLAY_FULL_VENUE_SERVICE_ID,
  PRIVATE_PLAY_MEETING_ROOMS_SERVICE_ID,
  resolvePackagesForSchedulingService,
} from '@/lib/event-package-catalog'
import { getSchedulingTopLevelId } from '@/lib/scheduling-consumer-categories'
import type { EventPackage, SchedulingService } from '@/lib/types'

export const PRIVATE_PLAY_CATEGORY_ID = 'cat-private-play' as const

export {
  FIELD_TRIP_PRESCHOOL_SCHOOL_SERVICE_ID,
  PRIVATE_PLAY_FULL_VENUE_SERVICE_ID,
  PRIVATE_PLAY_MEETING_ROOMS_SERVICE_ID,
}

export function isPrivatePlayService(
  service: Pick<SchedulingService, 'categoryId'>,
): boolean {
  return service.categoryId === PRIVATE_PLAY_CATEGORY_ID
}

/** Play package-only services with attached tiers use the private-play detail layout. */
export function usesPlayPackageBookingLayout(
  service: SchedulingService,
  packages: readonly EventPackage[],
): boolean {
  if (isPrivatePlayService(service)) {
    return false
  }
  if (getSchedulingTopLevelId(service.categoryId) !== 'PLAY') {
    return false
  }
  if (!isPackageOnlyCatalogService(service)) {
    return false
  }
  return resolvePrivatePlayListingPackages(service, packages).length > 0
}

export function shouldUsePrivatePlayDetailLayout(
  service: SchedulingService,
  packages: readonly EventPackage[],
): boolean {
  return isPrivatePlayService(service) || usesPlayPackageBookingLayout(service, packages)
}

export function resolvePrivatePlayListingPackages(
  service: SchedulingService,
  packages: readonly EventPackage[],
): EventPackage[] {
  return resolvePackagesForSchedulingService(service, packages)
}

export function privatePlayPackageSectionTitle(serviceId: string): string {
  if (serviceId === FIELD_TRIP_PRESCHOOL_SCHOOL_SERVICE_ID) {
    return 'Field trip packages'
  }
  if (serviceId === PRIVATE_PLAY_FULL_VENUE_SERVICE_ID) {
    return 'Whole venue'
  }
  if (serviceId === PRIVATE_PLAY_MEETING_ROOMS_SERVICE_ID) {
    return 'Meeting room packages'
  }
  return 'Private room booking'
}

export function privatePlayListingFromPrice(
  service: SchedulingService,
  listingPackages: readonly EventPackage[],
): number {
  if (listingPackages.length === 0) {
    return service.basePrice
  }
  return Math.min(...listingPackages.map((pkg) => pkg.basePrice))
}
