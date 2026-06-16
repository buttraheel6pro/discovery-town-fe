/** Availability status markers for the customer booking calendar. */

export type AvailabilityCalendarDayStatus =
  | 'lots-of-space'
  | 'filling-up'
  | 'sold-out'
  | 'online-closed'
  | 'unavailable'

export function resolveAvailabilityCalendarDayStatus(
  dateStr: string,
  todayStr: string,
  hasSession: boolean,
  remainingSpots: number | undefined,
): AvailabilityCalendarDayStatus {
  if (dateStr < todayStr) {
    return 'unavailable'
  }
  if (!hasSession) {
    return 'unavailable'
  }
  if (remainingSpots == null) {
    return 'lots-of-space'
  }
  if (remainingSpots <= 0) {
    return 'sold-out'
  }
  if (remainingSpots <= 2) {
    return 'filling-up'
  }
  return 'lots-of-space'
}

export function resolveRentalAvailabilityDayStatus(
  dateStr: string,
  todayStr: string,
  availabilityMap: ReadonlyMap<string, number>,
  stockQuantity: number,
): AvailabilityCalendarDayStatus {
  if (dateStr < todayStr) {
    return 'unavailable'
  }
  const booked = availabilityMap.get(dateStr) ?? 0
  if (stockQuantity > 0 && booked >= stockQuantity) {
    return 'sold-out'
  }
  const remaining = stockQuantity > 0 ? stockQuantity - booked : undefined
  return resolveAvailabilityCalendarDayStatus(dateStr, todayStr, true, remaining)
}
