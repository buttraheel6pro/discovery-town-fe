/** Rentals consumer sub-category shape for menus and category detail pages. */
export interface RentalsConsumerCategory {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly description?: string
  readonly imageUrl?: string
  readonly displayOrder: number
}

/** Resolve rentals sub-categories for consumer menus (placement-aware with native fallback). */
import { buildProductRootIdsBySlug } from '@/lib/catalog-placement'
import { resolveProductCategoryForNativeRoute } from '@/lib/product-category-route-resolve'
import {
  buildProductCategoryById,
  filterConsumerVisibleCategoriesForMenu,
  isConsumerVisibleProductCategory,
} from '@/lib/product-visibility'
import type { ProductCategory } from '@/lib/types'

function mapInventoryCategory(category: ProductCategory): RentalsConsumerCategory {
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
): RentalsConsumerCategory[] {
  return filterConsumerVisibleCategoriesForMenu(
    'rentals',
    productCategories,
    (category, categoryById) =>
      (category.parentId ?? null) !== null &&
      isConsumerVisibleProductCategory(category, categoryById),
  ).map(mapInventoryCategory)
}

/** Native rentals tree when placement metadata does not match the customer menu filter. */
function collectFromNativeRentalsTree(
  productCategories: readonly ProductCategory[],
): RentalsConsumerCategory[] {
  const categoryById = buildProductCategoryById(productCategories)
  const rentalRootId = buildProductRootIdsBySlug(productCategories).rentals ?? null

  return productCategories
    .filter((category) => {
      if ((category.productType ?? '').toLowerCase() !== 'rentals') {
        return false
      }
      if ((category.parentId ?? null) === null) {
        return false
      }
      if (rentalRootId != null && category.parentId !== rentalRootId) {
        return false
      }
      return isConsumerVisibleProductCategory(category, categoryById)
    })
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map(mapInventoryCategory)
}

export function collectRentalsConsumerCategories(
  productCategories: readonly ProductCategory[],
): RentalsConsumerCategory[] {
  const fromPlacement = collectFromPlacementFilter(productCategories)
  if (fromPlacement.length > 0) {
    return fromPlacement
  }

  const fromNativeTree = collectFromNativeRentalsTree(productCategories)
  if (fromNativeTree.length > 0) {
    return fromNativeTree
  }

  return []
}

/** Native `/rentals/[categorySlug]` — works even when the category is placed on another menu. */
export function resolveRentalsConsumerCategoryForRoute(
  slug: string,
  productCategories: readonly ProductCategory[],
): RentalsConsumerCategory | null {
  const category = resolveProductCategoryForNativeRoute(slug, 'rentals', productCategories)
  return category ? mapInventoryCategory(category) : null
}
