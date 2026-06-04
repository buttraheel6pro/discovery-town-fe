/** Max pass count rules for open-play and other per-person bookings. */
import { isOpenPlaySessionBookingService } from '@/lib/booking-household'
import type { SchedulingService } from '@/lib/types'

export function resolveMaxPassCount(service: SchedulingService): number | null {
  const raw = service.maxPassCount
  if (raw == null || !Number.isFinite(raw) || raw < 1) {
    return null
  }
  return Math.floor(raw)
}

export function clampPassCount(
  count: number,
  max: number | null,
  min = 1,
): number {
  const floored = Math.max(min, Math.floor(count))
  if (max == null) {
    return floored
  }
  return Math.min(floored, max)
}

/** When max is 1, customer UI hides +/- steppers. */
export function isPassCountFixed(maxPassCount: number | null, min = 1): boolean {
  return maxPassCount != null && maxPassCount <= min
}

export function showMaxPassCountAdminField(
  service: Pick<SchedulingService, 'id' | 'categoryId'>,
): boolean {
  return (
    service.categoryId === 'cat-open-play' ||
    service.categoryId === 'cat-parents-night' ||
    isOpenPlaySessionBookingService(service.id)
  )
}

export function passCountHelperText(
  service: SchedulingService,
  maxPassCount: number | null,
): string | undefined {
  if (!isOpenPlaySessionBookingService(service.id)) {
    return undefined
  }
  if (maxPassCount == null) {
    return 'Primary child passes for this session.'
  }
  if (isPassCountFixed(maxPassCount)) {
    return '1 pass per booking for this session.'
  }
  return `Up to ${maxPassCount} passes per booking.`
}
