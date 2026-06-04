/** Admin scheduling catalog — when per-service slot creation applies. */
import { isPackageServiceOffering } from '@/lib/scheduling-listing-kind'
import type { SchedulingService } from '@/lib/types'

/** Recurring slot creation applies only to scheduled bookable services, not passes or shells. */
export function serviceSupportsAdminSlotCreation(
  service: Pick<
    SchedulingService,
    'bookingMode' | 'bookingOfferingKind' | 'isPackageService'
  >,
): boolean {
  if (service.bookingOfferingKind === 'PASS') {
    return false
  }
  if (isPackageServiceOffering(service)) {
    return false
  }
  return service.bookingMode === 'SCHEDULED'
}
