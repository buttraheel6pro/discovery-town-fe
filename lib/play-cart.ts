/** Play, gym & event scheduling checkout helpers — cart grouping flags and line-item copy. */

import { isEventCatalogService } from '@/lib/scheduling-visibility'
import { formatPrice, formatSlotDate, formatSlotTimeRange } from '@/lib/utils'
import type { SchedulingBooking, SchedulingService } from '@/lib/types'

export const PLAY_CART_BOOKING_META_KEY = 'playCartBooking' as const
export const GYM_CART_BOOKING_META_KEY = 'gymCartBooking' as const
export const EVENT_CART_BOOKING_META_KEY = 'eventCartBooking' as const

export interface PlayCartDescriptionExtras {
  readonly packageName?: string | null
}

/** Open-play facility bookings are held in cart until shop checkout (mock). */
export function isPlayCartCheckoutService(service: SchedulingService): boolean {
  return service.serviceType === 'OPEN_PLAY'
}

/** Court / sports facility bookings (Gym top-level) use cart checkout like open play. */
export function isGymFacilityCartCheckoutService(service: SchedulingService): boolean {
  return service.serviceType === 'COURT_BOOKING'
}

/** Gym page class listings (`cat-gym-*`) use cart checkout on the class detail page. */
export function isGymClassCartCheckoutService(service: SchedulingService): boolean {
  return service.categoryId.startsWith('cat-gym-')
}

export function isPlayCartBookingMetadata(
  metadata: Record<string, unknown> | undefined,
): boolean {
  return metadata?.[PLAY_CART_BOOKING_META_KEY] === true
}

export function isGymCartBookingMetadata(
  metadata: Record<string, unknown> | undefined,
): boolean {
  return metadata?.[GYM_CART_BOOKING_META_KEY] === true
}

export function isEventCartBookingMetadata(
  metadata: Record<string, unknown> | undefined,
): boolean {
  return metadata?.[EVENT_CART_BOOKING_META_KEY] === true
}

/** Scheduled event catalog services use cart checkout on the event detail page. */
export function isEventSlotCartCheckoutService(service: SchedulingService): boolean {
  return isEventCatalogService(service)
}

export interface EventCartDescriptionExtras {
  readonly packageName?: string | null
  readonly occasionLabel?: string | null
  readonly selectedDate?: string | null
}

export function buildPlayCartBookingDescription(
  booking: SchedulingBooking,
  extras?: PlayCartDescriptionExtras,
): string {
  const lines: string[] = []
  if (extras?.packageName?.trim()) {
    lines.push(`Package: ${extras.packageName.trim()}`)
  }
  if (booking.startAt && booking.endAt) {
    lines.push(
      `${formatSlotDate(booking.startAt)} · ${formatSlotTimeRange(booking.startAt, booking.endAt)}`,
    )
  } else if (booking.startAt) {
    lines.push(`${formatSlotDate(booking.startAt)} · ${booking.startAt}`)
  }
  lines.push(`Guests: ${booking.guestCount}`)
  if (booking.participantName?.trim()) {
    lines.push(`Participant: ${booking.participantName.trim()}`)
  }
  if (booking.notes?.trim()) {
    lines.push(`Notes: ${booking.notes.trim()}`)
  }
  if (booking.specialInstructions?.trim()) {
    lines.push(`Instructions: ${booking.specialInstructions.trim()}`)
  }
  if (booking.addOns.length > 0) {
    for (const line of booking.addOns) {
      if (line.totalPrice > 0 || line.quantity > 0) {
        lines.push(`${line.name} ×${line.quantity} (${formatPrice(line.totalPrice)})`)
      }
    }
  }
  if (booking.couponCode) {
    lines.push(`Coupon: ${booking.couponCode}`)
  }
  return lines.join('\n')
}

/** Same line format as play; used for gym facility + gym class cart lines. */
export function buildGymCartBookingDescription(
  booking: SchedulingBooking,
  extras?: PlayCartDescriptionExtras,
): string {
  return buildPlayCartBookingDescription(booking, extras)
}

export function buildEventCartBookingDescription(
  booking: SchedulingBooking,
  extras?: EventCartDescriptionExtras,
): string {
  const lead: string[] = []
  if (extras?.occasionLabel?.trim()) {
    lead.push(`Occasion: ${extras.occasionLabel.trim()}`)
  }
  if (extras?.selectedDate) {
    lead.push(`Preferred date: ${extras.selectedDate}`)
  }
  const body = buildPlayCartBookingDescription(booking, {
    packageName: extras?.packageName ?? null,
  })
  if (lead.length === 0) {
    return body
  }
  return `${lead.join('\n')}\n${body}`
}
