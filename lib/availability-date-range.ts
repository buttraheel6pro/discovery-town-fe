/** Helpers for availability calendar range selection visuals. */

export type DateRangeVisualRole = 'endpoint' | 'middle' | 'none'

export function getDateRangeVisualRole(
  dateStr: string,
  from: string,
  to: string,
): DateRangeVisualRole {
  if (!from) {
    return 'none'
  }
  if (!to) {
    return dateStr === from ? 'endpoint' : 'none'
  }
  if (from === to) {
    return dateStr === from ? 'endpoint' : 'none'
  }
  if (dateStr === from || dateStr === to) {
    return 'endpoint'
  }
  if (dateStr > from && dateStr < to) {
    return 'middle'
  }
  return 'none'
}
