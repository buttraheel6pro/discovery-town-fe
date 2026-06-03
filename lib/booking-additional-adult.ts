/** Additional adult pricing on open-play / facility bookings (not a catalog add-on). */
import { isOpenPlaySessionBookingService, PARENTS_NIGHT_OUT_SERVICE_ID } from '@/lib/booking-household'
import type { SchedulingService } from '@/lib/types'

/** Legacy catalog id — must not appear in the add-ons picker. */
export const LEGACY_ADDITIONAL_ADULT_ADD_ON_ID = 'ao-f-3' as const

export function parseAdditionalAdultUnitPrice(service: SchedulingService): number | null {
  if (service.id === PARENTS_NIGHT_OUT_SERVICE_ID) {
    return null
  }
  const raw = service.additionalAdultPrice?.trim()
  if (raw) {
    const parsed = Number.parseFloat(raw)
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed
    }
  }
  return null
}

export function showsAdditionalAdultPicker(service: SchedulingService): boolean {
  return parseAdditionalAdultUnitPrice(service) != null
}

export function resolveFreeAdultCount(service: SchedulingService): number {
  if (service.id === PARENTS_NIGHT_OUT_SERVICE_ID) {
    return 0
  }
  const count = service.freeAdultCount
  if (count != null && Number.isFinite(count) && count >= 0) {
    return count
  }
  if (isOpenPlaySessionBookingService(service.id)) {
    return 2
  }
  return 0
}

export function isExcludedFromCategoryAddOnPicker(addOnId: string): boolean {
  return addOnId === LEGACY_ADDITIONAL_ADULT_ADD_ON_ID
}
