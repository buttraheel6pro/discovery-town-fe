/** Product menu explore grids — merge inventory + cross-placed scheduling sub-categories. */
import { buildProductRootIdsBySlug, nativeSchedulingCatalogSlug } from '@/lib/catalog-placement'
import { catalogSlugToProductType, type ProductCatalogSlug } from '@/lib/catalog-slugs'
import { getEventsCategoryHref } from '@/lib/events-category-routes'
import { getGymCategoryHref } from '@/lib/gym-category-routes'
import { getLearnCategoryHref } from '@/lib/learn-category-routes'
import { getPlayCategoryHref } from '@/lib/play-category-routes'
import { resolveEventsCategoryCardMeta } from '@/lib/events-category-meta'
import { resolveGymCategoryCardMeta } from '@/lib/gym-category-meta'
import { resolveLearnCategoryCardMeta } from '@/lib/learn-category-meta'
import { resolvePlayCategoryCardMeta } from '@/lib/play-category-meta'
import type { HomeExploreCardAccent } from '@/components/customer/home-explore-card'
import { filterConsumerSchedulingCategoriesForProductMenu } from '@/lib/scheduling-visibility'
import type { SchedulingCategory, ProductCategory } from '@/lib/types'

export interface ProductMenuExploreCategory {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly description?: string
  readonly imageUrl?: string
  readonly displayOrder: number
  readonly source: 'product' | 'scheduling'
  readonly schedulingCategory?: SchedulingCategory
}

export interface ProductMenuExploreCardMeta {
  readonly description: string
  readonly imageSrc: string
  readonly accent: HomeExploreCardAccent
}

export function collectSchedulingCategoriesForProductMenuExplore(
  menuSlug: ProductCatalogSlug,
  schedulingCategories: readonly SchedulingCategory[],
  productCategories: readonly ProductCategory[],
): SchedulingCategory[] {
  const productRootIdsBySlug = buildProductRootIdsBySlug(productCategories)
  const productType = catalogSlugToProductType(menuSlug)
  return filterConsumerSchedulingCategoriesForProductMenu(
    productType,
    schedulingCategories,
    productRootIdsBySlug,
    productCategories,
  )
}

export function schedulingCategoryToExploreEntry(
  category: SchedulingCategory,
): ProductMenuExploreCategory {
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

export function mergeProductMenuExploreCategories<
  T extends Omit<ProductMenuExploreCategory, 'source' | 'schedulingCategory'>,
>(
  productCategories: readonly T[],
  schedulingCategories: readonly SchedulingCategory[],
): ProductMenuExploreCategory[] {
  const productEntries: ProductMenuExploreCategory[] = productCategories.map((category) => ({
    ...category,
    source: 'product',
  }))
  const schedulingEntries = schedulingCategories.map(schedulingCategoryToExploreEntry)
  const seenIds = new Set<string>()
  const merged: ProductMenuExploreCategory[] = []

  for (const entry of [...productEntries, ...schedulingEntries]) {
    if (seenIds.has(entry.id)) {
      continue
    }
    seenIds.add(entry.id)
    merged.push(entry)
  }

  return merged.sort((left, right) => left.displayOrder - right.displayOrder)
}

/** Native scheduling detail route — unchanged when a category is placed on another menu. */
export function getSchedulingCategoryExploreHref(category: SchedulingCategory): string {
  const nativeMenu = nativeSchedulingCatalogSlug(category)
  switch (nativeMenu) {
    case 'gym':
      return getGymCategoryHref(category.id)
    case 'play':
      return getPlayCategoryHref(category.id)
    case 'events':
      return getEventsCategoryHref(category.id)
    case 'learn':
      return getLearnCategoryHref(category.id)
    default:
      return getGymCategoryHref(category.id)
  }
}

export function resolveSchedulingExploreCardMeta(
  category: SchedulingCategory,
  index: number,
): ProductMenuExploreCardMeta {
  const nativeMenu = nativeSchedulingCatalogSlug(category)
  switch (nativeMenu) {
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
