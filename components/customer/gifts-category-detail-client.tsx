/** Gifts category detail — hero and navigable product list. */
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
import { useGiftsPageProducts } from '@/lib/hooks/use-gifts-page-products'
import type { GiftsConsumerCategory } from '@/lib/gifts-consumer-categories'
import {
  GIFTS_CATEGORY_DESCRIPTIONS,
  resolveGiftsCategoryCardMeta,
} from '@/lib/gifts-category-meta'
import {
  buildProductCategoryById,
  isConsumerVisibleProduct,
} from '@/lib/product-visibility'
import { getGiftsCategoryHref } from '@/lib/gifts-category-routes'
import { buildProductDetailHref } from '@/lib/product-detail-navigation'
import { useInventory } from '@/lib/inventory-store'
import type { Product } from '@/lib/types'

function mapProductToListItem(
  product: Product,
  category: GiftsConsumerCategory,
): RentalProductListItem {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    imageUrl: product.imageUrl,
    price: product.memberPrice ?? product.price,
    href: buildProductDetailHref(product.id, getGiftsCategoryHref(category.slug)),
  }
}

export interface GiftsCategoryDetailClientProps {
  readonly category: GiftsConsumerCategory
  readonly categoryIndex?: number
}

export function GiftsCategoryDetailClient({
  category,
  categoryIndex = 0,
}: Readonly<GiftsCategoryDetailClientProps>) {
  const { products, productCategories } = useInventory()

  const categoryMeta = useMemo(
    () => resolveGiftsCategoryCardMeta(category, categoryIndex),
    [category, categoryIndex],
  )

  const categoryDescription =
    GIFTS_CATEGORY_DESCRIPTIONS[category.id] ??
    category.description ??
    'Browse curated gift bundles and treats from Discovery Town.'

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
            isConsumerVisibleProduct(product, categoryById),
        )
        .sort((left, right) => Number(right.isFeatured) - Number(left.isFeatured)),
    [category.id, categoryById, products],
  )

  const { sectionMap } = useGiftsPageProducts(
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
      href: buildProductDetailHref(product.id, getGiftsCategoryHref(category.slug)),
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
        badgeLabel="Gifts"
        imageSrc={categoryMeta.imageSrc}
        description={categoryDescription}
        backHref="/gifts"
        backLabel="Back to Gifts"
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
          <div className={`lg:col-span-2 ${PLAY_SERVICE_LIST_HEIGHT_CLASS}`}>
            {!listIsLoading && listItems.length === 0 ? (
              <CatalogEmptyState
                {...catalogSectionEmptyStateProps('gifts', {
                  backHref: '/gifts',
                  backLabel: 'Back to Gifts',
                })}
              />
            ) : (
              <RentalProductNameList
                items={listItems}
                isLoading={listIsLoading}
                categoryName={category.name}
                listHeadingSuffix="gifts"
                listDescription="Select a gift to view details and add to cart. Hover the image for a preview."
                emptyMessage="No gifts available in this category yet."
                listAriaLabel={`${category.name} gift products`}
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
