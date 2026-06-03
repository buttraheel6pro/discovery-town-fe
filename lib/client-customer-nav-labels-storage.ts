/** Persist customer navbar label and visibility overrides to localStorage. */
import { setLocalStorageJson } from '@/lib/browser-local-storage-json'
import {
  CUSTOMER_NAV_LABEL_KEYS,
  isCustomerNavLabelKey,
  type CustomerNavHiddenOverrides,
  type CustomerNavLabelOverrides,
  type CustomerNavSettingsPersisted,
} from '@/lib/customer-nav-labels'

export const CLIENT_CUSTOMER_NAV_LABELS_STORAGE_KEY =
  'discovery-town-customer-nav-labels'

function normalizeLabelOverrides(value: unknown): CustomerNavLabelOverrides {
  if (typeof value !== 'object' || value === null) {
    return {}
  }
  const row = value as Record<string, unknown>
  const overrides: CustomerNavLabelOverrides = {}
  for (const [key, label] of Object.entries(row)) {
    if (!isCustomerNavLabelKey(key) || typeof label !== 'string') {
      continue
    }
    const trimmed = label.trim()
    if (trimmed.length > 0) {
      overrides[key] = trimmed
    }
  }
  return overrides
}

function normalizeHiddenOverrides(value: unknown): CustomerNavHiddenOverrides {
  if (typeof value !== 'object' || value === null) {
    return {}
  }
  const row = value as Record<string, unknown>
  const overrides: CustomerNavHiddenOverrides = {}
  for (const [key, hidden] of Object.entries(row)) {
    if (!isCustomerNavLabelKey(key) || hidden !== true) {
      continue
    }
    overrides[key] = true
  }
  return overrides
}

function normalizePersistedSettings(value: unknown): CustomerNavSettingsPersisted {
  if (typeof value !== 'object' || value === null) {
    return { labels: {}, hidden: {} }
  }
  const row = value as Record<string, unknown>
  if ('labels' in row || 'hidden' in row) {
    return {
      labels: normalizeLabelOverrides(row.labels),
      hidden: normalizeHiddenOverrides(row.hidden),
    }
  }
  return {
    labels: normalizeLabelOverrides(value),
    hidden: {},
  }
}

export function readPersistedCustomerNavSettings(): CustomerNavSettingsPersisted | null {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.localStorage.getItem(CLIENT_CUSTOMER_NAV_LABELS_STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    return normalizePersistedSettings(parsed)
  } catch {
    return null
  }
}

export function persistCustomerNavSettings(settings: CustomerNavSettingsPersisted): boolean {
  const labels: CustomerNavLabelOverrides = {}
  for (const key of CUSTOMER_NAV_LABEL_KEYS) {
    const label = settings.labels?.[key]
    if (typeof label === 'string' && label.trim().length > 0) {
      labels[key] = label.trim()
    }
  }

  const hidden: CustomerNavHiddenOverrides = {}
  for (const key of CUSTOMER_NAV_LABEL_KEYS) {
    if (settings.hidden?.[key] === true) {
      hidden[key] = true
    }
  }

  const hasLabels = Object.keys(labels).length > 0
  const hasHidden = Object.keys(hidden).length > 0
  if (!hasLabels && !hasHidden) {
    return clearPersistedCustomerNavLabels()
  }

  const payload: CustomerNavSettingsPersisted = {}
  if (hasLabels) {
    payload.labels = labels
  }
  if (hasHidden) {
    payload.hidden = hidden
  }
  return setLocalStorageJson(CLIENT_CUSTOMER_NAV_LABELS_STORAGE_KEY, payload)
}

export function clearPersistedCustomerNavLabels(): boolean {
  if (typeof window === 'undefined') {
    return true
  }
  try {
    window.localStorage.removeItem(CLIENT_CUSTOMER_NAV_LABELS_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
