/** Resolve product sub-categories for native detail routes (placement-independent). */
import { effectiveProductCategoryCatalogSlug } from '@/lib/catalog-placement'
import type { ProductCatalogSlug } from '@/lib/catalog-slugs'
import {
  buildProductCategoryById,
  isConsumerVisibleProductCategory,
  isShopCatalogVisibleProductCategory,
} from '@/lib/product-visibility'
import type { ProductCategory } from '@/lib/types'

function isNativeProductSubCategory(
  category: ProductCategory,
  nativeMenu: ProductCatalogSlug,
): boolean {
  if ((category.parentId ?? null) === null) {
    return false
  }
  return effectiveProductCategoryCatalogSlug(category) === nativeMenu
}

function isVisibleForNativeRoute(
  category: ProductCategory,
  categoryById: ReadonlyMap<string, ProductCategory>,
  nativeMenu: ProductCatalogSlug,
): boolean {
  if (nativeMenu === 'shop') {
    return isShopCatalogVisibleProductCategory(category, categoryById)
  }
  return isConsumerVisibleProductCategory(category, categoryById)
}

export function resolveProductCategoryForNativeRoute(
  categorySlug: string,
  nativeMenu: ProductCatalogSlug,
  productCategories: readonly ProductCategory[],
): ProductCategory | null {
  const categoryById = buildProductCategoryById(productCategories)
  const category =
    productCategories.find((row) => row.slug === categorySlug) ?? null

  if (!category) {
    return null
  }
  if (!isNativeProductSubCategory(category, nativeMenu)) {
    return null
  }
  if (!isVisibleForNativeRoute(category, categoryById, nativeMenu)) {
    return null
  }

  return category
}
