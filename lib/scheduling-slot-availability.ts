/** Map catalog scheduling slots to customer availability windows. */
import {
  expandSchedulingSlotToWindows,
} from '@/lib/open-booking-slot-windows'
import { locations } from '@/lib/mock-data'
import { formatSlotTimeRange } from '@/lib/utils'
import type { AvailableWindow, SchedulingService, SchedulingSlot } from '@/lib/types'

export const SPECIAL_PLAY_EVENTS_CATEGORY_ID = 'cat-special-play-events' as const
export const CAMP_PLAY_CATEGORY_ID = 'cat-camps-play' as const
export const SUMMER_CAMP_PLAY_CATEGORY_ID = 'cat-summer-camp-play' as const
export const PARENTS_NIGHT_CATEGORY_ID = 'cat-parents-night' as const

const CAMP_SINGLE_DAY_SERVICE_ID = 'svc-camp-mlk-day' as const
const CAMP_DAILY_HOURS_LABEL = '9:00 AM – 3:00 PM'

const EVENT_TICKET_BOOKING_CATEGORY_IDS = new Set<string>([
  SPECIAL_PLAY_EVENTS_CATEGORY_ID,
  'cat-camps-play',
  SUMMER_CAMP_PLAY_CATEGORY_ID,
  'cat-parents-night',
])

/** Ticket counter + cart sidebar (special play, camps, field trips). */
export function usesEventTicketBookingSidebar(
  service: Pick<SchedulingService, 'categoryId'>,
): boolean {
  return EVENT_TICKET_BOOKING_CATEGORY_IDS.has(service.categoryId)
}

/** Play-area camp programmes (summer / break camps) — use per-event availability calendar. */
export function isCampPlayCatalogService(
  service: Pick<SchedulingService, 'categoryId' | 'serviceType'>,
): boolean {
  return (
    service.categoryId === CAMP_PLAY_CATEGORY_ID ||
    service.categoryId === SUMMER_CAMP_PLAY_CATEGORY_ID ||
    service.serviceType === 'CAMP'
  )
}

/** Parents Night Out — availability + register below, Add to cart on the right. */
export function isParentsNightOutCatalogService(
  service: Pick<SchedulingService, 'categoryId'>,
): boolean {
  return service.categoryId === PARENTS_NIGHT_CATEGORY_ID
}

/** Camp or Parents Night Out event detail layout (no meta grid, split checkout). */
export function usesPlayEventCheckoutLayout(
  service: Pick<SchedulingService, 'categoryId' | 'serviceType'>,
): boolean {
  return isCampPlayCatalogService(service) || isParentsNightOutCatalogService(service)
}

export function isCampMonthLongBooking(
  service: Pick<SchedulingService, 'categoryId' | 'id'>,
  slot: SchedulingSlot,
): boolean {
  if (service.categoryId !== CAMP_PLAY_CATEGORY_ID) {
    return false
  }
  if (service.id === CAMP_SINGLE_DAY_SERVICE_ID) {
    return false
  }
  const start = new Date(slot.startAt)
  const end = new Date(slot.endAt)
  return end.getTime() - start.getTime() > 24 * 60 * 60_000
}

export interface SlotDrivenEventDisplayMeta {
  readonly dateLabel: string
  readonly timeLabel: string
  readonly locationLabel: string
  readonly organiserLabel: string
}

function formatEventLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatCampMonthDateRange(startAt: string, endAt: string): string {
  const start = new Date(startAt)
  const end = new Date(endAt)
  const sameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()

  if (sameMonth) {
    const monthYear = start.toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    })
    const firstDay = start.getDate()
    const lastDay = end.getDate()
    return `${monthYear} · ${firstDay}–${lastDay} (month-long camp)`
  }

  const startLabel = start.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const endLabel = end.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return `${startLabel} – ${endLabel} (month-long camp)`
}

function resolveLocationName(
  locationId: string | null | undefined,
  fallback?: string | null,
): string {
  if (locationId) {
    const match = locations.find((entry) => entry.id === locationId)
    if (match?.name) {
      return match.name
    }
  }
  return fallback?.trim() || '—'
}

function isoDateFromInstant(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function windowsFromSchedulingSlots(
  slots: readonly SchedulingSlot[],
  service: SchedulingService,
  dateStr: string,
  options?: {
    readonly durationMinutes?: number
    readonly now?: number
    /** When true, includes sold-out windows (for view-only calendars). */
    readonly includeUnavailable?: boolean
  },
): AvailableWindow[] {
  const now = options?.now ?? Date.now()
  const matchingSlots = slots
    .filter((slot) => {
      if (slot.serviceId !== service.id) {
        return false
      }
      if (slot.status === 'CANCELLED' || slot.status === 'COMPLETED') {
        return false
      }
      if (slot.isActive === false) {
        return false
      }
      if (isoDateFromInstant(slot.startAt) !== dateStr) {
        return false
      }
      return new Date(slot.endAt).getTime() > now
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())

  const windows: AvailableWindow[] = []
  for (const slot of matchingSlots) {
    windows.push(
      ...expandSchedulingSlotToWindows(slot, service, {
        durationMinutes: options?.durationMinutes,
        now,
      }),
    )
  }

  return windows
    .filter((window) => options?.includeUnavailable || window.spotsRemaining > 0)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
}

/** Next bookable slot for a service (used on event detail headers). */
export function findUpcomingSlotForService(
  slots: readonly SchedulingSlot[],
  serviceId: string,
): SchedulingSlot | undefined {
  const now = Date.now()
  return slots
    .filter((slot) => {
      if (slot.serviceId !== serviceId) {
        return false
      }
      if (slot.status === 'CANCELLED' || slot.status === 'COMPLETED') {
        return false
      }
      if (slot.isActive === false) {
        return false
      }
      return new Date(slot.startAt).getTime() > now
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0]
}

export function buildSlotDrivenEventDisplayMeta(
  slot: SchedulingSlot,
  serviceLocation?: string | null,
  service?: Pick<SchedulingService, 'categoryId' | 'id'>,
): SlotDrivenEventDisplayMeta {
  if (service != null && isCampMonthLongBooking(service, slot)) {
    return {
      dateLabel: formatCampMonthDateRange(slot.startAt, slot.endAt),
      timeLabel: `${CAMP_DAILY_HOURS_LABEL} daily (weekdays)`,
      locationLabel: resolveLocationName(slot.locationId, serviceLocation),
      organiserLabel: slot.staffName?.trim() || 'Discovery Town team',
    }
  }

  return {
    dateLabel: formatEventLongDate(slot.startAt),
    timeLabel: formatSlotTimeRange(slot.startAt, slot.endAt),
    locationLabel: resolveLocationName(slot.locationId, serviceLocation),
    organiserLabel: slot.staffName?.trim() || 'Discovery Town team',
  }
}
