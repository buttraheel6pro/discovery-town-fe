/** Customer navbar settings — stable keys, display labels, and admin hide/show. */

export const CUSTOMER_NAV_LABEL_KEYS = [
  'play',
  'gym',
  'learn',
  'events',
  'shop',
  'gifts',
  'rentals',
  'cafeFood',
] as const

export type CustomerNavLabelKey = (typeof CUSTOMER_NAV_LABEL_KEYS)[number]

export type CustomerNavLabelOverrides = Partial<Record<CustomerNavLabelKey, string>>

/** `true` means the nav item is hidden from the customer navbar. */
export type CustomerNavHiddenOverrides = Partial<Record<CustomerNavLabelKey, boolean>>

export interface CustomerNavSettingsPersisted {
  labels?: CustomerNavLabelOverrides
  hidden?: CustomerNavHiddenOverrides
}

export const DEFAULT_CUSTOMER_NAV_LABELS: Record<CustomerNavLabelKey, string> = {
  play: 'Parties',
  gym: 'Gym',
  learn: 'Tutoring',
  events: 'Events',
  shop: 'Shop',
  gifts: 'Gifts',
  rentals: 'Rentals To-Go',
  cafeFood: 'Cafe & Food',
}

export const CUSTOMER_NAV_LABEL_ROUTES: Record<CustomerNavLabelKey, string> = {
  play: '/play',
  gym: '/gym',
  learn: '/learn',
  events: '/events',
  shop: '/shop',
  gifts: '/gifts',
  rentals: '/rentals',
  cafeFood: '/cafe',
}

export function isCustomerNavLabelKey(value: string): value is CustomerNavLabelKey {
  return (CUSTOMER_NAV_LABEL_KEYS as readonly string[]).includes(value)
}

export function productTypeToNavLabelKey(productType: string): CustomerNavLabelKey | null {
  switch (productType) {
    case 'shop':
      return 'shop'
    case 'gifts':
      return 'gifts'
    case 'rentals':
      return 'rentals'
    case 'cafe&food':
      return 'cafeFood'
    default:
      return null
  }
}

export function resolveCustomerNavLabels(
  overrides: CustomerNavLabelOverrides | null | undefined,
): Record<CustomerNavLabelKey, string> {
  const resolved = { ...DEFAULT_CUSTOMER_NAV_LABELS }
  if (!overrides) {
    return resolved
  }
  for (const key of CUSTOMER_NAV_LABEL_KEYS) {
    const raw = overrides[key]
    if (typeof raw !== 'string') {
      continue
    }
    const trimmed = raw.trim()
    if (trimmed.length > 0) {
      resolved[key] = trimmed
    }
  }
  return resolved
}

/** Returns overrides only for values that differ from defaults (for persistence). */
export function diffCustomerNavLabelOverrides(
  labels: Record<CustomerNavLabelKey, string>,
): CustomerNavLabelOverrides {
  const diff: CustomerNavLabelOverrides = {}
  for (const key of CUSTOMER_NAV_LABEL_KEYS) {
    if (labels[key] !== DEFAULT_CUSTOMER_NAV_LABELS[key]) {
      diff[key] = labels[key]
    }
  }
  return diff
}

export function resolveCustomerNavHidden(
  overrides: CustomerNavHiddenOverrides | null | undefined,
): Record<CustomerNavLabelKey, boolean> {
  const resolved = Object.fromEntries(
    CUSTOMER_NAV_LABEL_KEYS.map((key) => [key, false]),
  ) as Record<CustomerNavLabelKey, boolean>
  if (!overrides) {
    return resolved
  }
  for (const key of CUSTOMER_NAV_LABEL_KEYS) {
    if (overrides[key] === true) {
      resolved[key] = true
    }
  }
  return resolved
}

/** Returns only keys that are hidden (for persistence). */
export function diffCustomerNavHiddenOverrides(
  hidden: Record<CustomerNavLabelKey, boolean>,
): CustomerNavHiddenOverrides {
  const diff: CustomerNavHiddenOverrides = {}
  for (const key of CUSTOMER_NAV_LABEL_KEYS) {
    if (hidden[key]) {
      diff[key] = true
    }
  }
  return diff
}

export function isCustomerNavItemVisible(
  key: CustomerNavLabelKey,
  hidden: Record<CustomerNavLabelKey, boolean>,
): boolean {
  return !hidden[key]
}
