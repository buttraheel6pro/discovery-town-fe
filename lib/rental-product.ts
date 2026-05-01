/** Helpers to detect rental products for cart grouping, availability UI, etc. */

import type { Product } from '@/lib/types'

const RENTAL_CATEGORY_ROOT = 'pcat-rentals'

/** True when category id is the rentals tree (root or subcategory). */
export function isRentalCategoryId(categoryId: string | undefined): boolean {
  if (!categoryId) return false
  return (
    categoryId === RENTAL_CATEGORY_ROOT || categoryId.startsWith(`${RENTAL_CATEGORY_ROOT}-`)
  )
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
  return false
}
