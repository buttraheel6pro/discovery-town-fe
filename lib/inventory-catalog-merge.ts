/** Reconcile persisted inventory catalog with mock seed (placement + cafe/rental types). */

import { enrichProductCategories } from '@/lib/catalog-placement'
import { enrichProductWithCanonicalType } from '@/lib/product-catalog'
import {
  TAKE_OUT_PARTY_PRODUCT_IDS,
  TAKE_OUT_PARTY_ROOT_CATEGORY_ID,
  TAKE_OUT_PARTY_SUBCATEGORY_IDS,
} from '@/lib/take-out-party-catalog'
import { WE_BRING_PLAY_RENTAL_CATEGORY_ID } from '@/lib/we-bring-play-rental-products'
import type { InventoryState } from '@/lib/redux/slices/inventory-slice'
import type { Product, ProductCategory } from '@/lib/types'

const CATALOG_SYNC_CATEGORY_IDS: readonly string[] = [
  TAKE_OUT_PARTY_ROOT_CATEGORY_ID,
  ...TAKE_OUT_PARTY_SUBCATEGORY_IDS,
  WE_BRING_PLAY_RENTAL_CATEGORY_ID,
]

const CATALOG_SYNC_PRODUCT_IDS: readonly string[] = [...TAKE_OUT_PARTY_PRODUCT_IDS]

const RETIRED_TAKEOUT_PRODUCT_ID_PREFIX = 'prod-takeout-'

function withDefaultCategoryActive(category: ProductCategory): ProductCategory {
  return {
    ...category,
    isActive: category.isActive ?? true,
  }
}

export function buildSeedProductCategories(
  baseCategories: readonly ProductCategory[],
): ProductCategory[] {
  return enrichProductCategories(
    baseCategories.map((category) => withDefaultCategoryActive({ ...category })),
  )
}

function mergeProductCategoriesWithSeed(
  persisted: readonly ProductCategory[],
  seed: readonly ProductCategory[],
): ProductCategory[] {
  const seedById = new Map(seed.map((category) => [category.id, category]))
  const persistedIds = new Set(persisted.map((category) => category.id))

  const merged = persisted.map((category) => {
    const seedRow = seedById.get(category.id)
    if (!seedRow || !CATALOG_SYNC_CATEGORY_IDS.includes(category.id)) {
      return withDefaultCategoryActive({ ...category })
    }
    return withDefaultCategoryActive({
      ...category,
      name: seedRow.name,
      slug: seedRow.slug,
      description: seedRow.description,
      displayOrder: seedRow.displayOrder,
      productType: seedRow.productType,
      catalogSlug: seedRow.catalogSlug,
      placementCatalogSlug: seedRow.placementCatalogSlug ?? null,
      placementParentId: seedRow.placementParentId ?? null,
      parentId: seedRow.parentId,
      isActive: seedRow.isActive ?? true,
    })
  })

  for (const seedRow of seed) {
    if (!persistedIds.has(seedRow.id)) {
      merged.push(withDefaultCategoryActive({ ...seedRow }))
    }
  }

  return enrichProductCategories(merged)
}

function mergeProductsWithSeed(
  persisted: readonly Product[],
  seed: readonly Product[],
  productCategories: readonly ProductCategory[],
): Product[] {
  const categoryById = new Map(productCategories.map((category) => [category.id, category]))
  const seedById = new Map(seed.map((product) => [product.id, product]))
  const withoutRetired = persisted.filter(
    (product) => !product.id.startsWith(RETIRED_TAKEOUT_PRODUCT_ID_PREFIX),
  )

  const merged = withoutRetired.map((product) => {
    const seedRow = seedById.get(product.id)
    if (!seedRow || !CATALOG_SYNC_PRODUCT_IDS.includes(product.id)) {
      return product
    }
    return enrichProductWithCanonicalType(
      { ...product, ...seedRow, id: product.id },
      categoryById,
      productCategories,
    )
  })

  const mergedIds = new Set(merged.map((product) => product.id))
  for (const seedRow of seed) {
    if (!mergedIds.has(seedRow.id) && CATALOG_SYNC_PRODUCT_IDS.includes(seedRow.id)) {
      merged.push(
        enrichProductWithCanonicalType(
          seedRow,
          categoryById,
          productCategories,
        ),
      )
    }
  }

  return merged
}

/** Applies mock placement + Take Out Party cafe rows onto persisted inventory state. */
export function mergeInventoryWithCatalogDefaults(
  persisted: InventoryState,
  seed: InventoryState,
): InventoryState {
  const productCategories = mergeProductCategoriesWithSeed(
    persisted.productCategories,
    seed.productCategories,
  )
  const products = mergeProductsWithSeed(
    persisted.products,
    seed.products,
    productCategories,
  )

  return {
    productCategories,
    products,
    bookingAddOns: persisted.bookingAddOns,
  }
}
