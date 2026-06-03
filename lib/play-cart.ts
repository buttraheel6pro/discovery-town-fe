/** Play, gym & event scheduling checkout helpers — cart grouping flags and line-item copy. */

import { isOpenPlayPassCatalogService } from '@/lib/open-play-pass-catalog'
import { usesEventTicketBookingSidebar } from '@/lib/scheduling-slot-availability'
import { isEventCatalogService } from '@/lib/scheduling-visibility'
import { getSchedulingTopLevelId } from '@/lib/scheduling-consumer-categories'
import { formatPrice, formatSlotDate, formatSlotTimeRange } from '@/lib/utils'
import type { SchedulingBooking, SchedulingService } from '@/lib/types'

/** “Buy now” on play listing cards only (special play, camps). */
export function usesBuyNowListingCta(service: SchedulingService): boolean {
  return usesEventTicketBookingSidebar(service)
}

export const PLAY_CART_BOOKING_META_KEY = 'playCartBooking' as const

/** Primary CTA on Play facility, class, and offsite booking flows. */
export const PLAY_BOOKING_CONFIRM_CART_LABEL = 'Confirm and add to cart' as const

export function getPlayBookingConfirmCartLabel(): string {
  return PLAY_BOOKING_CONFIRM_CART_LABEL
}
export const GYM_CART_BOOKING_META_KEY = 'gymCartBooking' as const
export const EVENT_CART_BOOKING_META_KEY = 'eventCartBooking' as const

export interface PlayCartDescriptionExtras {
  readonly packageName?: string | null
}

/** Open-play facility bookings are held in cart until shop checkout (mock). */
export function isPlayCartCheckoutService(service: SchedulingService): boolean {
  if (isOpenPlayPassCatalogService(service)) {
    return false
  }
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

/** Play top-level class sessions (camps, parents night, etc.) checkout via cart like open play. */
export function isPlayClassCartCheckoutService(service: SchedulingService): boolean {
  if (isGymClassCartCheckoutService(service)) return false
  if (isEventSlotCartCheckoutService(service)) return false
  const classLike =
    service.serviceType === 'GYM_CLASS' ||
    service.serviceType === 'SWIM_CLASS' ||
    service.serviceType === 'COACHING_SESSION' ||
    service.serviceType === 'FITNESS_ASSESSMENT'
  if (!classLike) return false
  return getSchedulingTopLevelId(service.categoryId) === 'PLAY'
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
  if (booking.primaryGuardianName?.trim()) {
    lines.push(`Primary guardian: ${booking.primaryGuardianName.trim()}`)
  }
  if (booking.secondaryGuardianName?.trim()) {
    lines.push(`Secondary guardian: ${booking.secondaryGuardianName.trim()}`)
  }
  if (booking.accompanyingAdultName?.trim()) {
    lines.push(`Guardian: ${booking.accompanyingAdultName.trim()}`)
  }
  if (booking.participantChildIds != null && booking.participantChildIds.length > 0) {
    lines.push(`Children (${booking.participantChildIds.length}): household selection`)
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
