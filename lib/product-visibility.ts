/** Shared visibility helpers for inventory products and categories on customer routes. */
import type { Product, ProductCategory } from '@/lib/types'

/** Internal gift add-on categories — browse on /store/shop only, not listed there. */
export const SHOP_CATALOG_HIDDEN_CATEGORY_IDS = new Set<string>([
  'pcat-gift-basket-components',
  'pcat-gift-delivery-addons',
])

export type ProductCategoryVisibilityFields = Pick<
  ProductCategory,
  'id' | 'isActive' | 'parentId'
>

export function isShopCatalogHiddenCategoryId(categoryId: string): boolean {
  return SHOP_CATALOG_HIDDEN_CATEGORY_IDS.has(categoryId)
}

export function isConsumerVisibleProductCategory(
  category: ProductCategoryVisibilityFields,
  categoryById: ReadonlyMap<string, ProductCategoryVisibilityFields>,
): boolean {
  if (category.isActive === false) {
    return false
  }
  const parentId = category.parentId ?? null
  if (!parentId) {
    return true
  }
  const parent = categoryById.get(parentId)
  if (!parent) {
    return false
  }
  return isConsumerVisibleProductCategory(parent, categoryById)
}

/** Shop browse (/store/shop) — excludes internal gift add-on categories. */
export function isShopCatalogVisibleProductCategory(
  category: ProductCategoryVisibilityFields,
  categoryById: ReadonlyMap<string, ProductCategoryVisibilityFields>,
): boolean {
  if (isShopCatalogHiddenCategoryId(category.id)) {
    return false
  }
  return isConsumerVisibleProductCategory(category, categoryById)
}

export function buildProductCategoryById(
  categories: readonly ProductCategory[],
): Map<string, ProductCategory> {
  return new Map(categories.map((category) => [category.id, category]))
}

export function isProductCategoryActiveForConsumer(
  categoryId: string,
  categoryById: ReadonlyMap<string, ProductCategoryVisibilityFields>,
): boolean {
  const category = categoryById.get(categoryId)
  if (!category) {
    return false
  }
  return isConsumerVisibleProductCategory(category, categoryById)
}

export function isConsumerVisibleProduct(
  product: Pick<Product, 'isActive' | 'availableOnline' | 'categoryId'>,
  categoryById: ReadonlyMap<string, ProductCategoryVisibilityFields>,
): boolean {
  if (!product.isActive) {
    return false
  }
  if (product.availableOnline === false) {
    return false
  }
  return isProductCategoryActiveForConsumer(product.categoryId, categoryById)
}

export function isShopCatalogVisibleProduct(
  product: Pick<Product, 'isActive' | 'availableOnline' | 'categoryId'>,
  categoryById: ReadonlyMap<string, ProductCategoryVisibilityFields>,
): boolean {
  if (isShopCatalogHiddenCategoryId(product.categoryId)) {
    return false
  }
  return isConsumerVisibleProduct(product, categoryById)
}

/** Gift detail “You may also like” — linked add-ons, not general shop browse. */
export function isGiftAddOnVisibleProduct(
  product: Pick<Product, 'isActive' | 'availableOnline'>,
): boolean {
  return product.isActive && product.availableOnline !== false
}

/** Whether a product type has at least one consumer-visible category. */
export function hasConsumerVisibleProductType(
  productType: string,
  categories: readonly ProductCategory[],
): boolean {
  const categoryById = buildProductCategoryById(categories)
  const categoryVisible =
    productType === 'shop'
      ? isShopCatalogVisibleProductCategory
      : isConsumerVisibleProductCategory
  return categories.some(
    (category) =>
      (category.productType ?? 'shop') === productType &&
      categoryVisible(category, categoryById),
  )
}
