/** Additional sibling pricing on open-play session bookings (not a catalog add-on). */
import {
  isOpenPlaySessionBookingService,
  isSiblingPassBookingService,
} from '@/lib/booking-household'
import type { SchedulingService } from '@/lib/types'

export function parseAdditionalSiblingUnitPrice(
  service: SchedulingService,
): number | null {
  if (isSiblingPassBookingService(service.id)) {
    return null
  }
  const raw = service.siblingPrice?.trim()
  if (raw) {
    const parsed = Number.parseFloat(raw)
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed
    }
  }
  if (isOpenPlaySessionBookingService(service.id)) {
    return 10
  }
  return null
}

export function showsAdditionalSiblingPicker(service: SchedulingService): boolean {
  if (isSiblingPassBookingService(service.id)) {
    return false
  }
  return parseAdditionalSiblingUnitPrice(service) != null
}
