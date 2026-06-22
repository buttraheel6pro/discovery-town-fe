/** Shop consumer sub-category shape for menus and category detail pages. */
export interface ShopConsumerCategory {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly description?: string
  readonly imageUrl?: string
  readonly displayOrder: number
}

/** Resolve shop sub-categories for consumer menus (placement-aware with native fallback). */
import { buildProductRootIdsBySlug } from '@/lib/catalog-placement'
import { resolveProductCategoryForNativeRoute } from '@/lib/product-category-route-resolve'
import {
  buildProductCategoryById,
  filterConsumerVisibleCategoriesForMenu,
  isShopCatalogVisibleProductCategory,
} from '@/lib/product-visibility'
import type { ProductCategory } from '@/lib/types'

const SHOP_MENU_PRODUCT_TYPE = 'shop'

function mapInventoryCategory(category: ProductCategory): ShopConsumerCategory {
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
): ShopConsumerCategory[] {
  return filterConsumerVisibleCategoriesForMenu(
    SHOP_MENU_PRODUCT_TYPE,
    productCategories,
    (category, categoryById) =>
      (category.parentId ?? null) !== null &&
      isShopCatalogVisibleProductCategory(category, categoryById),
  ).map(mapInventoryCategory)
}

function collectFromNativeShopTree(
  productCategories: readonly ProductCategory[],
): ShopConsumerCategory[] {
  const categoryById = buildProductCategoryById(productCategories)
  const shopRootId = buildProductRootIdsBySlug(productCategories).shop ?? null

  return productCategories
    .filter((category) => {
      if ((category.productType ?? '').toLowerCase() !== 'shop') {
        return false
      }
      if ((category.parentId ?? null) === null) {
        return false
      }
      if (shopRootId != null && category.parentId !== shopRootId) {
        return false
      }
      return isShopCatalogVisibleProductCategory(category, categoryById)
    })
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map(mapInventoryCategory)
}

export function collectShopConsumerCategories(
  productCategories: readonly ProductCategory[],
): ShopConsumerCategory[] {
  const fromPlacement = collectFromPlacementFilter(productCategories)
  if (fromPlacement.length > 0) {
    return fromPlacement
  }

  const fromNativeTree = collectFromNativeShopTree(productCategories)
  if (fromNativeTree.length > 0) {
    return fromNativeTree
  }

  return []
}

/** Native `/shop/category/[slug]` — works even when the category is placed on another menu. */
export function resolveShopConsumerCategoryForRoute(
  slug: string,
  productCategories: readonly ProductCategory[],
): ShopConsumerCategory | null {
  const category = resolveProductCategoryForNativeRoute(slug, 'shop', productCategories)
  return category ? mapInventoryCategory(category) : null
}
