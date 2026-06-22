/**
 * Shop menu page — horizontal-scroll rails per product category, batch-loaded
 * in parallel on first render (10 items each), with auto load-more at rail end.
 */
'use client'

import { useEffect, useMemo, useState } from 'react'

import { HorizontalScrollSection } from '@/components/customer/horizontal-scroll-section'
import { CatalogEmptyState } from '@/components/customer/catalog-empty-state'
import { ShopProductScrollCard } from '@/components/customer/shop-product-scroll-card'
import { ShopProductScrollCardSkeleton } from '@/components/customer/shop-product-scroll-card-skeleton'
import { isApiEnabled } from '@/lib/api/client'
import { isMockDataEnabled } from '@/lib/config/data-source'
import {
  fetchShopCategories,
  type ShopPublicProduct,
  type ShopPublicCategory,
} from '@/lib/api/shop.api'
import { useShopPageProducts, type ShopCategory } from '@/lib/hooks/use-shop-page-products'

// Static fallback category list (matches seed-shop.sql IDs)
const STATIC_SHOP_CATEGORIES: ShopPublicCategory[] = [
  { id: 'pcat-shop-apparel',     name: 'Apparel',            displayOrder: 1,  isActive: true },
  { id: 'pcat-shop-headwear',    name: 'Headwear',           displayOrder: 2,  isActive: true },
  { id: 'pcat-shop-gear',        name: 'Equipment & Gear',   displayOrder: 3,  isActive: true },
  { id: 'pcat-shop-footwear',    name: 'Footwear',           displayOrder: 4,  isActive: true },
  { id: 'pcat-shop-bags',        name: 'Bags & Backpacks',   displayOrder: 5,  isActive: true },
  { id: 'pcat-shop-water',       name: 'Bottles & Hydration',displayOrder: 6,  isActive: true },
  { id: 'pcat-shop-toys',        name: 'Toys & Games',       displayOrder: 7,  isActive: true },
  { id: 'pcat-shop-accessories', name: 'Accessories',        displayOrder: 8,  isActive: true },
  { id: 'pcat-shop-wellness',    name: 'Wellness',           displayOrder: 9,  isActive: true },
  { id: 'pcat-shop-gifts',       name: 'Gift Sets',          displayOrder: 10, isActive: true },
]

const SKELETONS = Array.from({ length: 5 }, (_, i) => i)

// ─── Category section ─────────────────────────────────────────────────────────

interface ShopCategorySectionProps {
  readonly category: ShopCategory
  readonly products: ShopPublicProduct[]
  readonly isLoading: boolean
  readonly isLoadingMore: boolean
  readonly hasMore: boolean
  readonly onLoadMore: () => void
}

function ShopCategorySection({
  category,
  products,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
}: ShopCategorySectionProps) {
  return (
    <HorizontalScrollSection
      title={category.name}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      onLoadMore={onLoadMore}
      autoLoadMore
    >
      {isLoading
        ? SKELETONS.map((i) => <ShopProductScrollCardSkeleton key={i} />)
        : products.map((product) => (
            <ShopProductScrollCard key={product.id} product={product} />
          ))}
    </HorizontalScrollSection>
  )
}

// ─── Page client ──────────────────────────────────────────────────────────────

export function ShopMenuClient() {
  const [categories, setCategories] = useState<ShopPublicCategory[]>([])
  const [categoriesReady, setCategoriesReady] = useState(false)

  useEffect(() => {
    if (isMockDataEnabled()) {
      setCategories(STATIC_SHOP_CATEGORIES)
      setCategoriesReady(true)
      return
    }
    if (!isApiEnabled) {
      setCategories([])
      setCategoriesReady(true)
      return
    }
    fetchShopCategories()
      .then((cats) => {
        setCategories(cats)
        setCategoriesReady(true)
      })
      .catch(() => {
        setCategories([])
        setCategoriesReady(true)
      })
  }, [])

  const hookCategories = useMemo<ShopCategory[]>(
    () =>
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        displayOrder: typeof c.displayOrder === 'number' ? c.displayOrder : undefined,
      })),
    [categories],
  )

  const { sectionMap, loadMore } = useShopPageProducts(hookCategories)

  return (
    <div className="space-y-4">
      {/* Hero */}
      <section className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-6 md:p-10">
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <h1
            className="text-4xl font-black tracking-tight text-foreground md:text-5xl"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            Shop
          </h1>
          <p className="text-muted-foreground">
            Official Discovery Town merchandise, equipment, and essentials.
          </p>
        </div>
      </section>

      {/* Category rails */}
      {!categoriesReady ? (
        Array.from({ length: 3 }, (_, i) => (
          <HorizontalScrollSection key={i} title="">
            {SKELETONS.map((j) => (
              <ShopProductScrollCardSkeleton key={j} />
            ))}
          </HorizontalScrollSection>
        ))
      ) : categories.length === 0 ? (
        <CatalogEmptyState
          title="No shop categories yet"
          description="We don't have any shop items listed right now. Please check back later."
        />
      ) : (
        hookCategories.map((category) => {
          const data = sectionMap.get(category.id)
          return (
            <ShopCategorySection
              key={category.id}
              category={category}
              products={data?.products ?? []}
              isLoading={data?.isLoading ?? true}
              isLoadingMore={data?.isLoadingMore ?? false}
              hasMore={data?.hasMore ?? false}
              onLoadMore={() => loadMore(category.id)}
            />
          )
        })
      )}
    </div>
  )
}
