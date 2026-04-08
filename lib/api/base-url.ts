/** API v1 base URL sourced from NEXT_PUBLIC_API_URL only. */
export function getApiV1BaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim()
  const raw = fromEnv && fromEnv.length > 0 ? fromEnv : ''
  return raw.replace(/\/$/, '')
}
