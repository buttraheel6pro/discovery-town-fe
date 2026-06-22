/** Axios API clients with token refresh and retry interceptor. */
import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'

import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAuthSession,
} from '@/lib/api/token-storage'
import { getApiV1BaseUrl } from '@/lib/api/base-url'
import { isApiEnabled } from '@/lib/config/data-source'
import { API_HEADERS, API_PATHS, LANGUAGE_STORAGE_KEY } from '@/lib/constants/api'
import { isBrowser } from '@/lib/is-browser'
import { loginResponseSchema } from '@/lib/schemas/auth/login'

const API_BASE_URL = getApiV1BaseUrl()

const LOGIN_PATH = API_PATHS.login
const REFRESH_PATH = API_PATHS.refresh

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
  skipAuth?: boolean
  skipRefresh?: boolean
}

type PendingRequest = {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}

let isRefreshing = false
let pendingRequests: PendingRequest[] = []

let authFailureHandler: (() => void) | null = null

function resolvePendingRequests(token: string): void {
  pendingRequests.forEach(({ resolve }) => resolve(token))
  pendingRequests = []
}

function rejectPendingRequests(error: unknown): void {
  pendingRequests.forEach(({ reject }) => reject(error))
  pendingRequests = []
}

function getLanguageHeader(): string {
  if (!isBrowser()) {
    return 'en'
  }
  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? 'en'
}

function shouldTryRefresh(error: AxiosError): boolean {
  const status = error.response?.status
  const config = error.config as RetryableRequestConfig | undefined
  const url = config?.url ?? ''
  const isAuthCall = url.includes(LOGIN_PATH) || url.includes(REFRESH_PATH)
  const skipRefresh = Boolean(config?.skipRefresh)

  return status === 401 && !isAuthCall && !skipRefresh
}

async function requestNewAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error('Refresh token not found')
  }

  // Backend expects refresh JWT in Authorization (Swagger: Bearer + empty body).
  const response = await apiClient.post(REFRESH_PATH, undefined, {
    skipAuth: true,
    skipRefresh: true,
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
  } as RetryableRequestConfig)

  const parsed = loginResponseSchema.safeParse(response.data)
  if (!parsed.success) {
    throw new Error('Invalid refresh response')
  }

  setAuthSession(parsed.data)
  return parsed.data.access_token
}

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? ''

function applyRequestInterceptors(): void {
  apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const nextConfig = config as RetryableRequestConfig
      nextConfig.headers.Accept = API_HEADERS.accept
      nextConfig.headers['Accept-Language'] = getLanguageHeader()

      // Send tenant identifier so public (OptionalJwtGuard) endpoints can resolve the tenant
      if (TENANT_ID) {
        nextConfig.headers['x-tenant-id'] = TENANT_ID
      }

      if (!nextConfig.skipAuth) {
        const accessToken = getAccessToken()
        if (accessToken) {
          nextConfig.headers.Authorization = `Bearer ${accessToken}`
        }
      }

      return nextConfig
    },
    async (error: unknown) => Promise.reject(error),
  )
}

export { isApiEnabled, isApiConfigured, isMockDataEnabled } from '@/lib/config/data-source'

/**
 * True when API is configured AND an admin JWT is stored in localStorage.
 * Use this for admin mutation calls — isApiEnabled alone is insufficient when
 * NEXT_PUBLIC_BYPASS_ADMIN_AUTH allows page access without logging in.
 */
export function isAdminApiReady(): boolean {
  return isApiEnabled && Boolean(getAccessToken())
}

/** Shared paginated API response shape. */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

function applyResponseInterceptors(): void {
  apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (!shouldTryRefresh(error)) {
        return Promise.reject(error)
      }

      const originalRequest = error.config as RetryableRequestConfig | undefined
      if (!originalRequest) {
        return Promise.reject(error)
      }

      if (originalRequest._retry) {
        clearAuthSession()
        authFailureHandler?.()
        return Promise.reject(error)
      }

      originalRequest._retry = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push({
            resolve: (newToken) => {
              originalRequest.headers = originalRequest.headers ?? {}
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              resolve(apiClient(originalRequest as AxiosRequestConfig))
            },
            reject,
          })
        })
      }

      isRefreshing = true

      try {
        const newAccessToken = await requestNewAccessToken()
        resolvePendingRequests(newAccessToken)
        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(originalRequest as AxiosRequestConfig)
      } catch (refreshError) {
        rejectPendingRequests(refreshError)
        clearAuthSession()
        authFailureHandler?.()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    },
  )
}

export function setAuthFailureHandler(handler: () => void): void {
  authFailureHandler = handler
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'ngrok-skip-browser-warning': API_HEADERS.ngrokBypass,
  },
})

applyRequestInterceptors()
applyResponseInterceptors()
