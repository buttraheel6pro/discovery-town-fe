/** Admin listing kind (Service / Package service / Pass) ↔ scheduling service fields. */
import type { SchedulingBookingMode, SchedulingOfferingKind, SchedulingService } from '@/lib/types'

export type AdminListingKindSelectValue = 'SERVICE' | 'PACKAGE_SERVICE' | 'PASS'

export const ADMIN_LISTING_KIND_OPTIONS: readonly {
  readonly value: AdminListingKindSelectValue
  readonly label: string
}[] = [
  { value: 'SERVICE', label: 'Service' },
  { value: 'PACKAGE_SERVICE', label: 'Package service' },
  { value: 'PASS', label: 'Pass' },
]

export function adminListingKindFromService(
  service: Pick<SchedulingService, 'bookingOfferingKind' | 'isPackageService'>,
): AdminListingKindSelectValue {
  if (service.bookingOfferingKind === 'PASS') {
    return 'PASS'
  }
  if (service.isPackageService === true) {
    return 'PACKAGE_SERVICE'
  }
  return 'SERVICE'
}

export interface ListingKindDraftFields {
  readonly bookingOfferingKind: SchedulingOfferingKind
  readonly isPackageService: boolean
  readonly serviceType?: SchedulingService['serviceType']
  readonly bookingMode?: SchedulingBookingMode
}

export function draftFieldsFromAdminListingKind(
  value: AdminListingKindSelectValue,
): ListingKindDraftFields {
  switch (value) {
    case 'PASS':
      return { bookingOfferingKind: 'PASS', isPackageService: false }
    case 'PACKAGE_SERVICE':
      return {
        bookingOfferingKind: 'SERVICE',
        isPackageService: true,
        serviceType: 'PARTY_PACKAGE',
        bookingMode: 'SCHEDULED',
      }
    default:
      return { bookingOfferingKind: 'SERVICE', isPackageService: false }
  }
}

/** Customer + catalog — package-only shell (Private Play layout when packages are linked). */
export function isPackageServiceOffering(
  service: Pick<SchedulingService, 'isPackageService'>,
): boolean {
  return service.isPackageService === true
}
