/** Canonical product catalog slug resolution for admin editors and customer guards. */

import {
  catalogSlugFromProductType,
  catalogSlugToProductType,
  normalizeCatalogSlug,
  type ProductCatalogSlug,
  type ProductEditorSlug,
} from '@/lib/catalog-slugs'
import { isGiftProduct } from '@/lib/gift-product'
import { isRentalProduct } from '@/lib/rental-product'
import {
  resolveTakeOutPartyCategory,
  usesTakeOutPartyCafeFoodEditor,
} from '@/lib/take-out-party-catalog'
import type { Product, ProductCategory } from '@/lib/types'

type ProductCategoryEditorFields = Pick<
  ProductCategory,
  'id' | 'slug' | 'parentId' | 'productType' | 'catalogSlug'
>

export type { ProductEditorSlug }

function slugFromCategory(
  category: Pick<ProductCategory, 'productType' | 'catalogSlug'> | null | undefined,
): ProductEditorSlug | null {
  if (!category) return null
  const fromCatalog = normalizeCatalogSlug(category.catalogSlug ?? null)
  if (fromCatalog && (fromCatalog === 'shop' || fromCatalog === 'gifts' || fromCatalog === 'rentals' || fromCatalog === 'cafe-food')) {
    return fromCatalog
  }
  return catalogSlugFromProductType(category.productType)
}

/**
 * Resolves which admin product editor to use — based on canonical product type,
 * not admin menu placement.
 */
export function resolveProductEditorSlug(
  product: Pick<Product, 'id' | 'productType' | 'categoryId' | 'isRental' | 'giftProductIds'>,
  category?: ProductCategoryEditorFields | null,
  productCategories?: ReadonlyArray<ProductCategoryEditorFields>,
): ProductEditorSlug {
  const resolvedCategory =
    category ?? resolveTakeOutPartyCategory(product, productCategories)
  if (usesTakeOutPartyCafeFoodEditor(resolvedCategory, productCategories)) {
    return 'cafe-food'
  }

  const fromProduct = normalizeCatalogSlug(product.productType ?? null)
  if (
    fromProduct &&
    (fromProduct === 'shop' ||
      fromProduct === 'gifts' ||
      fromProduct === 'rentals' ||
      fromProduct === 'cafe-food')
  ) {
    return fromProduct
  }

  if (isRentalProduct(product)) return 'rentals'
  if (isGiftProduct(product, productCategories)) return 'gifts'

  const fromCategory = slugFromCategory(resolvedCategory)
  if (fromCategory) return fromCategory

  return 'shop'
}

export function productTypeFromEditorSlug(slug: ProductEditorSlug): string {
  return catalogSlugToProductType(slug)
}

export function canonicalProductTypeForCreate(
  queryProductType: string | undefined,
  category: Pick<ProductCategory, 'productType' | 'catalogSlug'> | null | undefined,
): string {
  const fromQuery = normalizeCatalogSlug(queryProductType ?? null)
  if (
    fromQuery &&
    (fromQuery === 'shop' ||
      fromQuery === 'gifts' ||
      fromQuery === 'rentals' ||
      fromQuery === 'cafe-food')
  ) {
    return catalogSlugToProductType(fromQuery)
  }
  const fromCategory = slugFromCategory(category ?? null)
  if (fromCategory) return catalogSlugToProductType(fromCategory)
  return 'shop'
}

export function catalogSlugFromProduct(
  product: Pick<Product, 'id' | 'productType' | 'categoryId' | 'isRental' | 'giftProductIds'>,
  category?: Pick<ProductCategory, 'productType' | 'catalogSlug'> | null,
  productCategories?: ReadonlyArray<Pick<ProductCategory, 'id' | 'productType' | 'catalogSlug'>>,
): ProductCatalogSlug {
  return resolveProductEditorSlug(product, category, productCategories)
}

export function enrichProductWithCanonicalType(
  product: Product,
  categoryById: ReadonlyMap<string, Pick<ProductCategory, 'productType' | 'catalogSlug'>>,
  productCategories?: ReadonlyArray<Pick<ProductCategory, 'id' | 'productType' | 'catalogSlug'>>,
): Product {
  const category = categoryById.get(product.categoryId) ?? null
  const editorSlug = resolveProductEditorSlug(product, category, productCategories)
  return {
    ...product,
    productType: product.productType ?? catalogSlugToProductType(editorSlug),
  }
}
