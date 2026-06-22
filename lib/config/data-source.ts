/** Env-driven mock vs API data source for consumer catalog and shared fetches. */
import { getApiV1BaseUrl } from '@/lib/api/base-url'

/** When true, use mock-data only and skip API catalog calls. */
export function isMockDataEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_ENABLE_MOCKS ?? ''
  return raw === 'true' || raw === '1'
}

/** True when API URL and tenant ID are both configured (ignores mock flag). */
export function isApiConfigured(): boolean {
  return Boolean(getApiV1BaseUrl() && process.env.NEXT_PUBLIC_TENANT_ID)
}

/**
 * API mode: mocks disabled and URL + tenant present.
 * Evaluated once at module load — restart dev server after changing env.
 */
export const isApiEnabled = !isMockDataEnabled() && isApiConfigured()
