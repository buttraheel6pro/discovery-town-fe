/** Auth-related env flags and dev bypass helpers (client-safe `NEXT_PUBLIC_*` only). */
import type { CurrentUserProfile } from '@/lib/types'

const BYPASS_LOGIN_RAW = process.env.NEXT_PUBLIC_BYPASS_LOGIN ?? ''

/** When true, skip login UI and use a mock account profile for local development. */
export function isLoginBypassEnabled(): boolean {
  return BYPASS_LOGIN_RAW === 'true' || BYPASS_LOGIN_RAW === '1'
}

const MOCK_PROFILE_TIMESTAMP = '2024-01-15T10:00:00Z'

/** Mock profile shown on `/account` when login bypass is enabled. */
export function getBypassLoginMockProfile(): CurrentUserProfile {
  return {
    id: 1,
    tenantId: 'tenant-1',
    name: 'Dev User (bypass)',
    email: 'dev@discoverytown.local',
    isActive: true,
    storagePreference: 'local',
    languagePreference: 'en',
    loginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: MOCK_PROFILE_TIMESTAMP,
    createdAt: MOCK_PROFILE_TIMESTAMP,
    updatedAt: MOCK_PROFILE_TIMESTAMP,
    deletedAt: null,
    userSettings: {
      id: 1,
      isTwoFactorAuth: false,
      userId: 1,
      createdAt: MOCK_PROFILE_TIMESTAMP,
      updatedAt: MOCK_PROFILE_TIMESTAMP,
      deletedAt: null,
    },
    permissions: [],
    userRolePermission: [],
  }
}
