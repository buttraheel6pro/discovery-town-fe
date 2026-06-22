/** Gifts consumer sub-category shape for menus and category detail pages. */
export interface GiftsConsumerCategory {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly description?: string
  readonly imageUrl?: string
  readonly displayOrder: number
}

/** Resolve gifts sub-categories for consumer menus (placement-aware with native fallback). */
import { buildProductRootIdsBySlug } from '@/lib/catalog-placement'
import { resolveProductCategoryForNativeRoute } from '@/lib/product-category-route-resolve'
import {
  buildProductCategoryById,
  filterConsumerVisibleCategoriesForMenu,
  isConsumerVisibleProductCategory,
} from '@/lib/product-visibility'
import type { ProductCategory } from '@/lib/types'

const GIFTS_MENU_PRODUCT_TYPE = 'gifts'

function mapInventoryCategory(category: ProductCategory): GiftsConsumerCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    displayOrder: category.displayOrder,
  }
}

function collectFromPlacementFilter(
  productCategories: readonly ProductCategory[],
): GiftsConsumerCategory[] {
  return filterConsumerVisibleCategoriesForMenu(
    GIFTS_MENU_PRODUCT_TYPE,
    productCategories,
    (category, categoryById) =>
      (category.parentId ?? null) !== null &&
      isConsumerVisibleProductCategory(category, categoryById),
  ).map(mapInventoryCategory)
}

function collectFromNativeGiftsTree(
  productCategories: readonly ProductCategory[],
): GiftsConsumerCategory[] {
  const categoryById = buildProductCategoryById(productCategories)
  const giftsRootId = buildProductRootIdsBySlug(productCategories).gifts ?? null

  return productCategories
    .filter((category) => {
      if ((category.productType ?? '').toLowerCase() !== 'gifts') {
        return false
      }
      if ((category.parentId ?? null) === null) {
        return false
      }
      if (giftsRootId != null && category.parentId !== giftsRootId) {
        return false
      }
      return isConsumerVisibleProductCategory(category, categoryById)
    })
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map(mapInventoryCategory)
}

export function collectGiftsConsumerCategories(
  productCategories: readonly ProductCategory[],
): GiftsConsumerCategory[] {
  const fromPlacement = collectFromPlacementFilter(productCategories)
  if (fromPlacement.length > 0) {
    return fromPlacement
  }

  const fromNativeTree = collectFromNativeGiftsTree(productCategories)
  if (fromNativeTree.length > 0) {
    return fromNativeTree
  }

  return []
}

/** Native `/gifts/category/[slug]` — works even when the category is placed on another menu. */
export function resolveGiftsConsumerCategoryForRoute(
  slug: string,
  productCategories: readonly ProductCategory[],
): GiftsConsumerCategory | null {
  const category = resolveProductCategoryForNativeRoute(slug, 'gifts', productCategories)
  return category ? mapInventoryCategory(category) : null
}
