/** Admin menu placement helpers for scheduling and product sub-categories. */

import {
  catalogSlugFromProductType,
  catalogSlugFromSchedulingCategoryId,
  catalogSlugToProductType,
  catalogSlugToSchedulingTopLevel,
  isProductCatalogSlug,
  isSchedulingCatalogSlug,
  normalizeCatalogSlug,
  type CatalogSlug,
  type ProductCatalogSlug,
  type SchedulingCatalogSlug,
} from '@/lib/catalog-slugs'
import { getSchedulingTopLevelId } from '@/lib/scheduling-consumer-categories'
import type { ProductCategory, SchedulingCategory } from '@/lib/types'

export interface CatalogMenuTarget {
  readonly catalogSlug: CatalogSlug
  readonly parentId: string | null
  readonly kind: 'scheduling' | 'product'
}

export function effectiveSchedulingCatalogSlug(
  category: Pick<SchedulingCategory, 'id' | 'catalogSlug' | 'placementCatalogSlug'>,
): CatalogSlug {
  const placement = normalizeCatalogSlug(category.placementCatalogSlug ?? null)
  if (placement && isSchedulingCatalogSlug(placement)) {
    return placement
  }
  const canonical = normalizeCatalogSlug(category.catalogSlug ?? null)
  if (canonical && isSchedulingCatalogSlug(canonical)) {
    return canonical
  }
  return catalogSlugFromSchedulingCategoryId(category.id)
}

/** Native Gym / Play / Events home — used for listing layout when placed on product menus. */
export function nativeSchedulingCatalogSlug(
  category: Pick<SchedulingCategory, 'id' | 'catalogSlug' | 'placementCatalogSlug'>,
): SchedulingCatalogSlug {
  const slug = effectiveSchedulingCatalogSlug(category)
  return isSchedulingCatalogSlug(slug) ? slug : catalogSlugFromSchedulingCategoryId(category.id)
}

/** Events catalog expands package tiers; Play and Gym list one card per service. */
export function usesEventStyleSchedulingListing(
  category: Pick<SchedulingCategory, 'id' | 'catalogSlug' | 'placementCatalogSlug'>,
): boolean {
  return nativeSchedulingCatalogSlug(category) === 'events'
}

/** Placed on a product menu (Shop, Gifts, Rentals, …) — not native there. */
export function isSchedulingCategoryPlacedOnProductMenu(
  category: Pick<SchedulingCategory, 'placementCatalogSlug'>,
): boolean {
  const placement = normalizeCatalogSlug(category.placementCatalogSlug ?? null)
  return placement != null && isProductCatalogSlug(placement)
}

/**
 * Placed on a scheduling menu other than its native home (e.g. Gym category on Play).
 * Native Play/Gym rows with no placement return false.
 */
export function isSchedulingCategoryCrossPlacedOnSchedulingMenu(
  category: Pick<SchedulingCategory, 'id' | 'catalogSlug' | 'placementCatalogSlug'>,
  menuSlug: SchedulingCatalogSlug,
): boolean {
  const placement = normalizeCatalogSlug(category.placementCatalogSlug ?? null)
  if (!placement || !isSchedulingCatalogSlug(placement)) {
    return false
  }
  return placement === menuSlug && nativeSchedulingCatalogSlug(category) !== menuSlug
}

/** Explicitly placed on a scheduling menu (Play / Gym / Events), including cross-menu moves. */
export function isSchedulingCategoryPlacedOnSchedulingMenu(
  category: Pick<SchedulingCategory, 'placementCatalogSlug'>,
  menuSlug: SchedulingCatalogSlug,
): boolean {
  const placement = normalizeCatalogSlug(category.placementCatalogSlug ?? null)
  return placement === menuSlug
}

export function effectiveProductCategoryCatalogSlug(
  category: Pick<ProductCategory, 'productType' | 'catalogSlug'>,
): ProductCatalogSlug {
  const canonical = normalizeCatalogSlug(category.catalogSlug ?? null)
  if (canonical && isProductCatalogSlug(canonical)) {
    return canonical
  }
  return catalogSlugFromProductType(category.productType)
}

export function effectiveProductPlacementSlug(
  category: Pick<
    ProductCategory,
    'productType' | 'catalogSlug' | 'placementCatalogSlug' | 'parentId'
  >,
): CatalogSlug {
  const placement = normalizeCatalogSlug(category.placementCatalogSlug ?? null)
  if (placement) return placement
  return effectiveProductCategoryCatalogSlug(category)
}

function schedulingPlacementParentMatchesProductMenu(
  parentId: string | null,
  menuSlug: ProductCatalogSlug,
  expectedRoot: string | undefined,
  productCategories: readonly Pick<ProductCategory, 'id' | 'parentId' | 'productType'>[],
): boolean {
  if (!expectedRoot) {
    return true
  }
  if (parentId === null || parentId === expectedRoot) {
    return true
  }
  const parentCategory = productCategories.find((row) => row.id === parentId)
  if (!parentCategory) {
    return true
  }
  const nativeRootId = parentCategory.parentId ?? parentCategory.id
  return nativeRootId === expectedRoot
}

export function schedulingCategoryAppearsUnderMenuSlug(
  category: Pick<
    SchedulingCategory,
    'id' | 'catalogSlug' | 'placementCatalogSlug' | 'placementParentId'
  >,
  menuSlug: CatalogSlug,
  productRootIdsBySlug: Readonly<Record<string, string | undefined>> = {},
  productCategories: readonly Pick<ProductCategory, 'id' | 'parentId' | 'productType'>[] = [],
): boolean {
  const placement = normalizeCatalogSlug(category.placementCatalogSlug ?? null)
  if (placement) {
    if (placement !== menuSlug) {
      return false
    }
    if (isProductCatalogSlug(menuSlug)) {
      const expectedRoot = productRootIdsBySlug[menuSlug]
      return schedulingPlacementParentMatchesProductMenu(
        category.placementParentId ?? null,
        menuSlug,
        expectedRoot,
        productCategories,
      )
    }
    return true
  }
  if (!isSchedulingCatalogSlug(menuSlug)) {
    return false
  }
  const native = catalogSlugFromSchedulingCategoryId(category.id)
  return native === menuSlug
}

export function productSubCategoryAppearsUnderMenuSlug(
  category: Pick<
    ProductCategory,
    'id' | 'parentId' | 'productType' | 'catalogSlug' | 'placementCatalogSlug' | 'placementParentId'
  >,
  menuSlug: CatalogSlug,
  productRootId: string | undefined,
  schedulingOnly: boolean,
): boolean {
  const placement = normalizeCatalogSlug(category.placementCatalogSlug ?? null)
  if (placement) {
    if (placement !== menuSlug) return false
    if (isProductCatalogSlug(menuSlug) && productRootId) {
      return (category.placementParentId ?? null) === productRootId
    }
    if (isSchedulingCatalogSlug(menuSlug)) {
      return schedulingOnly && (category.placementParentId ?? null) === null
    }
    return true
  }

  if (isSchedulingCatalogSlug(menuSlug)) {
    return false
  }

  if (!productRootId) return false
  return (category.parentId ?? null) === productRootId
}

export function resolveCatalogMenuTarget(params: {
  readonly catalogSlug: CatalogSlug
  readonly productRootId: string | null
}): CatalogMenuTarget {
  if (isSchedulingCatalogSlug(params.catalogSlug)) {
    return {
      catalogSlug: params.catalogSlug,
      parentId: null,
      kind: 'scheduling',
    }
  }
  return {
    catalogSlug: params.catalogSlug,
    parentId: params.productRootId,
    kind: 'product',
  }
}

export function schedulingTopLevelPrefix(slug: CatalogSlug): string {
  const top = catalogSlugToSchedulingTopLevel(
    slug as 'gym' | 'play' | 'events',
  )
  switch (top) {
    case 'GYM':
      return 'cat-gym-'
    case 'PLAY':
      return 'cat-play-'
    default:
      return 'cat-event-'
  }
}

export function nativeProductRootProductType(root: Pick<ProductCategory, 'productType'>): string {
  return catalogSlugToProductType(catalogSlugFromProductType(root.productType))
}

export function getSchedulingTopLevelIdFromCategory(
  category: Pick<SchedulingCategory, 'id' | 'catalogSlug'>,
): ReturnType<typeof getSchedulingTopLevelId> {
  const slug = normalizeCatalogSlug(category.catalogSlug ?? null)
  if (slug && isSchedulingCatalogSlug(slug)) {
    return catalogSlugToSchedulingTopLevel(slug)
  }
  return getSchedulingTopLevelId(category.id)
}

export function enrichSchedulingCategory(category: SchedulingCategory): SchedulingCategory {
  const canonical = effectiveSchedulingCatalogSlug(category)
  return {
    ...category,
    catalogSlug: isSchedulingCatalogSlug(canonical) ? canonical : catalogSlugFromSchedulingCategoryId(category.id),
    placementCatalogSlug: category.placementCatalogSlug,
    placementParentId: category.placementParentId ?? null,
  }
}

export function enrichSchedulingCategories(
  categories: readonly SchedulingCategory[],
): SchedulingCategory[] {
  return categories.map((category) => enrichSchedulingCategory(category))
}

export function enrichProductCategory(
  category: ProductCategory,
  parent: ProductCategory | null,
): ProductCategory {
  const canonical =
    normalizeCatalogSlug(category.catalogSlug ?? null) ??
    (parent ? effectiveProductCategoryCatalogSlug(parent) : null) ??
    catalogSlugFromProductType(category.productType)
  const catalogSlug = isProductCatalogSlug(canonical)
    ? canonical
    : catalogSlugFromProductType(category.productType)
  return {
    ...category,
    catalogSlug,
    productType: category.productType ?? catalogSlugToProductType(catalogSlug),
    placementCatalogSlug: category.placementCatalogSlug,
    placementParentId: category.placementParentId ?? null,
  }
}

export function enrichProductCategories(
  categories: readonly ProductCategory[],
): ProductCategory[] {
  const byId = new Map(categories.map((category) => [category.id, category]))
  return categories.map((category) => {
    const parent =
      category.parentId != null ? byId.get(category.parentId) ?? null : null
    return enrichProductCategory(category, parent)
  })
}

/** Admin accordion bucket for a scheduling sub-category row. */
export function getSchedulingCategoryMenuBucket(
  category: Pick<
    SchedulingCategory,
    'id' | 'catalogSlug' | 'placementCatalogSlug' | 'placementParentId'
  >,
  productRootIdsBySlug: Readonly<Record<string, string | undefined>>,
): CatalogSlug {
  const placement = normalizeCatalogSlug(category.placementCatalogSlug ?? null)
  if (placement) return placement
  return catalogSlugFromSchedulingCategoryId(category.id)
}

/** Admin accordion bucket for a product sub-category row. */
export function getProductSubCategoryMenuBucket(
  category: Pick<
    ProductCategory,
    'id' | 'parentId' | 'productType' | 'catalogSlug' | 'placementCatalogSlug' | 'placementParentId'
  >,
  productRootIdsBySlug: Readonly<Record<string, string | undefined>>,
): CatalogSlug | null {
  const placement = normalizeCatalogSlug(category.placementCatalogSlug ?? null)
  if (placement) return placement
  const parentId = category.parentId ?? null
  if (!parentId) return null
  for (const entry of Object.entries(productRootIdsBySlug)) {
    if (entry[1] === parentId) {
      return normalizeCatalogSlug(entry[0]) ?? catalogSlugFromProductType(category.productType)
    }
  }
  return catalogSlugFromProductType(category.productType)
}

export function patchSchedulingCategoryPlacement(
  existing: SchedulingCategory,
  target: CatalogMenuTarget,
): Partial<SchedulingCategory> {
  const canonicalFromId = catalogSlugFromSchedulingCategoryId(existing.id)
  const canonicalFromField = normalizeCatalogSlug(existing.catalogSlug ?? null)
  const canonicalScheduling =
    canonicalFromField && isSchedulingCatalogSlug(canonicalFromField)
      ? canonicalFromField
      : isSchedulingCatalogSlug(canonicalFromId)
        ? canonicalFromId
        : canonicalFromId

  if (isProductCatalogSlug(target.catalogSlug)) {
    return {
      catalogSlug: canonicalScheduling,
      placementCatalogSlug: target.catalogSlug,
      placementParentId: target.parentId,
    }
  }

  if (isSchedulingCatalogSlug(target.catalogSlug)) {
    const hadProductPlacement =
      normalizeCatalogSlug(existing.placementCatalogSlug ?? null) != null &&
      isProductCatalogSlug(
        normalizeCatalogSlug(existing.placementCatalogSlug ?? null) as CatalogSlug,
      )
    if (canonicalScheduling !== target.catalogSlug || hadProductPlacement) {
      return {
        catalogSlug: canonicalScheduling,
        placementCatalogSlug:
          canonicalScheduling === target.catalogSlug ? undefined : target.catalogSlug,
        placementParentId: null,
      }
    }
    return {
      catalogSlug: target.catalogSlug,
      placementCatalogSlug: undefined,
      placementParentId: null,
    }
  }

  return {
    catalogSlug: canonicalScheduling,
    placementCatalogSlug: undefined,
    placementParentId: null,
  }
}

export function patchProductSubCategoryPlacement(
  existing: ProductCategory,
  target: CatalogMenuTarget,
  nativeParentId: string | null,
): Partial<ProductCategory> {
  const canonical = effectiveProductCategoryCatalogSlug(existing)

  if (isSchedulingCatalogSlug(target.catalogSlug)) {
    return {
      catalogSlug: canonical,
      productType: catalogSlugToProductType(canonical),
      placementCatalogSlug: target.catalogSlug,
      placementParentId: null,
    }
  }

  if (!isProductCatalogSlug(target.catalogSlug)) {
    return {
      catalogSlug: canonical,
      productType: catalogSlugToProductType(canonical),
    }
  }

  const rootId = target.parentId ?? nativeParentId
  return {
    catalogSlug: canonical,
    productType: catalogSlugToProductType(canonical),
    placementCatalogSlug: target.catalogSlug,
    placementParentId: rootId,
    parentId: rootId ?? existing.parentId,
  }
}

export type ProductCategoryPlacementFields = Pick<
  ProductCategory,
  | 'id'
  | 'parentId'
  | 'productType'
  | 'catalogSlug'
  | 'placementCatalogSlug'
  | 'placementParentId'
>

/** Map product catalog slug → root category id (first root per slug). */
export function buildProductRootIdsBySlug(
  categories: readonly Pick<ProductCategory, 'id' | 'parentId' | 'productType'>[],
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {}
  for (const category of categories) {
    if ((category.parentId ?? null) !== null) {
      continue
    }
    const slug = catalogSlugFromProductType(category.productType ?? 'shop')
    if (out[slug] == null) {
      out[slug] = category.id
    }
  }
  return out
}

export function customerMenuSlugFromProductType(
  productType: string,
): ProductCatalogSlug | null {
  const slug =
    normalizeCatalogSlug(productType) ?? catalogSlugFromProductType(productType)
  return isProductCatalogSlug(slug) ? slug : null
}

/**
 * Whether a category row should appear on a customer store/rentals menu
 * (uses placement when set, otherwise native productType / parentId).
 */
export function productCategoryAppearsOnCustomerMenu(
  category: ProductCategoryPlacementFields,
  productType: string,
  productRootIdsBySlug: Readonly<Record<string, string | undefined>>,
): boolean {
  const menuSlug = customerMenuSlugFromProductType(productType)
  if (!menuSlug) {
    return false
  }

  const parentId = category.parentId ?? null
  if (parentId === null) {
    const placement = normalizeCatalogSlug(category.placementCatalogSlug ?? null)
    if (placement) {
      if (placement !== menuSlug) {
        return false
      }
      const expectedRoot = productRootIdsBySlug[menuSlug]
      return expectedRoot != null && (category.placementParentId ?? null) === expectedRoot
    }
    return catalogSlugFromProductType(category.productType ?? 'shop') === menuSlug
  }

  return productSubCategoryAppearsUnderMenuSlug(
    category,
    menuSlug,
    productRootIdsBySlug[menuSlug],
    false,
  )
}

export type SchedulingCategoryPlacementFields = Pick<
  SchedulingCategory,
  'id' | 'catalogSlug' | 'placementCatalogSlug' | 'placementParentId'
>

/** Customer Gym / Play / Events menu for a scheduling sub-category (placement-aware). */
export function getCustomerSchedulingMenuSlug(
  category: SchedulingCategoryPlacementFields,
): SchedulingCatalogSlug | null {
  const placement = normalizeCatalogSlug(category.placementCatalogSlug ?? null)
  if (placement) {
    if (isSchedulingCatalogSlug(placement)) {
      return placement
    }
    return null
  }
  const native = catalogSlugFromSchedulingCategoryId(category.id)
  return isSchedulingCatalogSlug(native) ? native : null
}

export function schedulingCategoryAppearsOnCustomerSchedulingMenu(
  category: SchedulingCategoryPlacementFields,
  menuSlug: SchedulingCatalogSlug,
  productRootIdsBySlug: Readonly<Record<string, string | undefined>> = {},
): boolean {
  return schedulingCategoryAppearsUnderMenuSlug(
    category,
    menuSlug,
    productRootIdsBySlug,
  )
}

/** Whether a scheduling sub-category is placed on a customer store menu (Gifts, Shop, etc.). */
export function schedulingCategoryAppearsOnCustomerProductMenu(
  category: SchedulingCategoryPlacementFields,
  productType: string,
  productRootIdsBySlug: Readonly<Record<string, string | undefined>>,
  productCategories: readonly Pick<ProductCategory, 'id' | 'parentId' | 'productType'>[] = [],
): boolean {
  const menuSlug = customerMenuSlugFromProductType(productType)
  if (!menuSlug) {
    return false
  }
  return schedulingCategoryAppearsUnderMenuSlug(
    category,
    menuSlug,
    productRootIdsBySlug,
    productCategories,
  )
}

export function getCustomerProductMenuSlug(
  category: SchedulingCategoryPlacementFields,
  productRootIdsBySlug: Readonly<Record<string, string | undefined>> = {},
  productCategories: readonly Pick<ProductCategory, 'id' | 'parentId' | 'productType'>[] = [],
): ProductCatalogSlug | null {
  const placement = normalizeCatalogSlug(category.placementCatalogSlug ?? null)
  if (!placement || !isProductCatalogSlug(placement)) {
    return null
  }
  const expectedRoot = productRootIdsBySlug[placement]
  if (
    !schedulingPlacementParentMatchesProductMenu(
      category.placementParentId ?? null,
      placement,
      expectedRoot,
      productCategories,
    )
  ) {
    return null
  }
  return placement
}

/** Patch scheduling rows placed on product menus so placementParentId matches the menu root. */
export function repairSchedulingCategoryProductPlacement<
  T extends Pick<
    SchedulingCategory,
    'placementCatalogSlug' | 'placementParentId' | 'catalogSlug'
  >,
>(
  category: T,
  productRootIdsBySlug: Readonly<Record<string, string | undefined>>,
): T {
  const placement = normalizeCatalogSlug(category.placementCatalogSlug ?? null)
  if (!placement || !isProductCatalogSlug(placement)) {
    return category
  }
  const expectedRoot = productRootIdsBySlug[placement]
  if (!expectedRoot) {
    return category
  }
  if ((category.placementParentId ?? null) === expectedRoot) {
    return category
  }
  return {
    ...category,
    placementParentId: expectedRoot,
  }
}

export function findProductCategoryBySlugOnCustomerMenu(
  categories: readonly ProductCategory[],
  categorySlug: string,
  productType: string,
): ProductCategory | undefined {
  const productRootIdsBySlug = buildProductRootIdsBySlug(categories)
  return categories.find(
    (category) =>
      category.slug === categorySlug &&
      productCategoryAppearsOnCustomerMenu(category, productType, productRootIdsBySlug),
  )
}
