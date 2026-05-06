/** Rental mock slot generators + long-form date labels for summaries. */

import type { AvailableWindow } from '@/lib/types'

function parseLocalYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map((part) => Number.parseInt(part, 10))
  return new Date(y, m - 1, d, 12, 0, 0, 0)
}

/** Inclusive calendar-day count between two `YYYY-MM-DD` strings (UTC date arithmetic). */
export function getInclusiveYmdDayCount(fromYmd: string, toYmd: string): number {
  const from = new Date(`${fromYmd}T00:00:00`)
  const to = new Date(`${toYmd}T00:00:00`)
  const fromDay = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
  const toDay = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate())
  return Math.floor((toDay - fromDay) / 86400000) + 1
}

export function formatRentalLongDate(dateStr: string): string {
  return parseLocalYmd(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export interface RentalHourlyWindowOptions {
  readonly nowInput?: Date
  readonly slotIncrementMinutes?: number | null
}

function buildHourlyWindows(
  base: Date,
  now: Date,
  openMin: number,
  closeMin: number,
  minDuration: number,
  increment: number,
): AvailableWindow[] {
  const maxConcurrent = 2
  const windows: AvailableWindow[] = []
  for (let m = openMin; m + minDuration <= closeMin; m += increment) {
    const startDate = new Date(base)
    startDate.setHours(Math.floor(m / 60), m % 60, 0, 0)
    const endDate = new Date(startDate.getTime() + minDuration * 60_000)
    if (startDate <= now) continue
    const isLimited = m === 9 * 60 || m === 16 * 60
    windows.push({
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString(),
      spotsRemaining: isLimited ? 1 : maxConcurrent,
    })
  }
  return windows
}

/** Mock hourly windows with configurable slot increment. */
export function generateMockRentalHourlyWindows(
  dateStr: string,
  options: RentalHourlyWindowOptions = {},
): AvailableWindow[] {
  const [year, month, day] = dateStr.split('-').map((part) => Number.parseInt(part, 10))
  const base = new Date(year, month - 1, day)
  const now = options.nowInput ?? new Date()

  const openMin = 9 * 60
  const closeMin = 19 * 60 + 30
  const slotIncrementMinutes =
    options.slotIncrementMinutes === 30 || options.slotIncrementMinutes === 60
      ? options.slotIncrementMinutes
      : 60
  const increment = slotIncrementMinutes
  const minDuration = slotIncrementMinutes
  return buildHourlyWindows(base, now, openMin, closeMin, minDuration, increment)
}

export interface RentalHalfDayWindow {
  readonly id: 'MORNING' | 'AFTERNOON'
  readonly label: string
  readonly startAt: string
  readonly endAt: string
  readonly spotsRemaining: number
}

export function generateMockRentalHalfDayWindows(
  dateStr: string,
  nowInput: Date = new Date(),
): RentalHalfDayWindow[] {
  const [year, month, day] = dateStr.split('-').map((part) => Number.parseInt(part, 10))
  const base = new Date(year, month - 1, day)
  const now = nowInput

  const morningStart = new Date(base)
  morningStart.setHours(8, 0, 0, 0)
  const morningEnd = new Date(base)
  morningEnd.setHours(12, 0, 0, 0)

  const afternoonStart = new Date(base)
  afternoonStart.setHours(12, 0, 0, 0)
  const afternoonEnd = new Date(base)
  afternoonEnd.setHours(17, 0, 0, 0)

  return [
    {
      id: 'MORNING',
      label: 'Morning (8:00 AM – 12:00 PM)',
      startAt: morningStart.toISOString(),
      endAt: morningEnd.toISOString(),
      spotsRemaining: morningEnd <= now ? 0 : 1,
    },
    {
      id: 'AFTERNOON',
      label: 'Afternoon (12:00 PM – 5:00 PM)',
      startAt: afternoonStart.toISOString(),
      endAt: afternoonEnd.toISOString(),
      spotsRemaining: afternoonEnd <= now ? 0 : 1,
    },
  ]
}
