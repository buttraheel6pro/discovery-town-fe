/** Gym class availability — session times mirror service.schedule exactly. */
import { isGymSchedulingClassService } from '@/lib/event-booking-schedule'
import { windowsFromSchedulingSlots } from '@/lib/scheduling-slot-availability'
import type { AvailableWindow, SchedulingService, SchedulingSlot } from '@/lib/types'

const DAY_NAME_TO_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

function parseDisplayTimeToMinutes(time: string): number | null {
  const trimmed = time.trim()
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (match12) {
    let hours = Number.parseInt(match12[1], 10)
    const minutes = Number.parseInt(match12[2], 10)
    const period = match12[3].toUpperCase()
    if (period === 'PM' && hours !== 12) {
      hours += 12
    }
    if (period === 'AM' && hours === 12) {
      hours = 0
    }
    return hours * 60 + minutes
  }
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/)
  if (match24) {
    return Number.parseInt(match24[1], 10) * 60 + Number.parseInt(match24[2], 10)
  }
  return null
}

/** Expand schedule day labels (e.g. "Monday – Thursday") to weekday indices. */
export function parseGymScheduleDayLabel(dayOfWeek: string): readonly number[] {
  const normalized = dayOfWeek.replace(/\u2013/g, '-').replace(/&/g, ',').trim()
  const parts = normalized.split(',').map((part) => part.trim()).filter(Boolean)
  const days = new Set<number>()

  for (const part of parts) {
    const rangeMatch = part.match(/^(\w+)\s*-\s*(\w+)$/i)
    if (rangeMatch) {
      const start = DAY_NAME_TO_INDEX[rangeMatch[1].toLowerCase()]
      const end = DAY_NAME_TO_INDEX[rangeMatch[2].toLowerCase()]
      if (start != null && end != null) {
        if (start <= end) {
          for (let day = start; day <= end; day += 1) {
            days.add(day)
          }
        } else {
          for (let day = start; day <= 6; day += 1) {
            days.add(day)
          }
          for (let day = 0; day <= end; day += 1) {
            days.add(day)
          }
        }
      }
      continue
    }
    const single = DAY_NAME_TO_INDEX[part.toLowerCase()]
    if (single != null) {
      days.add(single)
    }
  }

  return [...days].sort((a, b) => a - b)
}

function toLocalIsoDate(year: number, month: number, day: number): string {
  const y = String(year)
  const m = String(month).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDaysToYmd(ymd: string, days: number): string {
  const [year, month, day] = ymd.split('-').map((part) => Number.parseInt(part, 10))
  const probe = new Date(year, month - 1, day + days, 12, 0, 0, 0)
  return toLocalIsoDate(probe.getFullYear(), probe.getMonth() + 1, probe.getDate())
}

function windowMatchesScheduleMinutes(
  window: Pick<AvailableWindow, 'startAt' | 'endAt'>,
  startMinutes: number,
  endMinutes: number,
): boolean {
  const start = new Date(window.startAt)
  const end = new Date(window.endAt)
  const windowStart = start.getHours() * 60 + start.getMinutes()
  const windowEnd = end.getHours() * 60 + end.getMinutes()
  return windowStart === startMinutes && windowEnd === endMinutes
}

function buildWindowFromScheduleEntry(
  dateStr: string,
  startMinutes: number,
  endMinutes: number,
  spotsRemaining: number,
): AvailableWindow {
  const [year, month, day] = dateStr.split('-').map((part) => Number.parseInt(part, 10))
  const startAt = new Date(
    year,
    month - 1,
    day,
    Math.floor(startMinutes / 60),
    startMinutes % 60,
    0,
    0,
  )
  const endAt = new Date(
    year,
    month - 1,
    day,
    Math.floor(endMinutes / 60),
    endMinutes % 60,
    0,
    0,
  )
  return {
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    spotsRemaining,
  }
}

/** Upcoming calendar days that have at least one schedule entry. */
export function getGymClassSessionDatesFromSchedule(
  service: Pick<SchedulingService, 'schedule'>,
  todayYmd: string,
  horizonDays = 28,
): string[] {
  const schedule = service.schedule ?? []
  if (schedule.length === 0) {
    return []
  }

  const dates: string[] = []
  for (let offset = 0; offset <= horizonDays; offset += 1) {
    const ymd = addDaysToYmd(todayYmd, offset)
    const dow = new Date(`${ymd}T12:00:00`).getDay()
    const hasSession = schedule.some((entry) =>
      parseGymScheduleDayLabel(entry.dayOfWeek).includes(dow),
    )
    if (hasSession) {
      dates.push(ymd)
    }
  }
  return dates
}

/** Hourly windows for gym classes — times always match service.schedule. */
export function resolveGymClassHourlyWindowsForEventDate(
  service: SchedulingService,
  slots: readonly SchedulingSlot[],
  dateStr: string,
): AvailableWindow[] {
  if (!isGymSchedulingClassService(service)) {
    return windowsFromSchedulingSlots(slots, service, dateStr)
  }

  const schedule = service.schedule ?? []
  if (schedule.length === 0) {
    return windowsFromSchedulingSlots(slots, service, dateStr)
  }

  const dow = new Date(`${dateStr}T12:00:00`).getDay()
  const nowMs = Date.now()
  const slotWindows = windowsFromSchedulingSlots(slots, service, dateStr, {
    includeUnavailable: true,
    now: nowMs,
  })
  const windows: AvailableWindow[] = []

  for (const entry of schedule) {
    if (!parseGymScheduleDayLabel(entry.dayOfWeek).includes(dow)) {
      continue
    }
    const startMinutes = parseDisplayTimeToMinutes(entry.startTime)
    const endMinutes = parseDisplayTimeToMinutes(entry.endTime)
    if (startMinutes == null || endMinutes == null || endMinutes <= startMinutes) {
      continue
    }

    const matchedSlotWindow = slotWindows.find((window) =>
      windowMatchesScheduleMinutes(window, startMinutes, endMinutes),
    )
    const spotsRemaining = matchedSlotWindow?.spotsRemaining ?? service.capacity
    if (spotsRemaining <= 0) {
      continue
    }

    const window = buildWindowFromScheduleEntry(
      dateStr,
      startMinutes,
      endMinutes,
      spotsRemaining,
    )
    if (new Date(window.startAt).getTime() <= nowMs) {
      continue
    }
    windows.push(window)
  }

  return windows.sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  )
}
