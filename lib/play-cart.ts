/** Play, gym & event scheduling checkout helpers — cart grouping flags and line-item copy. */

import { isOpenPlayPassCatalogService } from '@/lib/open-play-pass-catalog'
import { usesEventTicketBookingSidebar } from '@/lib/scheduling-slot-availability'
import {
  getCustomerSchedulingMenuSlug,
  type SchedulingCategoryPlacementFields,
} from '@/lib/catalog-placement'
import { isLearnSchedulingService } from '@/lib/learn-catalog'
import { getSchedulingTopLevelId } from '@/lib/scheduling-consumer-categories'
import { isEventCatalogService } from '@/lib/scheduling-visibility'
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
export const LEARN_CART_BOOKING_META_KEY = 'learnCartBooking' as const
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

/** Learn page programs (`cat-learn-*`) use cart checkout on the learn detail page. */
export function isLearnCartCheckoutService(service: SchedulingService): boolean {
  return isLearnSchedulingService(service)
}

function serviceOnPlayMenu(
  service: SchedulingService,
  category?: SchedulingCategoryPlacementFields | null,
): boolean {
  const menuSlug = category ? getCustomerSchedulingMenuSlug(category) : null
  if (menuSlug) {
    return menuSlug === 'play'
  }
  return getSchedulingTopLevelId(service.categoryId) === 'PLAY'
}

/** Play top-level class sessions (camps, parents night, etc.) checkout via cart like open play. */
export function isPlayClassCartCheckoutService(
  service: SchedulingService,
  category?: SchedulingCategoryPlacementFields | null,
): boolean {
  if (isGymClassCartCheckoutService(service)) return false
  if (isLearnCartCheckoutService(service)) return false
  if (isEventSlotCartCheckoutService(service, category ? new Map([[category.id, category]]) : undefined)) {
    return false
  }
  const classLike =
    service.serviceType === 'GYM_CLASS' ||
    service.serviceType === 'SWIM_CLASS' ||
    service.serviceType === 'COACHING_SESSION' ||
    service.serviceType === 'FITNESS_ASSESSMENT'
  if (!classLike) return false
  return serviceOnPlayMenu(service, category ?? null)
}

/**
 * Play menu Service listing (not pass/package) with admin-configured availability calendar.
 * e.g. custom Play subcategory services routed to the class detail page.
 */
export function isPlayMenuServiceEventScheduleListing(
  service: SchedulingService,
  category: SchedulingCategoryPlacementFields | null | undefined,
  showEventBookingSchedule: boolean,
): boolean {
  if (!showEventBookingSchedule) {
    return false
  }
  if (service.bookingOfferingKind === 'PASS') {
    return false
  }
  if (service.isPackageService === true) {
    return false
  }
  if (!serviceOnPlayMenu(service, category ?? null)) {
    return false
  }
  return !isPlayClassCartCheckoutService(service, category ?? null)
}

/**
 * Class detail split layout — availability left, Add to cart right, booking form below.
 * Gym listings always; Play service listings when admin date/time selection is enabled.
 */
export function usesClassDetailSplitCartCheckoutLayout(
  service: SchedulingService,
  category: SchedulingCategoryPlacementFields | null | undefined,
  showEventBookingSchedule: boolean,
): boolean {
  if (service.isPackageService === true) {
    return false
  }
  if (isGymClassCartCheckoutService(service)) {
    return true
  }
  if (isLearnCartCheckoutService(service)) {
    return true
  }
  if (
    isPlayClassCartCheckoutService(service, category ?? null) &&
    showEventBookingSchedule
  ) {
    return true
  }
  return isPlayMenuServiceEventScheduleListing(
    service,
    category,
    showEventBookingSchedule,
  )
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

export function isLearnCartBookingMetadata(
  metadata: Record<string, unknown> | undefined,
): boolean {
  return metadata?.[LEARN_CART_BOOKING_META_KEY] === true
}

export function isEventCartBookingMetadata(
  metadata: Record<string, unknown> | undefined,
): boolean {
  return metadata?.[EVENT_CART_BOOKING_META_KEY] === true
}

/** Scheduled event catalog services use cart checkout on the event detail page. */
export function isEventSlotCartCheckoutService(
  service: SchedulingService,
  categoryById?: ReadonlyMap<string, SchedulingCategoryPlacementFields>,
): boolean {
  return isEventCatalogService(service, categoryById)
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

/** Learn program enrollment cart lines. */
export function buildLearnCartBookingDescription(
  booking: SchedulingBooking,
  extras?: PlayCartDescriptionExtras,
): string {
  const lines: string[] = []
  if (extras?.packageName?.trim()) {
    lines.push(`Package: ${extras.packageName.trim()}`)
  }
  if (booking.startAt && booking.endAt) {
    const startLabel = formatSlotDate(booking.startAt)
    const endLabel = formatSlotDate(booking.endAt)
    lines.push(
      startLabel === endLabel
        ? `${startLabel} · ${formatSlotTimeRange(booking.startAt, booking.endAt)}`
        : `Full program: ${startLabel} – ${endLabel}`,
    )
    if (startLabel !== endLabel) {
      lines.push('Includes all scheduled sessions in this program.')
    }
  }
  lines.push(`Students: ${booking.guestCount}`)
  if (booking.participantName?.trim()) {
    lines.push(`Student: ${booking.participantName.trim()}`)
  }
  if (booking.primaryGuardianName?.trim()) {
    lines.push(`Primary guardian: ${booking.primaryGuardianName.trim()}`)
  }
  if (booking.secondaryGuardianName?.trim()) {
    lines.push(`Secondary guardian: ${booking.secondaryGuardianName.trim()}`)
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
