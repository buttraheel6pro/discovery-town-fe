/** Cafe & Food consumer sub-category shape for menus and category detail pages. */
export interface CafeConsumerCategory {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly description?: string
  readonly imageUrl?: string
  readonly displayOrder: number
}

/** Resolve cafe sub-categories for consumer menus (placement-aware with native fallback). */
import { buildProductRootIdsBySlug } from '@/lib/catalog-placement'
import { resolveProductCategoryForNativeRoute } from '@/lib/product-category-route-resolve'
import {
  buildProductCategoryById,
  filterConsumerVisibleCategoriesForMenu,
  isConsumerVisibleProductCategory,
} from '@/lib/product-visibility'
import type { ProductCategory } from '@/lib/types'

const CAFE_MENU_PRODUCT_TYPE = 'cafe&food'

/** Navigation-only rows — not shown on the consumer category grid. */
export const CAFE_TAKE_OUT_LINK_CATEGORY_ID = 'pcat-cafe-take-out-link' as const

export const CAFE_CONSUMER_EXCLUDED_CATEGORY_IDS = new Set<string>([
  'pcat-cafe-delivery-catering-link',
])

function mapInventoryCategory(category: ProductCategory): CafeConsumerCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    displayOrder: category.displayOrder,
  }
}

function isBrowsableCafeConsumerCategory(category: ProductCategory): boolean {
  return !CAFE_CONSUMER_EXCLUDED_CATEGORY_IDS.has(category.id)
}

function collectFromPlacementFilter(
  productCategories: readonly ProductCategory[],
): CafeConsumerCategory[] {
  return filterConsumerVisibleCategoriesForMenu(
    CAFE_MENU_PRODUCT_TYPE,
    productCategories,
    (category, categoryById) =>
      isBrowsableCafeConsumerCategory(category) &&
      (category.parentId ?? null) !== null &&
      isConsumerVisibleProductCategory(category, categoryById),
  ).map(mapInventoryCategory)
}

function collectFromNativeCafeTree(
  productCategories: readonly ProductCategory[],
): CafeConsumerCategory[] {
  const categoryById = buildProductCategoryById(productCategories)
  const cafeRootId = buildProductRootIdsBySlug(productCategories)['cafe-food'] ?? null

  return productCategories
    .filter((category) => {
      if (!isBrowsableCafeConsumerCategory(category)) {
        return false
      }
      const productType = (category.productType ?? '').toLowerCase()
      if (productType !== 'cafe&food' && productType !== 'cafe-food') {
        return false
      }
      if ((category.parentId ?? null) === null) {
        return false
      }
      if (cafeRootId != null && category.parentId !== cafeRootId) {
        return false
      }
      return isConsumerVisibleProductCategory(category, categoryById)
    })
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map(mapInventoryCategory)
}

export function collectCafeConsumerCategories(
  productCategories: readonly ProductCategory[],
): CafeConsumerCategory[] {
  const fromPlacement = collectFromPlacementFilter(productCategories)
  if (fromPlacement.length > 0) {
    return fromPlacement
  }

  const fromNativeTree = collectFromNativeCafeTree(productCategories)
  if (fromNativeTree.length > 0) {
    return fromNativeTree
  }

  return []
}

/** Native `/cafe/[category]` — works even when the category is placed on another menu. */
export function resolveCafeConsumerCategoryForRoute(
  slug: string,
  productCategories: readonly ProductCategory[],
): CafeConsumerCategory | null {
  const category = resolveProductCategoryForNativeRoute(slug, 'cafe-food', productCategories)
  if (!category || !isBrowsableCafeConsumerCategory(category)) {
    return null
  }
  return mapInventoryCategory(category)
}
