/** Client helpers for resolving CSS custom property values. */
export function getCssVarColor(variableName: string): string {
  if (typeof window === 'undefined') {
    return ''
  }

  return window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim()
}
