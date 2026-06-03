/** Event booking schedule mode — admin config and customer date/time behaviour. */
import { getSchedulingTopLevelId } from '@/lib/scheduling-consumer-categories'
import {
  findUpcomingSlotForService,
  isCampPlayCatalogService,
  windowsFromSchedulingSlots,
} from '@/lib/scheduling-slot-availability'
import { ymdFromInstant } from '@/lib/ymd-date'
import { formatSlotTimeRange } from '@/lib/utils'
import {
  EventBookingScheduleModeEnum,
  type AvailableWindow,
  type EventBookingScheduleMode,
  type SchedulingService,
  type SchedulingSlot,
} from '@/lib/types'

export interface EventBookingScheduleDraft {
  readonly eventBookingScheduleMode: EventBookingScheduleMode
}

export function eventBookingScheduleDraftFromService(
  service: Partial<EventBookingScheduleDraft> & {
    readonly bookingMode?: 'OPEN' | 'SCHEDULED'
  },
): EventBookingScheduleDraft {
  const mode =
    service.eventBookingScheduleMode ??
    (service.bookingMode === 'OPEN'
      ? EventBookingScheduleModeEnum.PER_HOUR
      : EventBookingScheduleModeEnum.PER_EVENT)
  return {
    eventBookingScheduleMode: mode,
  }
}

export function eventBookingSchedulePatchFromDraft(
  draft: EventBookingScheduleDraft,
): Pick<SchedulingService, 'eventBookingScheduleMode'> {
  return {
    eventBookingScheduleMode: draft.eventBookingScheduleMode,
  }
}

export function isEventProgramService(
  service: Pick<SchedulingService, 'categoryId'>,
): boolean {
  return getSchedulingTopLevelId(service.categoryId) === 'EVENT'
}

export function isEventProgramCategoryId(categoryId: string): boolean {
  return getSchedulingTopLevelId(categoryId) === 'EVENT'
}

/** True when admin has set an explicit customer date/time selection mode. */
export function hasExplicitEventBookingScheduleMode(
  service: Pick<SchedulingService, 'eventBookingScheduleMode'>,
): boolean {
  return service.eventBookingScheduleMode != null
}

/** Customer detail pages that should render admin-configured date/time selection. */
export function shouldShowCustomerEventBookingSchedule(
  service: Pick<
    SchedulingService,
    'eventBookingScheduleMode' | 'categoryId' | 'serviceType'
  >,
): boolean {
  if (hasExplicitEventBookingScheduleMode(service)) {
    return true
  }
  return isCampPlayCatalogService(service)
}

/** View-only availability calendar (fixed sessions, no picker) — per event mode only. */
export function shouldShowCustomerEventPerEventSchedule(
  service: Pick<SchedulingService, 'eventBookingScheduleMode' | 'bookingMode'>,
): boolean {
  return resolveEventBookingScheduleMode(service) === EventBookingScheduleModeEnum.PER_EVENT
}

/** Customer availability section helper copy under the Availability heading. */
export function getEventBookingScheduleAvailabilitySubtitle(
  mode: EventBookingScheduleMode,
  showDayRangePicker: boolean,
): string {
  if (mode === EventBookingScheduleModeEnum.PER_EVENT) {
    return (
      'Scheduled sessions are shown below. Date and time selection is not required — ' +
      'browse the calendar to see when sessions run.'
    )
  }
  if (mode === EventBookingScheduleModeEnum.PER_DAY) {
    if (showDayRangePicker) {
      return (
        'Select a start day, then an end day. Only days with scheduled sessions can be chosen.'
      )
    }
    return 'Choose a day that has a scheduled session. Time selection is not required.'
  }
  return 'Choose a day, then pick an available time slot.'
}

export function resolveEventBookingScheduleMode(
  service: Pick<
    SchedulingService,
    'eventBookingScheduleMode' | 'bookingMode' | 'categoryId' | 'serviceType'
  >,
): EventBookingScheduleMode {
  if (service.eventBookingScheduleMode != null) {
    return service.eventBookingScheduleMode
  }
  if (isCampPlayCatalogService(service)) {
    return EventBookingScheduleModeEnum.PER_EVENT
  }
  if (service.bookingMode === 'OPEN') {
    return EventBookingScheduleModeEnum.PER_HOUR
  }
  return EventBookingScheduleModeEnum.PER_EVENT
}

function isoDateFromInstant(iso: string): string {
  return ymdFromInstant(iso)
}

function isBookableSlot(slot: SchedulingSlot, serviceId: string, now: number): boolean {
  if (slot.serviceId !== serviceId) {
    return false
  }
  if (slot.status === 'CANCELLED' || slot.status === 'COMPLETED') {
    return false
  }
  if (slot.isActive === false) {
    return false
  }
  return new Date(slot.endAt).getTime() > now
}

/** One calendar day per scheduling slot (matches admin session rows). */
function sessionDateFromSlot(slot: SchedulingSlot): string {
  return isoDateFromInstant(slot.startAt)
}

export function getDistinctSessionDatesForService(
  slots: readonly SchedulingSlot[],
  service: Pick<SchedulingService, 'id' | 'categoryId'>,
): string[] {
  const now = Date.now()
  const dates = new Set<string>()
  for (const slot of slots) {
    if (!isBookableSlot(slot, service.id, now)) {
      continue
    }
    dates.add(sessionDateFromSlot(slot))
  }
  return [...dates].sort()
}

/** First upcoming session day for opening the availability week strip. */
export function getFirstUpcomingSessionYmdForService(
  slots: readonly SchedulingSlot[],
  service: Pick<SchedulingService, 'id' | 'categoryId'>,
  todayYmd: string,
): string | null {
  const dates = getDistinctSessionDatesForService(slots, service).filter(
    (dateStr) => dateStr >= todayYmd,
  )
  return dates[0] ?? null
}

/** True when the service has sessions on two or more distinct days. */
export function serviceHasMultiDaySessions(
  slots: readonly SchedulingSlot[],
  service: Pick<SchedulingService, 'id' | 'categoryId'>,
): boolean {
  return getDistinctSessionDatesForService(slots, service).length >= 2
}

/** True when any day has more than one session for this service. */
export function serviceHasMultipleSessionsPerDay(
  slots: readonly SchedulingSlot[],
  service: Pick<SchedulingService, 'id' | 'categoryId'>,
): boolean {
  const now = Date.now()
  const countsByDate = new Map<string, number>()
  for (const slot of slots) {
    if (!isBookableSlot(slot, service.id, now)) {
      continue
    }
    const dateStr = sessionDateFromSlot(slot)
    countsByDate.set(dateStr, (countsByDate.get(dateStr) ?? 0) + 1)
  }
  for (const count of countsByDate.values()) {
    if (count > 1) {
      return true
    }
  }
  return false
}

export function shouldShowEventDayRangePicker(
  mode: EventBookingScheduleMode,
  slots: readonly SchedulingSlot[],
  service: Pick<SchedulingService, 'id' | 'categoryId'>,
): boolean {
  if (mode !== EventBookingScheduleModeEnum.PER_DAY) {
    return false
  }
  return serviceHasMultiDaySessions(slots, service)
}

export interface FixedEventScheduleDisplay {
  readonly dateLabel: string
  readonly timeLabel: string
  readonly dateIso: string
  readonly window: AvailableWindow
}

function formatEventLongDate(dateStr: string): string {
  const d = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function resolveFixedEventSchedule(
  service: SchedulingService,
  slots: readonly SchedulingSlot[],
): FixedEventScheduleDisplay | null {
  const slot = findUpcomingSlotForService(slots, service.id)
  if (slot) {
    const dateIso = isoDateFromInstant(slot.startAt)
    return {
      dateLabel: formatEventLongDate(slot.startAt),
      timeLabel: formatSlotTimeRange(slot.startAt, slot.endAt),
      dateIso,
      window: {
        startAt: slot.startAt,
        endAt: slot.endAt,
        spotsRemaining: Math.max(
          0,
          (slot.effectiveCapacity ?? service.capacity) - (slot.bookedCount ?? 0),
        ),
      },
    }
  }

  if (service.startDate && service.startTime && service.endTime) {
    const dateIso = service.startDate
    const startAt = `${service.startDate}T${service.startTime}:00`
    const endAt = `${service.endDate ?? service.startDate}T${service.endTime}:00`
    return {
      dateLabel: formatEventLongDate(service.startDate),
      timeLabel: `${service.startTime} – ${service.endTime}`,
      dateIso,
      window: {
        startAt,
        endAt,
        spotsRemaining: Math.max(
          0,
          (service.maxAttendees ?? service.capacity) - (service.registeredCount ?? 0),
        ),
      },
    }
  }

  return null
}

export function buildEventDayAvailabilityMap(
  slots: readonly SchedulingSlot[],
  serviceId: string,
  capacity: number,
): ReadonlyMap<string, number> {
  const now = Date.now()
  const map = new Map<string, number>()
  for (const slot of slots) {
    if (!isBookableSlot(slot, serviceId, now)) {
      continue
    }
    const dateStr = isoDateFromInstant(slot.startAt)
    const booked = slot.bookedCount ?? 0
    const cap = slot.effectiveCapacity ?? capacity
    const remaining = Math.max(0, cap - booked)
    map.set(dateStr, Math.max(map.get(dateStr) ?? 0, remaining))
  }
  return map
}

/** True when the date has at least one bookable session with remaining capacity. */
export function isEventPerDayDateSelectable(
  availabilityMap: ReadonlyMap<string, number>,
  dateStr: string,
  todayIso: string,
): boolean {
  if (dateStr < todayIso) {
    return false
  }
  const remaining = availabilityMap.get(dateStr)
  return remaining != null && remaining > 0
}

function addOneDayToYmd(ymd: string): string {
  const [year, month, day] = ymd.split('-').map((part) => Number.parseInt(part, 10))
  const next = new Date(year, month - 1, day + 1, 12, 0, 0, 0)
  const y = next.getFullYear()
  const m = String(next.getMonth() + 1).padStart(2, '0')
  const d = String(next.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function normalizeYmdRange(
  fromYmd: string,
  toYmd: string,
): { readonly start: string; readonly end: string } {
  return fromYmd <= toYmd
    ? { start: fromYmd, end: toYmd }
    : { start: toYmd, end: fromYmd }
}

/** Count bookable session days within an inclusive from–to range. */
export function countEventPerDaySessionDaysInRange(
  availabilityMap: ReadonlyMap<string, number>,
  todayIso: string,
  fromYmd: string,
  toYmd: string,
): number {
  const { start, end } = normalizeYmdRange(fromYmd, toYmd)
  let count = 0
  let cursor = start
  while (cursor <= end) {
    if (isEventPerDayDateSelectable(availabilityMap, cursor, todayIso)) {
      count += 1
    }
    cursor = addOneDayToYmd(cursor)
  }
  return count
}

export function resolveHourlyWindowsForEventDate(
  service: SchedulingService,
  slots: readonly SchedulingSlot[],
  dateStr: string,
  durationMinutes: number,
): AvailableWindow[] {
  const fromSlots = windowsFromSchedulingSlots(slots, service, dateStr, {
    durationMinutes,
  })
  if (fromSlots.length > 0) {
    return fromSlots
  }
  return []
}

export interface EventPerEventSessionTimeBlock {
  readonly timeLabel: string
  readonly window: AvailableWindow
}

function sessionTimeOfDayKey(startAt: string, endAt: string): string {
  const start = new Date(startAt)
  const end = new Date(endAt)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${pad(start.getHours())}:${pad(start.getMinutes())}-${pad(end.getHours())}:${pad(end.getMinutes())}`
}

/** Unique session start–end times (one per time-of-day, not hourly slots) for per-event display. */
export function resolveDistinctEventPerEventSessionTimes(
  service: SchedulingService,
  slots: readonly SchedulingSlot[],
): readonly EventPerEventSessionTimeBlock[] {
  const now = Date.now()
  const seen = new Set<string>()
  const blocks: EventPerEventSessionTimeBlock[] = []

  const bookableSlots = slots
    .filter((slot) => isBookableSlot(slot, service.id, now))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())

  for (const slot of bookableSlots) {
    const key = sessionTimeOfDayKey(slot.startAt, slot.endAt)
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    const capacity = slot.effectiveCapacity ?? service.capacity
    const booked = slot.bookedCount ?? 0
    blocks.push({
      timeLabel: formatSlotTimeRange(slot.startAt, slot.endAt),
      window: {
        startAt: slot.startAt,
        endAt: slot.endAt,
        spotsRemaining: Math.max(0, capacity - booked),
      },
    })
  }

  return blocks
}

export function buildDayRangeBookingWindow(
  fromDate: string,
  toDate: string,
  capacity: number,
): AvailableWindow {
  const startAt = `${fromDate}T09:00:00`
  const endAt = `${toDate}T17:00:00`
  return {
    startAt,
    endAt,
    spotsRemaining: capacity,
  }
}
