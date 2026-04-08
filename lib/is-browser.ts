/** Runtime helper to detect browser context safely. */
export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}
