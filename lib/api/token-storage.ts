/** Browser localStorage for access and refresh tokens only. */
import type { LoginResponse } from "@/lib/schemas/auth/login";
import { isBrowser } from "@/lib/is-browser";

const ACCESS_TOKEN_KEY = "dt_access_token";
const REFRESH_TOKEN_KEY = "dt_refresh_token";

/** Legacy keys — removed on clear so old sessions do not leave stray data. */
const LEGACY_USER_EMAIL_KEY = "dt_user_email";
const LEGACY_USER_ID_KEY = "dt_user_id";

export function getAccessToken(): string | null {
  if (!isBrowser()) {
    return null;
  }
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) {
    return null;
  }
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthSession(payload: LoginResponse): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, payload.access_token);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, payload.refresh_token);
}

export function updateAccessToken(accessToken: string): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function clearAuthSession(): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(LEGACY_USER_EMAIL_KEY);
  window.localStorage.removeItem(LEGACY_USER_ID_KEY);
}
