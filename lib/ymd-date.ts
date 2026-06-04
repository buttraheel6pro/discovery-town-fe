/** Local calendar YYYY-MM-DD helpers (avoids UTC drift from Date.toISOString). */

export function formatLocalYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getLocalTodayYmd(): string {
  return formatLocalYmd(new Date())
}

/** Week offset (0 = current week) for the week strip that contains `targetYmd`. */
export function getWeekOffsetForYmd(targetYmd: string, anchorToday: Date = new Date()): number {
  const today = new Date(anchorToday)
  today.setHours(12, 0, 0, 0)
  const target = new Date(`${targetYmd}T12:00:00`)
  const diffDays = Math.floor((target.getTime() - today.getTime()) / 86400000)
  return Math.floor(diffDays / 7)
}

export function ymdFromInstant(iso: string): string {
  return formatLocalYmd(new Date(iso))
}
