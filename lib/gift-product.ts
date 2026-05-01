/** Helpers to detect gift catalog products for cart grouping and storefront logic. */

import type { Product, ProductCategory } from '@/lib/types'

const GIFT_CATEGORY_ROOT = 'pcat-gifts'

/** True when category id is the gifts tree (root or subcategory). */
export function isGiftCategoryId(categoryId: string | undefined): boolean {
  if (!categoryId) return false
  return (
    categoryId === GIFT_CATEGORY_ROOT || categoryId.startsWith(`${GIFT_CATEGORY_ROOT}-`)
  )
}

/**
 * True when the product is a gift-catalog item (bundles, hampers, etc.).
 * Uses category id, linked gift bundle ids, and optional category `productType`.
 */
export function isGiftProduct(
  product: Pick<Product, 'categoryId' | 'giftProductIds'>,
  productCategories?: ReadonlyArray<Pick<ProductCategory, 'id' | 'productType'>>,
): boolean {
  if (isGiftCategoryId(product.categoryId)) return true
  if ((product.giftProductIds?.length ?? 0) > 0) return true
  if (productCategories?.length) {
    const category = productCategories.find((row) => row.id === product.categoryId)
    if ((category?.productType ?? '').toLowerCase() === 'gifts') return true
  }
  return false
}

/**
 * Sum of linked basket product prices plus linked add-on prices (same resolver for both lists).
 */
export function computeGiftPriceUpperLimit(params: {
  readonly basketProductIds: readonly string[]
  readonly addOnProductIds: readonly string[]
  readonly resolvePrice: (productId: string) => number
}): number {
  const basket = params.basketProductIds.reduce(
    (sum, id) => sum + params.resolvePrice(id),
    0,
  )
  const addOns = params.addOnProductIds.reduce(
    (sum, id) => sum + params.resolvePrice(id),
    0,
  )
  return basket + addOns
}
