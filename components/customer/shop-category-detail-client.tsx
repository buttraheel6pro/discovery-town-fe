/** Shop category detail — hero and navigable product list. */
'use client'

import { useMemo } from 'react'

import { PLAY_SERVICE_LIST_HEIGHT_CLASS } from '@/components/customer/play-facility-booking-provider'
import {
  CatalogEmptyState,
  catalogSectionEmptyStateProps,
} from '@/components/customer/catalog-empty-state'
import { ProductCategoryDetailHero } from '@/components/customer/product-category-detail-hero'
import {
  RentalProductNameList,
  type RentalProductListItem,
} from '@/components/customer/rental-product-name-list'
import { SchedulingEmptyCartCard } from '@/components/customer/scheduling-empty-cart-card'
import { isApiEnabled } from '@/lib/api/client'
import { useShopPageProducts } from '@/lib/hooks/use-shop-page-products'
import type { ShopConsumerCategory } from '@/lib/shop-consumer-categories'
import {
  SHOP_CATEGORY_DESCRIPTIONS,
  resolveShopCategoryCardMeta,
} from '@/lib/shop-category-meta'
import {
  buildProductCategoryById,
  isShopCatalogVisibleProduct,
} from '@/lib/product-visibility'
import { getShopCategoryHref } from '@/lib/shop-category-routes'
import { buildProductDetailHref } from '@/lib/product-detail-navigation'
import { useInventory } from '@/lib/inventory-store'
import type { Product } from '@/lib/types'

function mapProductToListItem(
  product: Product,
  category: ShopConsumerCategory,
): RentalProductListItem {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    imageUrl: product.imageUrl,
    price: product.memberPrice ?? product.price,
    href: buildProductDetailHref(product.id, getShopCategoryHref(category.slug)),
  }
}

export interface ShopCategoryDetailClientProps {
  readonly category: ShopConsumerCategory
  readonly categoryIndex?: number
}

export function ShopCategoryDetailClient({
  category,
  categoryIndex = 0,
}: Readonly<ShopCategoryDetailClientProps>) {
  const { products, productCategories } = useInventory()

  const categoryMeta = useMemo(
    () => resolveShopCategoryCardMeta(category, categoryIndex),
    [category, categoryIndex],
  )

  const categoryDescription =
    SHOP_CATEGORY_DESCRIPTIONS[category.id] ??
    category.description ??
    'Browse official Discovery Town merchandise and essentials.'

  const categoryById = useMemo(
    () => buildProductCategoryById(productCategories),
    [productCategories],
  )

  const mockProducts = useMemo(
    () =>
      products
        .filter(
          (product) =>
            product.categoryId === category.id &&
            isShopCatalogVisibleProduct(product, categoryById),
        )
        .sort((left, right) => Number(right.isFeatured) - Number(left.isFeatured)),
    [category.id, categoryById, products],
  )

  const { sectionMap } = useShopPageProducts(
    useMemo(
      () => [{ id: category.id, name: category.name, displayOrder: category.displayOrder }],
      [category],
    ),
  )

  const listItems = useMemo((): RentalProductListItem[] => {
    if (!isApiEnabled) {
      return mockProducts.map((product) => mapProductToListItem(product, category))
    }

    const section = sectionMap.get(category.id)
    if (!section || section.isLoading) {
      return []
    }

    return section.products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      price: product.price,
      href: buildProductDetailHref(product.id, getShopCategoryHref(category.slug)),
    }))
  }, [category.id, mockProducts, sectionMap])

  const listIsLoading = useMemo(() => {
    if (!isApiEnabled) {
      return false
    }
    const section = sectionMap.get(category.id)
    return section?.isLoading ?? true
  }, [category.id, sectionMap])

  return (
    <>
      <ProductCategoryDetailHero
        name={category.name}
        badgeLabel="Shop"
        imageSrc={categoryMeta.imageSrc}
        description={categoryDescription}
        backHref="/shop"
        backLabel="Back to Shop"
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
          <div className={`lg:col-span-2 ${PLAY_SERVICE_LIST_HEIGHT_CLASS}`}>
            {!listIsLoading && listItems.length === 0 ? (
              <CatalogEmptyState
                {...catalogSectionEmptyStateProps('shop', {
                  backHref: '/shop',
                  backLabel: 'Back to Shop',
                })}
              />
            ) : (
              <RentalProductNameList
                items={listItems}
                isLoading={listIsLoading}
                categoryName={category.name}
                listHeadingSuffix="products"
                listDescription="Select a product to view details and add to cart. Hover the image for a preview."
                emptyMessage="No products available in this category yet."
                listAriaLabel={`${category.name} shop products`}
              />
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
            <SchedulingEmptyCartCard />
          </aside>
        </div>
      </div>
    </>
  )
}
