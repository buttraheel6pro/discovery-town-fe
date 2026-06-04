/** Helpers to detect rental products for cart grouping, availability UI, etc. */

import { WE_BRING_PLAY_RENTAL_CATEGORY_ID } from '@/lib/we-bring-play-rental-products'
import type { Product } from '@/lib/types'

const RENTAL_CATEGORY_ROOT = 'pcat-rentals'

const RENTAL_CATEGORY_IDS = new Set<string>([
  RENTAL_CATEGORY_ROOT,
  WE_BRING_PLAY_RENTAL_CATEGORY_ID,
])

/** True when category id is the rentals tree (root or subcategory). */
export function isRentalCategoryId(categoryId: string | undefined): boolean {
  if (!categoryId) return false
  if (RENTAL_CATEGORY_IDS.has(categoryId)) return true
  return categoryId.startsWith(`${RENTAL_CATEGORY_ROOT}-`)
}

/**
 * True when the product should behave as a rental in the storefront
 * (cart “Rental items”, availability calendar, etc.).
 */
export function isRentalProduct(
  product: Pick<Product, 'id' | 'categoryId' | 'isRental'>,
): boolean {
  if (product.isRental === true) return true
  if (isRentalCategoryId(product.categoryId)) return true
  if (product.id.startsWith('prod-rental-')) return true
  if (product.id.startsWith('prod-we-bring-')) return true
  return false
}

/** Gift-style rental bundles with fixed capacity + linked products (not single-SKU rentals). */
export function usesRentalBasketBundle(
  product: Pick<Product, 'basketCapacity' | 'giftProductIds'>,
): boolean {
  if (product.basketCapacity != null && Number.isFinite(product.basketCapacity)) {
    return true
  }
  return (product.giftProductIds?.length ?? 0) > 0
}

export function rentalRequiresScheduledBooking(
  product: Pick<Product, 'rentalBillingType'>,
): boolean {
  return (
    product.rentalBillingType === 'PER_DAY' ||
    product.rentalBillingType === 'PER_HOUR' ||
    product.rentalBillingType === 'PER_HALF_DAY'
  )
}

/** Primary CTA label/href for customer rental cards (consistent across billing types). */
export function rentalProductPrimaryAction(
  product: Pick<Product, 'id' | 'rentalBillingType'>,
): { readonly href: string; readonly label: string; readonly usesScheduleLink: boolean } {
  if (rentalRequiresScheduledBooking(product)) {
    return {
      href: `/shop/${product.id}#rental-dates`,
      label: 'View rental details',
      usesScheduleLink: true,
    }
  }
  return {
    href: '',
    label: 'Add to rental cart',
    usesScheduleLink: false,
  }
}
