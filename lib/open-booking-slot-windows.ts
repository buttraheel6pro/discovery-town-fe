/** Expand admin sessions into customer bookable availability windows. */
import type { AvailableWindow, SchedulingService, SchedulingSlot } from '@/lib/types'

export const OPEN_BOOKING_SLOT_INCREMENT_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: '60', label: 'Hourly' },
  { value: '30', label: 'Half hour' },
] as const

export function slotIncrementMinutesFromAdminValue(value: string): number | null {
  if (value === '' || value === 'none') {
    return null
  }
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }
  return parsed
}

export function adminValueFromSlotIncrementMinutes(
  minutes: number | null | undefined,
): string {
  if (minutes == null || minutes <= 0) {
    return 'none'
  }
  return String(minutes)
}

export function resolveSlotIncrementMinutes(
  service: Pick<SchedulingService, 'slotIncrementMinutes'>,
): number | null {
  const raw = service.slotIncrementMinutes
  if (raw == null || raw <= 0) {
    return null
  }
  return raw
}

export function resolveOpenBookingDurationMinutes(
  service: SchedulingService,
  selectedDurationMinutes?: number,
): number {
  if (selectedDurationMinutes != null && selectedDurationMinutes > 0) {
    return selectedDurationMinutes
  }
  if (service.minDurationMinutes != null && service.minDurationMinutes > 0) {
    return service.minDurationMinutes
  }
  if (service.durationMinutes > 0) {
    return service.durationMinutes
  }
  return 60
}

function spotsRemainingForSlot(slot: SchedulingSlot): number {
  if (slot.status === 'FULL') {
    return 0
  }
  return Math.max(0, slot.effectiveCapacity - slot.bookedCount)
}

function expandTimeRangeToWindows(
  sessionStartMs: number,
  sessionEndMs: number,
  service: SchedulingService,
  spotsRemaining: number,
  options?: {
    readonly durationMinutes?: number
    readonly now?: number
  },
): AvailableWindow[] {
  const nowMs = options?.now ?? Date.now()
  const durationMinutes = resolveOpenBookingDurationMinutes(
    service,
    options?.durationMinutes,
  )
  const incrementMinutes = resolveSlotIncrementMinutes(service)

  if (incrementMinutes == null) {
    if (spotsRemaining <= 0 || sessionStartMs >= sessionEndMs) {
      return []
    }
    if (sessionStartMs <= nowMs) {
      return []
    }
    return [
      {
        startAt: new Date(sessionStartMs).toISOString(),
        endAt: new Date(sessionEndMs).toISOString(),
        spotsRemaining,
      },
    ]
  }

  const durationMs = durationMinutes * 60_000
  const stepMs = incrementMinutes * 60_000
  const windows: AvailableWindow[] = []

  for (
    let startMs = sessionStartMs;
    startMs + durationMs <= sessionEndMs;
    startMs += stepMs
  ) {
    if (startMs <= nowMs) {
      continue
    }
    windows.push({
      startAt: new Date(startMs).toISOString(),
      endAt: new Date(startMs + durationMs).toISOString(),
      spotsRemaining,
    })
  }

  return windows
}

export function expandSchedulingSlotToWindows(
  slot: SchedulingSlot,
  service: SchedulingService,
  options?: {
    readonly durationMinutes?: number
    readonly now?: number
  },
): AvailableWindow[] {
  const sessionStartMs = new Date(slot.startAt).getTime()
  const sessionEndMs = new Date(slot.endAt).getTime()
  return expandTimeRangeToWindows(
    sessionStartMs,
    sessionEndMs,
    service,
    spotsRemainingForSlot(slot),
    options,
  )
}

export function expandOperatingHoursToWindows(
  service: SchedulingService,
  dateStr: string,
  openMinutes: number,
  closeMinutes: number,
  options?: {
    readonly durationMinutes?: number
    readonly now?: number
    readonly spotsRemaining?: number
  },
): AvailableWindow[] {
  const [year, month, day] = dateStr.split('-').map(Number)
  const base = new Date(year, month - 1, day)
  const sessionStart = new Date(base)
  sessionStart.setHours(Math.floor(openMinutes / 60), openMinutes % 60, 0, 0)
  const sessionEnd = new Date(base)
  sessionEnd.setHours(Math.floor(closeMinutes / 60), closeMinutes % 60, 0, 0)

  return expandTimeRangeToWindows(
    sessionStart.getTime(),
    sessionEnd.getTime(),
    service,
    options?.spotsRemaining ?? service.maxConcurrent ?? 1,
    options,
  )
}

export function findSchedulingSlotContainingWindow(
  slots: readonly SchedulingSlot[],
  serviceId: string,
  window: Pick<AvailableWindow, 'startAt' | 'endAt'>,
): SchedulingSlot | undefined {
  const startMs = new Date(window.startAt).getTime()
  const endMs = new Date(window.endAt).getTime()
  return slots.find((slot) => {
    if (slot.serviceId !== serviceId) {
      return false
    }
    const sessionStartMs = new Date(slot.startAt).getTime()
    const sessionEndMs = new Date(slot.endAt).getTime()
    return startMs >= sessionStartMs && endMs <= sessionEndMs
  })
}
