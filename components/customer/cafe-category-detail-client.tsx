/** Cafe category detail — hero and navigable product list (detail pages handle ordering). */
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
import type { CafeConsumerCategory } from '@/lib/cafe-consumer-categories'
import {
  CAFE_CATEGORY_DESCRIPTIONS,
  resolveCafeCategoryCardMeta,
} from '@/lib/cafe-category-meta'
import { cafeProductIdsForInventoryCategory, filterCafeProducts } from '@/lib/cafe-utils'
import { getCafeCategoryHref } from '@/lib/cafe-category-routes'
import { useCafePageProducts } from '@/lib/hooks/use-cafe-page-products'
import { buildProductDetailHref } from '@/lib/product-detail-navigation'
import { useCafe } from '@/lib/cafe-store'
import { useInventory } from '@/lib/inventory-store'
import type { CafeProduct } from '@/lib/types'

function mapCafeProductToListItem(
  product: CafeProduct,
  category: CafeConsumerCategory,
): RentalProductListItem {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    imageUrl: product.imageUrl,
    price: product.basePrice,
    href: buildProductDetailHref(product.id, getCafeCategoryHref(category.slug)),
  }
}

export interface CafeCategoryDetailClientProps {
  readonly category: CafeConsumerCategory
  readonly categoryIndex?: number
}

export function CafeCategoryDetailClient({
  category,
  categoryIndex = 0,
}: Readonly<CafeCategoryDetailClientProps>) {
  const { cafeProducts } = useCafe()
  const { productCategories } = useInventory()
  const today = useMemo(() => new Date().getDay(), [])

  const categoryMeta = useMemo(
    () => resolveCafeCategoryCardMeta(category, categoryIndex),
    [category, categoryIndex],
  )

  const categoryDescription =
    CAFE_CATEGORY_DESCRIPTIONS[category.id] ??
    category.description ??
    'Browse drinks, bites, and cafe favorites at Discovery Town.'

  const mockProducts = useMemo(() => {
    const productIds = new Set(
      cafeProductIdsForInventoryCategory(category.id, cafeProducts, productCategories),
    )
    const inCategory = cafeProducts.filter((product) => productIds.has(product.id))
    const { visible, soldOut } = filterCafeProducts(inCategory, today)
    return [...visible, ...soldOut]
  }, [category.id, cafeProducts, productCategories, today])

  const { sectionMap } = useCafePageProducts(
    useMemo(
      () => [{ id: category.id, name: category.name, displayOrder: category.displayOrder }],
      [category],
    ),
  )

  const listItems = useMemo((): RentalProductListItem[] => {
    if (!isApiEnabled) {
      return mockProducts.map((product) => mapCafeProductToListItem(product, category))
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
      href: buildProductDetailHref(product.id, getCafeCategoryHref(category.slug)),
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
        badgeLabel="Cafe & Food"
        imageSrc={categoryMeta.imageSrc}
        description={categoryDescription}
        backHref="/cafe"
        backLabel="Back to Cafe & Food"
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
          <div className={`lg:col-span-2 ${PLAY_SERVICE_LIST_HEIGHT_CLASS}`}>
            {!listIsLoading && listItems.length === 0 ? (
              <CatalogEmptyState
                {...catalogSectionEmptyStateProps('cafe & food', {
                  backHref: '/cafe',
                  backLabel: 'Back to Cafe & Food',
                })}
              />
            ) : (
              <RentalProductNameList
                items={listItems}
                isLoading={listIsLoading}
                categoryName={category.name}
                listHeadingSuffix="menu items"
                listDescription="Select an item to customize and add to cart. Hover the image for a preview."
                emptyMessage="No menu items available in this category yet."
                listAriaLabel={`${category.name} cafe menu`}
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
