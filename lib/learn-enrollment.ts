/** Learn full-term enrollment — program bounds, session list, and booking window. */
import { isLearnSchedulingService } from '@/lib/learn-catalog'
import { ymdFromInstant } from '@/lib/ymd-date'
import { windowsFromSchedulingSlots } from '@/lib/scheduling-slot-availability'
import { formatSlotDate, formatSlotTimeRange } from '@/lib/utils'
import type { AvailableWindow, SchedulingService, SchedulingSlot } from '@/lib/types'

export interface LearnProgramBounds {
  readonly startYmd: string
  readonly endYmd: string
}

export interface LearnProgramSessionRow {
  readonly dateYmd: string
  readonly dateLabel: string
  readonly timeLabel: string
  readonly startAt: string
  readonly endAt: string
}

function isBookableLearnSlot(
  slot: SchedulingSlot,
  serviceId: string,
  now: number,
): boolean {
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

/** Learn programs enroll for the full term — customers cannot pick individual session dates. */
export function usesLearnFullProgramEnrollment(
  service: Pick<SchedulingService, 'categoryId' | 'serviceType'>,
): boolean {
  return isLearnSchedulingService(service)
}

export function resolveLearnProgramBookableSlots(
  service: SchedulingService,
  slots: readonly SchedulingSlot[],
): SchedulingSlot[] {
  const now = Date.now()
  return slots
    .filter((slot) => isBookableLearnSlot(slot, service.id, now))
    .sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime())
}

export function resolveLearnProgramBounds(
  service: Pick<SchedulingService, 'programStartDate' | 'programEndDate' | 'id'>,
  slots: readonly SchedulingSlot[],
): LearnProgramBounds | null {
  const bookable = resolveLearnProgramBookableSlots(
    service as SchedulingService,
    slots,
  )
  if (bookable.length === 0) {
    return null
  }

  const slotStartYmd = ymdFromInstant(bookable[0].startAt)
  const slotEndYmd = ymdFromInstant(bookable[bookable.length - 1].endAt)
  const configuredStart = service.programStartDate?.trim() || slotStartYmd
  const configuredEnd = service.programEndDate?.trim() || slotEndYmd

  const hasSessionOnConfiguredStart = bookable.some(
    (slot) => ymdFromInstant(slot.startAt) === configuredStart,
  )
  const firstSessionOnOrAfterStart = bookable.find(
    (slot) => ymdFromInstant(slot.startAt) >= configuredStart,
  )
  const startYmd = hasSessionOnConfiguredStart
    ? configuredStart
    : firstSessionOnOrAfterStart
      ? ymdFromInstant(firstSessionOnOrAfterStart.startAt)
      : slotStartYmd

  const endYmd = configuredEnd >= startYmd ? configuredEnd : slotEndYmd

  return startYmd <= endYmd
    ? { startYmd, endYmd }
    : { startYmd: slotStartYmd, endYmd: slotEndYmd }
}

/** Align stored program dates with the first and last bookable session in range. */
export function resolveLearnProgramDatesFromSlots(
  service: SchedulingService,
  slots: readonly SchedulingSlot[],
): { readonly programStartDate: string; readonly programEndDate: string } | null {
  const bookable = resolveLearnProgramBookableSlots(service, slots)
  if (bookable.length === 0) {
    return null
  }

  const configuredStart = service.programStartDate?.trim()
  const configuredEnd = service.programEndDate?.trim()
  const sessionsInConfiguredRange = bookable.filter((slot) => {
    const dateYmd = ymdFromInstant(slot.startAt)
    if (configuredStart && dateYmd < configuredStart) {
      return false
    }
    if (configuredEnd && dateYmd > configuredEnd) {
      return false
    }
    return true
  })
  const effectiveSessions = sessionsInConfiguredRange.length > 0
    ? sessionsInConfiguredRange
    : bookable

  return {
    programStartDate: ymdFromInstant(effectiveSessions[0].startAt),
    programEndDate: ymdFromInstant(effectiveSessions[effectiveSessions.length - 1].endAt),
  }
}

export function resolveLearnProgramSessionsInBounds(
  service: SchedulingService,
  slots: readonly SchedulingSlot[],
): readonly LearnProgramSessionRow[] {
  const bounds = resolveLearnProgramBounds(service, slots)
  if (!bounds) {
    return []
  }

  return resolveLearnProgramBookableSlots(service, slots)
    .filter((slot) => {
      const dateYmd = ymdFromInstant(slot.startAt)
      return dateYmd >= bounds.startYmd && dateYmd <= bounds.endYmd
    })
    .map((slot) => ({
      dateYmd: ymdFromInstant(slot.startAt),
      dateLabel: formatSlotDate(slot.startAt),
      timeLabel: formatSlotTimeRange(slot.startAt, slot.endAt),
      startAt: slot.startAt,
      endAt: slot.endAt,
    }))
}

export function buildLearnProgramEnrollmentWindow(
  service: SchedulingService,
  slots: readonly SchedulingSlot[],
): AvailableWindow | null {
  const sessions = resolveLearnProgramSessionsInBounds(service, slots)
  if (sessions.length === 0) {
    return null
  }

  const bookable = resolveLearnProgramBookableSlots(service, slots).filter((slot) =>
    sessions.some((session) => session.startAt === slot.startAt),
  )
  if (bookable.length === 0) {
    return null
  }

  const spotsRemaining = bookable.reduce((minimum, slot) => {
    const remaining = Math.max(0, slot.effectiveCapacity - slot.bookedCount)
    return Math.min(minimum, remaining)
  }, bookable[0].effectiveCapacity)

  return {
    startAt: sessions[0].startAt,
    endAt: sessions[sessions.length - 1].endAt,
    spotsRemaining,
  }
}

export function resolveLearnProgramStartDayWindows(
  service: SchedulingService,
  slots: readonly SchedulingSlot[],
): AvailableWindow[] {
  const bounds = resolveLearnProgramBounds(service, slots)
  if (!bounds) {
    return []
  }
  return windowsFromSchedulingSlots(slots, service, bounds.startYmd, {
    exactSessionOnly: true,
  })
}

export function isLearnProgramEnrollmentReady(
  service: SchedulingService,
  slots: readonly SchedulingSlot[],
  selectedWindow: AvailableWindow | null,
): boolean {
  if (!usesLearnFullProgramEnrollment(service)) {
    return false
  }
  if (selectedWindow == null) {
    return false
  }
  return resolveLearnProgramSessionsInBounds(service, slots).length > 0
}

export function formatLearnProgramPeriodLabel(bounds: LearnProgramBounds): string {
  const start = new Date(`${bounds.startYmd}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const end = new Date(`${bounds.endYmd}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return `${start} – ${end}`
}

const LEARN_WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

const LEARN_WEEKDAY_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const

function learnWeekdaySortKey(dayIndex: number): number {
  const orderIndex = LEARN_WEEKDAY_DISPLAY_ORDER.indexOf(
    dayIndex as (typeof LEARN_WEEKDAY_DISPLAY_ORDER)[number],
  )
  return orderIndex === -1 ? 99 : orderIndex
}

function resolveLearnProgramScheduleDaysFromSlots(
  service: SchedulingService,
  slots: readonly SchedulingSlot[],
): string | null {
  const bounds = resolveLearnProgramBounds(service, slots)
  if (!bounds) {
    return null
  }

  const patternByKey = new Map<string, { dayIndex: number; timeLabel: string }>()
  for (const slot of resolveLearnProgramBookableSlots(service, slots)) {
    const dateYmd = ymdFromInstant(slot.startAt)
    if (dateYmd < bounds.startYmd || dateYmd > bounds.endYmd) {
      continue
    }

    const dayIndex = new Date(slot.startAt).getDay()
    const timeLabel = formatSlotTimeRange(slot.startAt, slot.endAt)
    patternByKey.set(`${dayIndex}|${timeLabel}`, { dayIndex, timeLabel })
  }

  if (patternByKey.size === 0) {
    return null
  }

  const patterns = [...patternByKey.values()].sort(
    (left, right) => learnWeekdaySortKey(left.dayIndex) - learnWeekdaySortKey(right.dayIndex),
  )
  const uniqueTimeLabels = [...new Set(patterns.map((entry) => entry.timeLabel))]

  if (uniqueTimeLabels.length === 1) {
    const daysLabel = patterns.map((entry) => LEARN_WEEKDAY_LABELS[entry.dayIndex]).join(' & ')
    return `${daysLabel} · ${uniqueTimeLabels[0]}`
  }

  return patterns
    .map((entry) => `${LEARN_WEEKDAY_LABELS[entry.dayIndex]} ${entry.timeLabel}`)
    .join(' · ')
}

/** Compact schedule line for enrollment summary — e.g. "Tuesday & Thursday · 4:00 PM – 5:00 PM". */
export function formatLearnProgramScheduleDaysLabel(
  service: Pick<SchedulingService, 'schedule'>,
): string | null {
  const schedule = service.schedule?.filter(
    (entry) => entry.dayOfWeek.trim().length > 0,
  )
  if (!schedule?.length) {
    return null
  }

  const daysLabel = schedule.map((entry) => entry.dayOfWeek).join(' & ')
  const timeLabels = [
    ...new Set(schedule.map((entry) => `${entry.startTime} – ${entry.endTime}`)),
  ]

  if (timeLabels.length === 1) {
    return `${daysLabel} · ${timeLabels[0]}`
  }

  return schedule
    .map((entry) => `${entry.dayOfWeek} ${entry.startTime} – ${entry.endTime}`)
    .join(' · ')
}

/** Schedule days from service.schedule, or inferred from admin-created session slots. */
export function resolveLearnProgramScheduleDaysLabel(
  service: SchedulingService,
  slots: readonly SchedulingSlot[],
): string | null {
  const fromSchedule = formatLearnProgramScheduleDaysLabel(service)
  if (fromSchedule) {
    return fromSchedule
  }
  return resolveLearnProgramScheduleDaysFromSlots(service, slots)
}
