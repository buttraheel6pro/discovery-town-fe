/** Event booking schedule mode — admin config and customer date/time behaviour. */
import { isLearnSchedulingService } from '@/lib/learn-catalog'
import { getSchedulingTopLevelId } from '@/lib/scheduling-consumer-categories'
import { isPackageServiceOffering, isPassOffering } from '@/lib/scheduling-listing-kind'
import { shouldSplitSessionBySlotIncrement } from '@/lib/open-booking-slot-windows'
import {
  findUpcomingSlotForService,
  isCampPlayCatalogService,
  isSpecialPlayEventCatalogService,
  usesScheduledPartyServiceEventBookingSchedule,
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

/** Gym menu class listings (`cat-gym-*`) use the shared availability calendar. */
export function isGymSchedulingClassService(
  service: Pick<SchedulingService, 'categoryId' | 'serviceType'>,
): boolean {
  return service.categoryId.startsWith('cat-gym-') && service.serviceType === 'GYM_CLASS'
}

/** Learn menu programs (`cat-learn-*`) use the shared availability calendar. */
export function isLearnSchedulingClassService(
  service: Pick<SchedulingService, 'categoryId'>,
): boolean {
  return service.categoryId.startsWith('cat-learn-')
}

/** Gym / Learn class detail pages use the compact horizontal date strip. */
export function usesCompactAvailabilityDateStrip(
  service: Pick<SchedulingService, 'categoryId' | 'serviceType'>,
): boolean {
  return isGymSchedulingClassService(service) || isLearnSchedulingService(service)
}

/** Play subcategories created under the Play menu (e.g. cat-play-test). */
export function isCustomPlaySubcategoryService(
  service: Pick<SchedulingService, 'categoryId'>,
): boolean {
  return service.categoryId.startsWith('cat-play-')
}

/** Customer detail page for admin-configured date/time selection (not facilities open-booking). */
export function getCustomerEventScheduleDetailHref(
  service: SchedulingService,
): string | null {
  if (!shouldShowCustomerEventBookingSchedule(service)) {
    return null
  }
  if (isLearnSchedulingService(service)) {
    return `/learn/${service.id}`
  }
  if (
    isGymSchedulingClassService(service) ||
    getSchedulingTopLevelId(service.categoryId) === 'PLAY'
  ) {
    return `/classes/${service.id}`
  }
  return `/events/${service.id}`
}

/** Customer detail pages that should render admin-configured date/time selection. */
export function shouldShowCustomerEventBookingSchedule(
  service: Pick<
    SchedulingService,
    'eventBookingScheduleMode' | 'categoryId' | 'serviceType' | 'bookingMode'
  >,
): boolean {
  if (hasExplicitEventBookingScheduleMode(service)) {
    return true
  }
  if (
    isCustomPlaySubcategoryService(service) &&
    service.bookingMode === 'SCHEDULED'
  ) {
    return true
  }
  if (isCampPlayCatalogService(service)) {
    return true
  }
  if (isGymSchedulingClassService(service)) {
    return true
  }
  if (isLearnSchedulingClassService(service)) {
    return true
  }
  if (isSpecialPlayEventCatalogService(service)) {
    return true
  }
  return usesScheduledPartyServiceEventBookingSchedule(service)
}

/** View-only availability calendar (fixed sessions, no picker) — per event mode only. */
export function shouldShowCustomerEventPerEventSchedule(
  service: Pick<
    SchedulingService,
    'eventBookingScheduleMode' | 'bookingMode' | 'categoryId' | 'serviceType'
  >,
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
  if (isLearnSchedulingClassService(service)) {
    return service.eventBookingScheduleMode ?? EventBookingScheduleModeEnum.PER_EVENT
  }
  if (isGymSchedulingClassService(service)) {
    return EventBookingScheduleModeEnum.PER_HOUR
  }
  if (service.eventBookingScheduleMode != null) {
    return service.eventBookingScheduleMode
  }
  if (isCampPlayCatalogService(service)) {
    return EventBookingScheduleModeEnum.PER_EVENT
  }
  if (isSpecialPlayEventCatalogService(service)) {
    return EventBookingScheduleModeEnum.PER_HOUR
  }
  if (usesScheduledPartyServiceEventBookingSchedule(service)) {
    return EventBookingScheduleModeEnum.PER_HOUR
  }
  if (service.bookingMode === 'OPEN') {
    return EventBookingScheduleModeEnum.PER_HOUR
  }
  return EventBookingScheduleModeEnum.PER_EVENT
}

export interface EventBookingScheduleSelection {
  readonly selectedDate: string
  readonly selectedToDate?: string
  readonly selectedWindow: AvailableWindow | null
  readonly showDayRangePicker?: boolean
}

/** True when the customer must pick a time slot before booking details. */
export function eventBookingScheduleRequiresTimeSelection(
  mode: EventBookingScheduleMode,
): boolean {
  return mode === EventBookingScheduleModeEnum.PER_HOUR
}

/** Scheduled bookable services — customer times come from admin sessions only. */
export function isScheduledAdminSessionService(
  service: Pick<
    SchedulingService,
    'bookingMode' | 'bookingOfferingKind' | 'isPackageService'
  >,
): boolean {
  if (isPassOffering(service) || isPackageServiceOffering(service)) {
    return false
  }
  return service.bookingMode === 'SCHEDULED'
}

/** Calendar may only enable days that have admin scheduling sessions. */
export function eventAvailabilityRequiresAdminSessions(
  service: Pick<
    SchedulingService,
    'bookingMode' | 'bookingOfferingKind' | 'isPackageService' | 'categoryId'
  >,
  scheduleMode: EventBookingScheduleMode,
): boolean {
  if (isScheduledAdminSessionService(service)) {
    return true
  }
  if (isGymSchedulingClassService(service) || isLearnSchedulingClassService(service)) {
    return true
  }
  if (isSpecialPlayEventCatalogService(service) || isCampPlayCatalogService(service)) {
    return true
  }
  if (scheduleMode === EventBookingScheduleModeEnum.PER_EVENT) {
    return true
  }
  if (scheduleMode === EventBookingScheduleModeEnum.PER_DAY) {
    return true
  }
  return false
}

/** Mock open-booking windows must not replace admin session calendars. */
export function shouldUseMockOpenAvailabilityForEventSchedule(
  service: Pick<SchedulingService, 'bookingMode' | 'bookingOfferingKind' | 'isPackageService'>,
  scheduleMode: EventBookingScheduleMode,
  slots: readonly SchedulingSlot[],
): boolean {
  if (isScheduledAdminSessionService(service)) {
    return false
  }
  if (scheduleMode !== EventBookingScheduleModeEnum.PER_HOUR) {
    return false
  }
  if (serviceHasUpcomingScheduledSessions(slots, service)) {
    return false
  }
  return service.bookingMode === 'OPEN'
}

/** True when date (and time if required) are chosen and detail fields may be shown. */
export function isEventBookingScheduleReadyForBookingForm(
  mode: EventBookingScheduleMode,
  selection: EventBookingScheduleSelection,
): boolean {
  const date = selection.selectedDate.trim()
  if (!date) {
    return false
  }

  if (mode === EventBookingScheduleModeEnum.PER_HOUR) {
    return selection.selectedWindow != null
  }

  if (mode === EventBookingScheduleModeEnum.PER_DAY) {
    if (selection.showDayRangePicker) {
      const to = selection.selectedToDate?.trim() ?? ''
      return to.length > 0
    }
    return selection.selectedWindow != null
  }

  // Fixed per-event sessions: day click assigns the session window automatically.
  return selection.selectedWindow != null
}

export function getEventBookingDetailsPrompt(
  mode: EventBookingScheduleMode,
  options?: { readonly showDayRangePicker?: boolean },
): string {
  if (mode === EventBookingScheduleModeEnum.PER_DAY && options?.showDayRangePicker) {
    return 'Select start and end dates above to enter booking details.'
  }
  if (eventBookingScheduleRequiresTimeSelection(mode)) {
    return 'Select a date and time above to enter booking details.'
  }
  return 'Select a date above to enter booking details.'
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

export function serviceHasUpcomingScheduledSessions(
  slots: readonly SchedulingSlot[],
  service: Pick<SchedulingService, 'id' | 'categoryId'>,
): boolean {
  return getDistinctSessionDatesForService(slots, service).length > 0
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

  if (isScheduledAdminSessionService(service)) {
    return null
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

/** First upcoming bookable slot on a calendar day (for fixed per-event sessions). */
export function findFirstBookableSlotOnEventDate(
  slots: readonly SchedulingSlot[],
  service: Pick<SchedulingService, 'id' | 'capacity'>,
  dateStr: string,
): SchedulingSlot | null {
  const now = Date.now()
  const matching = slots
    .filter(
      (slot) =>
        isBookableSlot(slot, service.id, now) && sessionDateFromSlot(slot) === dateStr,
    )
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  return matching[0] ?? null
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
  const expandByIncrement = shouldSplitSessionBySlotIncrement(service)
  const fromSlots = windowsFromSchedulingSlots(slots, service, dateStr, {
    durationMinutes: expandByIncrement ? durationMinutes : undefined,
    exactSessionOnly: !expandByIncrement,
  })
  if (fromSlots.length > 0) {
    return fromSlots
  }
  return []
}

function spotsRemainingForServiceSlot(
  slot: SchedulingSlot,
  service: Pick<SchedulingService, 'capacity'>,
): number {
  const capacity = slot.effectiveCapacity ?? service.capacity
  const booked = slot.bookedCount ?? 0
  return Math.max(0, capacity - booked)
}

/** PER_DAY booking window from admin session start/end on the chosen day(s). */
export function resolvePerDayBookingWindow(
  slots: readonly SchedulingSlot[],
  service: SchedulingService,
  fromDate: string,
  toDate: string,
): AvailableWindow | null {
  const { start, end } = normalizeYmdRange(fromDate, toDate)
  const startSlot = findFirstBookableSlotOnEventDate(slots, service, start)
  const endSlot = findFirstBookableSlotOnEventDate(slots, service, end)

  if (startSlot && endSlot) {
    return {
      startAt: startSlot.startAt,
      endAt: endSlot.endAt,
      spotsRemaining: Math.min(
        spotsRemainingForServiceSlot(startSlot, service),
        spotsRemainingForServiceSlot(endSlot, service),
      ),
    }
  }

  if (startSlot && start === end) {
    return {
      startAt: startSlot.startAt,
      endAt: startSlot.endAt,
      spotsRemaining: spotsRemainingForServiceSlot(startSlot, service),
    }
  }

  return null
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

/** Unique session start–end times for per-event display (optionally filtered to one day). */
export function resolveDistinctEventPerEventSessionTimes(
  service: SchedulingService,
  slots: readonly SchedulingSlot[],
  dateStr?: string,
): readonly EventPerEventSessionTimeBlock[] {
  const now = Date.now()
  const seen = new Set<string>()
  const blocks: EventPerEventSessionTimeBlock[] = []

  const bookableSlots = slots
    .filter((slot) => {
      if (!isBookableSlot(slot, service.id, now)) {
        return false
      }
      if (dateStr != null && dateStr.length > 0 && sessionDateFromSlot(slot) !== dateStr) {
        return false
      }
      return true
    })
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
  const { start, end } = normalizeYmdRange(fromDate, toDate)
  const startAt = `${start}T09:00:00`
  const endAt = `${end}T17:00:00`
  return {
    startAt,
    endAt,
    spotsRemaining: capacity,
  }
}
