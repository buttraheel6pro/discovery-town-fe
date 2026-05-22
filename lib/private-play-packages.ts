/** Package resolution for Private Play customer listings. */
import {
  PRIVATE_PLAY_FULL_VENUE_SERVICE_ID,
  PRIVATE_PLAY_MEETING_ROOMS_SERVICE_ID,
  resolvePackagesForSchedulingService,
} from '@/lib/event-package-catalog'
import type { EventPackage, SchedulingService } from '@/lib/types'

export const PRIVATE_PLAY_CATEGORY_ID = 'cat-private-play' as const

export {
  PRIVATE_PLAY_FULL_VENUE_SERVICE_ID,
  PRIVATE_PLAY_MEETING_ROOMS_SERVICE_ID,
}

export function isPrivatePlayService(
  service: Pick<SchedulingService, 'categoryId'>,
): boolean {
  return service.categoryId === PRIVATE_PLAY_CATEGORY_ID
}

export function resolvePrivatePlayListingPackages(
  service: SchedulingService,
  packages: readonly EventPackage[],
): EventPackage[] {
  return resolvePackagesForSchedulingService(service, packages)
}

export function privatePlayPackageSectionTitle(serviceId: string): string {
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
