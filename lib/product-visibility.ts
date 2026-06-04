/** Shared visibility helpers for inventory products and categories on customer routes. */
import {
  buildProductRootIdsBySlug,
  productCategoryAppearsOnCustomerMenu,
} from '@/lib/catalog-placement'
import type { Product, ProductCategory } from '@/lib/types'

/** Internal gift categories — hidden from customer browse; items stay as gift linked add-ons. */
export const CUSTOMER_HIDDEN_CATEGORY_IDS = new Set<string>([
  'pcat-gift-basket-components',
  'pcat-gift-delivery-addons',
])

export type ProductCategoryVisibilityFields = Pick<
  ProductCategory,
  'id' | 'isActive' | 'parentId'
>

export function isCustomerHiddenCategoryId(categoryId: string): boolean {
  return CUSTOMER_HIDDEN_CATEGORY_IDS.has(categoryId)
}

export function isConsumerVisibleProductCategory(
  category: ProductCategoryVisibilityFields,
  categoryById: ReadonlyMap<string, ProductCategoryVisibilityFields>,
): boolean {
  if (isCustomerHiddenCategoryId(category.id)) {
    return false
  }
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

/** Shop browse (/store/shop) — same consumer rules including hidden internal categories. */
export function isShopCatalogVisibleProductCategory(
  category: ProductCategoryVisibilityFields,
  categoryById: ReadonlyMap<string, ProductCategoryVisibilityFields>,
): boolean {
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
  return isConsumerVisibleProduct(product, categoryById)
}

/** Gift detail “You may also like” — linked add-ons, not general shop browse. */
export function isGiftAddOnVisibleProduct(
  product: Pick<Product, 'isActive' | 'availableOnline'>,
): boolean {
  return product.isActive && product.availableOnline !== false
}

/** Rental detail “You may also like” — same rules as gift linked add-ons. */
export function isRentalAddOnVisibleProduct(
  product: Pick<Product, 'isActive' | 'availableOnline'>,
): boolean {
  return isGiftAddOnVisibleProduct(product)
}

/** Whether a product type has at least one consumer-visible category. */
export function hasConsumerVisibleProductType(
  productType: string,
  categories: readonly ProductCategory[],
): boolean {
  const categoryById = buildProductCategoryById(categories)
  const productRootIdsBySlug = buildProductRootIdsBySlug(categories)
  const categoryVisible =
    productType === 'shop'
      ? isShopCatalogVisibleProductCategory
      : isConsumerVisibleProductCategory
  return categories.some(
    (category) =>
      productCategoryAppearsOnCustomerMenu(
        category,
        productType,
        productRootIdsBySlug,
      ) && categoryVisible(category, categoryById),
  )
}

/** Consumer-visible categories for a store/rentals menu (placement-aware). */
export function filterConsumerVisibleCategoriesForMenu(
  productType: string,
  categories: readonly ProductCategory[],
  categoryVisible: (
    category: ProductCategoryVisibilityFields,
    categoryById: ReadonlyMap<string, ProductCategoryVisibilityFields>,
  ) => boolean,
): ProductCategory[] {
  const categoryById = buildProductCategoryById(categories)
  const productRootIdsBySlug = buildProductRootIdsBySlug(categories)
  return categories
    .filter(
      (category) =>
        productCategoryAppearsOnCustomerMenu(
          category,
          productType,
          productRootIdsBySlug,
        ) && categoryVisible(category, categoryById),
    )
    .slice()
    .sort((left, right) => left.displayOrder - right.displayOrder)
}
