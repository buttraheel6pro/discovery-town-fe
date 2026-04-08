/** Centralized API constants for endpoints and default headers. */
export const API_PATHS = {
  login: '/auth/login',
  refresh: '/auth/refresh',
} as const

export const API_HEADERS = {
  accept: 'application/json',
  ngrokBypass: '69420',
} as const

export const LANGUAGE_STORAGE_KEY = 'language'
