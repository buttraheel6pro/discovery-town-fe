/** Auth API service for login and logout operations. */
import { apiClient, setAuthFailureHandler } from '@/lib/api/client'
import { clearAuthSession, setAuthSession } from '@/lib/api/token-storage'
import { API_PATHS } from '@/lib/constants/api'
import {
  loginRequestSchema,
  loginResponseSchema,
  type LoginRequest,
  type LoginResponse,
} from '@/lib/schemas/auth/login'

const LOGIN_PATH = API_PATHS.login

let authFailureInitialized = false

function initializeAuthFailureHandler(): void {
  if (authFailureInitialized) {
    return
  }

  setAuthFailureHandler(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.location.replace('/login')
  })

  authFailureInitialized = true
}

export async function loginUser(payload: LoginRequest): Promise<LoginResponse> {
  initializeAuthFailureHandler()
  const parsedPayload = loginRequestSchema.parse(payload)
  const response = await apiClient.post(LOGIN_PATH, parsedPayload, {
    skipAuth: true,
    skipRefresh: true,
  })
  const parsedResponse = loginResponseSchema.parse(response.data)
  setAuthSession(parsedResponse)
  return parsedResponse
}

export function logoutUser(): void {
  clearAuthSession()
  if (typeof window !== 'undefined') {
    window.location.replace('/login')
  }
}
