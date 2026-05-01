/** Safe JSON persistence to localStorage with quota handling and inventory slimming. */

import type { InventoryState } from '@/lib/redux/slices/inventory-slice'
import type { Product, ProductCategory } from '@/lib/types'

function stripDataUrlImageUrl(value: string | undefined): string | undefined {
  if (value == null || value.length === 0) return value
  return value.startsWith('data:') ? undefined : value
}

function stripProductMediaForStorage(product: Product): Product {
  const imageUrl = stripDataUrlImageUrl(product.imageUrl)
  const galleryImages =
    product.galleryImages == null
      ? undefined
      : product.galleryImages.filter(
          (entry): entry is string => typeof entry === 'string' && !entry.startsWith('data:'),
        )
  return {
    ...product,
    imageUrl,
    galleryImages:
      galleryImages != null && galleryImages.length > 0 ? galleryImages : undefined,
  }
}

function stripCategoryMediaForStorage(category: ProductCategory): ProductCategory {
  return {
    ...category,
    imageUrl: stripDataUrlImageUrl(category.imageUrl),
  }
}

/**
 * Removes inlined data URLs from catalog media before persisting — they dominate JSON size
 * and routinely exceed the localStorage quota.
 */
export function inventoryStateForLocalStorage(state: InventoryState): InventoryState {
  return {
    products: state.products.map(stripProductMediaForStorage),
    productCategories: state.productCategories.map(stripCategoryMediaForStorage),
    bookingAddOns: state.bookingAddOns.map((addOn) => ({
      ...addOn,
      applicableServiceTypes: [...addOn.applicableServiceTypes],
    })),
  }
}

/**
 * Writes JSON to localStorage. On quota failure, clears the key once and retries.
 * Returns whether the final write succeeded (false leaves prior value removed on retry path).
 */
export function setLocalStorageJson(key: string, value: unknown): boolean {
  if (typeof window === 'undefined') {
    return true
  }
  let raw: string
  try {
    raw = JSON.stringify(value)
  } catch {
    return false
  }
  try {
    window.localStorage.setItem(key, raw)
    return true
  } catch {
    try {
      window.localStorage.removeItem(key)
      window.localStorage.setItem(key, raw)
      return true
    } catch {
      return false
    }
  }
}
