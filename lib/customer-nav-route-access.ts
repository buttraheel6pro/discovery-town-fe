/** Map customer URL paths to navbar keys for route access control. */
import {
  CUSTOMER_NAV_LABEL_KEYS,
  productTypeToNavLabelKey,
  type CustomerNavLabelKey,
} from '@/lib/customer-nav-labels'

export const CUSTOMER_NAV_PATH_PREFIXES: Record<CustomerNavLabelKey, readonly string[]> = {
  play: ['/play', '/we-bring-to-play'],
  gym: ['/gym', '/classes', '/class-packs'],
  events: ['/events', '/private-hire', '/we-bring-the-party'],
  shop: ['/store/shop', '/shop/checkout', '/shop/order-confirmation'],
  gifts: ['/store/gifts'],
  rentals: ['/rentals'],
  cafeFood: ['/store/cafe-food', '/cafe'],
}

export function storeSlugToNavLabelKey(slug: string): CustomerNavLabelKey | null {
  switch (slug) {
    case 'shop':
      return 'shop'
    case 'gifts':
      return 'gifts'
    case 'cafe-food':
      return 'cafeFood'
    case 'rentals':
      return 'rentals'
    default:
      return null
  }
}

export function resolveCustomerNavKeyFromPathname(pathname: string): CustomerNavLabelKey | null {
  const normalized = pathname.split('?')[0]?.split('#')[0] ?? pathname

  for (const key of CUSTOMER_NAV_LABEL_KEYS) {
    for (const prefix of CUSTOMER_NAV_PATH_PREFIXES[key]) {
      if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
        return key
      }
    }
  }

  return null
}

export function resolveProductNavLabelKey(
  productType: string | null | undefined,
): CustomerNavLabelKey | null {
  if (productType == null || productType.trim().length === 0) {
    return null
  }
  if (productType === 'rentals') {
    return 'rentals'
  }
  return productTypeToNavLabelKey(productType)
}
