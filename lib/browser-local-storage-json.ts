/** Safe JSON persistence to localStorage with compression and non-destructive quota handling. */

import { compressToUTF16, decompressFromUTF16 } from 'lz-string'

import type { SchedulingState } from '@/lib/redux/slices/scheduling-slice'
import type { InventoryState } from '@/lib/redux/slices/inventory-slice'
import type { Product, ProductCategory, SchedulingCategory } from '@/lib/types'

const COMPRESSED_PREFIX = '__dtz1:'
export const SCHEDULING_CATEGORY_IMAGE_STORAGE_KEY =
  'discovery-town:scheduling-category-images:v1'

export const PRODUCT_CATEGORY_IMAGE_STORAGE_KEY =
  'discovery-town:product-category-images:v1'

const MAX_PERSISTED_INLINE_IMAGE_BYTES = 320_000

function stripDataUrlImageUrl(value: string | undefined): string | undefined {
  if (value == null || value.length === 0) {
    return value
  }
  return value.startsWith('data:') ? undefined : value
}

function inlineImageWithinPersistLimit(value: string): boolean {
  if (!value.startsWith('data:')) {
    return false
  }
  const commaIndex = value.indexOf(',')
  if (commaIndex < 0) {
    return false
  }
  const base64 = value.slice(commaIndex + 1)
  const bytes = Math.ceil((base64.length * 3) / 4)
  return bytes <= MAX_PERSISTED_INLINE_IMAGE_BYTES
}

function stripSchedulingCategoryForStorage(
  category: SchedulingCategory,
): SchedulingCategory {
  return {
    ...category,
    imageUrl: stripDataUrlImageUrl(category.imageUrl ?? undefined),
  }
}

/** Persist compressed category card images separately from the main scheduling snapshot. */
export function extractSchedulingCategoryImageMap(
  categories: readonly SchedulingCategory[],
): Record<string, string> {
  const imageMap: Record<string, string> = {}
  for (const category of categories) {
    const imageUrl = category.imageUrl?.trim()
    if (imageUrl && inlineImageWithinPersistLimit(imageUrl)) {
      imageMap[category.id] = imageUrl
    }
  }
  return imageMap
}

export function mergeSchedulingCategoryImages(
  categories: readonly SchedulingCategory[],
  imageMap: Record<string, string> | null | undefined,
): SchedulingCategory[] {
  if (!imageMap) {
    return categories.map((category) => ({ ...category }))
  }
  return categories.map((category) => {
    const persistedImage = imageMap[category.id]
    if (!persistedImage) {
      return { ...category }
    }
    return {
      ...category,
      imageUrl: persistedImage,
    }
  })
}

/** Persist compressed product sub-category card images separately from the main inventory snapshot. */
export function extractProductCategoryImageMap(
  categories: readonly ProductCategory[],
): Record<string, string> {
  const imageMap: Record<string, string> = {}
  for (const category of categories) {
    const imageUrl = category.imageUrl?.trim()
    if (imageUrl && inlineImageWithinPersistLimit(imageUrl)) {
      imageMap[category.id] = imageUrl
    }
  }
  return imageMap
}

export function mergeProductCategoryImages(
  categories: readonly ProductCategory[],
  imageMap: Record<string, string> | null | undefined,
): ProductCategory[] {
  if (!imageMap) {
    return categories.map((category) => ({ ...category }))
  }
  return categories.map((category) => {
    const persistedImage = imageMap[category.id]
    if (!persistedImage) {
      return { ...category }
    }
    return {
      ...category,
      imageUrl: persistedImage,
    }
  })
}

/**
 * Removes inlined category image data URLs from the main scheduling snapshot.
 * Pair with {@link extractSchedulingCategoryImageMap} so uploads still reload in mock mode.
 */
export function schedulingStateForLocalStorage(state: SchedulingState): SchedulingState {
  return {
    ...state,
    categories: state.categories.map(stripSchedulingCategoryForStorage),
  }
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

function trySetItem(key: string, raw: string): boolean {
  try {
    window.localStorage.setItem(key, raw)
    return true
  } catch {
    return false
  }
}

function serializeForStorage(value: unknown): string | null {
  try {
    return JSON.stringify(value)
  } catch {
    return null
  }
}

function compressSerializedJson(raw: string): string {
  return `${COMPRESSED_PREFIX}${compressToUTF16(raw)}`
}

function parseStoredRaw(raw: string): unknown {
  if (raw.startsWith(COMPRESSED_PREFIX)) {
    const decompressed = decompressFromUTF16(raw.slice(COMPRESSED_PREFIX.length))
    if (decompressed == null || decompressed.length === 0) {
      throw new Error('Failed to decompress stored payload')
    }
    return JSON.parse(decompressed) as unknown
  }
  return JSON.parse(raw) as unknown
}

/** Reads and parses a value from localStorage (plain JSON or compressed). */
export function getLocalStorageJson<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null
  }
  const raw = window.localStorage.getItem(key)
  if (!raw) {
    return null
  }
  try {
    return parseStoredRaw(raw) as T
  } catch {
    return null
  }
}

/**
 * Writes JSON to localStorage. Tries plain JSON, then compressed. Never removes an
 * existing snapshot on quota failure — the prior value stays intact.
 */
export function setLocalStorageJson(key: string, value: unknown): boolean {
  if (typeof window === 'undefined') {
    return true
  }
  const raw = serializeForStorage(value)
  if (raw == null) {
    return false
  }
  if (trySetItem(key, raw)) {
    return true
  }
  try {
    const compressed = compressSerializedJson(raw)
    return trySetItem(key, compressed)
  } catch {
    return false
  }
}
