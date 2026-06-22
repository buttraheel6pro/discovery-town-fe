/** Scheduling menu explore grids — merge native scheduling + cross-placed product sub-categories. */
import { effectiveProductCategoryCatalogSlug, nativeSchedulingCatalogSlug } from '@/lib/catalog-placement'
import { isSchedulingCatalogSlug, normalizeCatalogSlug, type SchedulingCatalogSlug } from '@/lib/catalog-slugs'
import { resolveCafeCategoryCardMeta } from '@/lib/cafe-category-meta'
import { getCafeCategoryHref } from '@/lib/cafe-category-routes'
import { resolveEventsCategoryCardMeta } from '@/lib/events-category-meta'
import { getEventsCategoryHref } from '@/lib/events-category-routes'
import { getEventsProductCategoryHref } from '@/lib/events-product-category-routes'
import { getGiftsCategoryHref } from '@/lib/gifts-category-routes'
import { resolveGymCategoryCardMeta } from '@/lib/gym-category-meta'
import { getGymCategoryHref } from '@/lib/gym-category-routes'
import { resolveLearnCategoryCardMeta } from '@/lib/learn-category-meta'
import { getLearnCategoryHref } from '@/lib/learn-category-routes'
import { resolvePlayCategoryCardMeta } from '@/lib/play-category-meta'
import { getPlayCategoryHref } from '@/lib/play-category-routes'
import { getSchedulingCategoryExploreHref } from '@/lib/product-menu-explore-categories'
import type { HomeExploreCardAccent } from '@/components/customer/home-explore-card'
import { resolveRentalsCategoryCardMeta } from '@/lib/rentals-category-meta'
import { getRentalsCategoryHref } from '@/lib/rentals-category-routes'
import { resolveShopCategoryCardMeta } from '@/lib/shop-category-meta'
import { getShopCategoryHref } from '@/lib/shop-category-routes'
import { filterProductSubCategoriesForSchedulingMenu } from '@/lib/product-scheduling-menu-sections'
import type { ProductCategory, SchedulingCategory } from '@/lib/types'

export interface SchedulingMenuExploreCategory {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly description?: string
  readonly imageUrl?: string
  readonly displayOrder: number
  readonly source: 'scheduling' | 'product'
  readonly schedulingCategory?: SchedulingCategory
  readonly productCategory?: ProductCategory
}

export interface SchedulingMenuExploreCardMeta {
  readonly description: string
  readonly imageSrc: string
  readonly accent: HomeExploreCardAccent
}

export function collectProductCategoriesForSchedulingMenuExplore(
  menuSlug: SchedulingCatalogSlug,
  productCategories: readonly ProductCategory[],
): ProductCategory[] {
  return filterProductSubCategoriesForSchedulingMenu(menuSlug, productCategories)
}

export function productCategoryToSchedulingMenuExploreEntry(
  category: ProductCategory,
): SchedulingMenuExploreCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    displayOrder: category.displayOrder,
    source: 'product',
    productCategory: category,
  }
}

export function schedulingCategoryToSchedulingMenuExploreEntry(
  category: SchedulingCategory,
): SchedulingMenuExploreCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.id,
    description: category.description ?? undefined,
    imageUrl: category.imageUrl ?? undefined,
    displayOrder: category.displayOrder,
    source: 'scheduling',
    schedulingCategory: category,
  }
}

export function mergeSchedulingMenuExploreCategories(
  schedulingCategories: readonly SchedulingCategory[],
  productCategories: readonly ProductCategory[],
): SchedulingMenuExploreCategory[] {
  const schedulingEntries = schedulingCategories.map(
    schedulingCategoryToSchedulingMenuExploreEntry,
  )
  const productEntries = productCategories.map(productCategoryToSchedulingMenuExploreEntry)
  const seenIds = new Set<string>()
  const merged: SchedulingMenuExploreCategory[] = []

  for (const entry of [...schedulingEntries, ...productEntries]) {
    if (seenIds.has(entry.id)) {
      continue
    }
    seenIds.add(entry.id)
    merged.push(entry)
  }

  return merged.sort((left, right) => left.displayOrder - right.displayOrder)
}

export function getNativeProductCategoryExploreHref(category: ProductCategory): string {
  const nativeMenu = effectiveProductCategoryCatalogSlug(category)
  switch (nativeMenu) {
    case 'shop':
      return getShopCategoryHref(category.slug)
    case 'cafe-food':
      return getCafeCategoryHref(category.slug)
    case 'rentals':
      return getRentalsCategoryHref(category.slug)
    case 'gifts':
      return getGiftsCategoryHref(category.slug)
    default:
      return getShopCategoryHref(category.slug)
  }
}

function getPlacedProductCategoryExploreHref(category: ProductCategory): string | null {
  const placement = normalizeCatalogSlug(category.placementCatalogSlug ?? null)
  if (!placement || !isSchedulingCatalogSlug(placement)) {
    return null
  }
  if (placement === 'events') {
    return getEventsProductCategoryHref(category.slug)
  }
  return null
}

export function getSchedulingMenuExploreHref(
  entry: SchedulingMenuExploreCategory,
): string {
  if (entry.source === 'product' && entry.productCategory) {
    const placedHref = getPlacedProductCategoryExploreHref(entry.productCategory)
    if (placedHref) {
      return placedHref
    }
    return getNativeProductCategoryExploreHref(entry.productCategory)
  }
  if (entry.schedulingCategory) {
    return getSchedulingCategoryExploreHref(entry.schedulingCategory)
  }
  return getGymCategoryHref(entry.id)
}

export function getPlacedSchedulingCategoryOnSchedulingMenuHref(
  menuSlug: SchedulingCatalogSlug,
  categoryId: string,
): string {
  switch (menuSlug) {
    case 'gym':
      return getGymCategoryHref(categoryId)
    case 'play':
      return getPlayCategoryHref(categoryId)
    case 'events':
      return getEventsCategoryHref(categoryId)
    case 'learn':
    default:
      return getLearnCategoryHref(categoryId)
  }
}

function toConsumerCategoryShape(category: ProductCategory) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    displayOrder: category.displayOrder,
  }
}

export function resolveProductCategoryOnSchedulingMenuCardMeta(
  category: ProductCategory,
  index: number,
): SchedulingMenuExploreCardMeta {
  const nativeMenu = effectiveProductCategoryCatalogSlug(category)
  const consumerShape = toConsumerCategoryShape(category)

  switch (nativeMenu) {
    case 'shop':
      return resolveShopCategoryCardMeta(consumerShape, index)
    case 'rentals':
      return resolveRentalsCategoryCardMeta(consumerShape, index)
    case 'cafe-food':
      return resolveCafeCategoryCardMeta(consumerShape, index)
    case 'gifts':
    default:
      return resolveShopCategoryCardMeta(consumerShape, index)
  }
}

export function resolveSchedulingMenuExploreCardMeta(
  entry: SchedulingMenuExploreCategory,
  index: number,
): SchedulingMenuExploreCardMeta {
  if (entry.source === 'product' && entry.productCategory) {
    return resolveProductCategoryOnSchedulingMenuCardMeta(entry.productCategory, index)
  }

  const category = entry.schedulingCategory
  if (!category) {
    return {
      description: entry.description ?? '',
      imageSrc: entry.imageUrl ?? '',
      accent: 'primary',
    }
  }

  switch (nativeSchedulingCatalogSlug(category)) {
    case 'gym':
      return resolveGymCategoryCardMeta(category, index)
    case 'play':
      return resolvePlayCategoryCardMeta(category, index)
    case 'events':
      return resolveEventsCategoryCardMeta(category, index)
    case 'learn':
      return resolveLearnCategoryCardMeta(category, index)
    default:
      return resolveGymCategoryCardMeta(category, index)
  }
}
