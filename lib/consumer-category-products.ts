/** Product ids for a sub-category using the same rules as its native customer menu. */

import {
  cafeProductIdsForInventoryCategory,
  cafeProductToInventoryProduct,
  filterCafeProducts,
  isCafeCatalogProductId,
  mergedCafeProductsForCustomer,
  resolveInventoryCategoryId,
} from '@/lib/cafe-utils'
import { collectTakeOutPartyCategoryIds, TAKE_OUT_PARTY_ROOT_CATEGORY_ID } from '@/lib/take-out-party-catalog'
import {
  buildProductCategoryById,
  isConsumerVisibleProduct,
  isShopCatalogVisibleProduct,
  type ProductCategoryVisibilityFields,
} from '@/lib/product-visibility'
import type { CafeProduct, Product, ProductCategory } from '@/lib/types'

export interface ConsumerProductsForCategoryParams {
  readonly category: ProductCategory
  readonly products: readonly Product[]
  readonly productCategories: readonly ProductCategory[]
  readonly cafeProducts?: readonly CafeProduct[]
  readonly todayDayIndex?: number
}

function isProductVisibleForNativeMenu(
  productType: string,
  product: Pick<Product, 'isActive' | 'availableOnline' | 'categoryId'>,
  categoryById: ReadonlyMap<string, ProductCategoryVisibilityFields>,
): boolean {
  if (productType === 'shop') {
    return isShopCatalogVisibleProduct(product, categoryById)
  }
  return isConsumerVisibleProduct(product, categoryById)
}

/** Cafe & Food store section — excludes party/event add-on inventory rows. */
export function consumerCafeProductIdsForInventoryCategory(
  inventoryCategoryId: string,
  params: {
    readonly products: readonly Product[]
    readonly productCategories: readonly ProductCategory[]
    readonly cafeProducts: readonly CafeProduct[]
    readonly todayDayIndex?: number
  },
): string[] {
  const categoryById = buildProductCategoryById(params.productCategories)
  const categoriesById = new Map(
    params.productCategories.map((category) => [category.id, category]),
  )
  const today = params.todayDayIndex ?? new Date().getDay()
  const customerCafeProducts = mergedCafeProductsForCustomer(
    [...params.cafeProducts],
    [...params.products],
    [...params.productCategories],
  )
  const eligible = filterCafeProducts(customerCafeProducts, today)
  const eligibleIdSet = new Set(
    [...eligible.visible, ...eligible.soldOut].map((product) => product.id),
  )

  const takeOutTreeIds =
    inventoryCategoryId === TAKE_OUT_PARTY_ROOT_CATEGORY_ID
      ? collectTakeOutPartyCategoryIds(params.productCategories)
      : null

  const directProducts = params.products
    .filter(
      (product) =>
        isConsumerVisibleProduct(product, categoryById) &&
        product.categoryId === inventoryCategoryId &&
        isCafeCatalogProductId(product.id),
    )
    .map((product) => product.id)
  const childProducts = params.products
    .filter((product) => {
      if (!isConsumerVisibleProduct(product, categoryById)) {
        return false
      }
      if (!isCafeCatalogProductId(product.id)) {
        return false
      }
      if (takeOutTreeIds?.has(product.categoryId)) {
        return true
      }
      const childCategory = categoriesById.get(product.categoryId)
      return childCategory?.parentId === inventoryCategoryId
    })
    .map((product) => product.id)
  const inventoryIds = directProducts.length > 0 ? directProducts : childProducts
  const cafeStoreIds = cafeProductIdsForInventoryCategory(
    inventoryCategoryId,
    eligible.visible,
    params.productCategories,
  )
  const soldOutCafeIds = cafeProductIdsForInventoryCategory(
    inventoryCategoryId,
    eligible.soldOut,
    params.productCategories,
  )

  return [...new Set([...inventoryIds, ...cafeStoreIds, ...soldOutCafeIds])].filter((productId) =>
    eligibleIdSet.has(productId),
  )
}

/** Shop / gifts / rentals store section — direct products, else children of this category. */
function resolveNativeProductType(
  category: ProductCategory,
  categoriesById: ReadonlyMap<string, ProductCategory>,
): string {
  if (category.productType) {
    return category.productType
  }
  const parentId = category.parentId ?? null
  if (!parentId) {
    return 'shop'
  }
  const parent = categoriesById.get(parentId)
  return parent?.productType ?? 'shop'
}

function consumerStoreProductIdsForCategory(
  category: ProductCategory,
  products: readonly Product[],
  productCategories: readonly ProductCategory[],
): string[] {
  const categoryById = buildProductCategoryById(productCategories)
  const categoriesById = buildProductCategoryById(productCategories)
  const nativeProductType = resolveNativeProductType(category, categoriesById)
  const isVisible = (product: Product) =>
    isProductVisibleForNativeMenu(nativeProductType, product, categoryById)

  const directProducts = products
    .filter((product) => isVisible(product) && product.categoryId === category.id)
    .map((product) => product.id)
  const childProducts = products
    .filter((product) => {
      if (!isVisible(product)) {
        return false
      }
      const childCategory = categoriesById.get(product.categoryId)
      return childCategory?.parentId === category.id
    })
    .map((product) => product.id)

  return directProducts.length > 0 ? directProducts : childProducts
}

/** Ids listed on the category's native menu (cafe, shop, gifts, rentals). */
export function consumerProductIdsForCategory(
  params: ConsumerProductsForCategoryParams,
): string[] {
  if (params.category.productType === 'cafe&food') {
    return consumerCafeProductIdsForInventoryCategory(params.category.id, {
      products: params.products,
      productCategories: params.productCategories,
      cafeProducts: params.cafeProducts ?? [],
      todayDayIndex: params.todayDayIndex,
    })
  }

  return consumerStoreProductIdsForCategory(
    params.category,
    params.products,
    params.productCategories,
  )
}

export function consumerProductsForCategory(
  params: ConsumerProductsForCategoryParams,
): Product[] {
  const idSet = new Set(consumerProductIdsForCategory(params))
  const fromInventory = params.products.filter((product) => idSet.has(product.id))
  if (params.category.productType !== 'cafe&food' || (params.cafeProducts?.length ?? 0) === 0) {
    return fromInventory
  }

  const foundIds = new Set(fromInventory.map((product) => product.id))
  const missingIds = [...idSet].filter((id) => !foundIds.has(id))
  if (missingIds.length === 0) {
    return fromInventory
  }

  const customerCafeProducts = mergedCafeProductsForCustomer(
    [...(params.cafeProducts ?? [])],
    [...params.products],
    [...params.productCategories],
  )
  const tenantId = params.products[0]?.tenantId ?? 'tenant-1'
  const cafeAsProducts = customerCafeProducts
    .filter((cafeProduct) => missingIds.includes(cafeProduct.id))
    .map((cafeProduct) =>
      cafeProductToInventoryProduct(
        cafeProduct,
        resolveInventoryCategoryId(cafeProduct.category, params.productCategories),
        tenantId,
      ),
    )

  return [...fromInventory, ...cafeAsProducts]
}
