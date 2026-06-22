/**
 * Cafe menu page — horizontal-scroll rails per product category, batch-loaded
 * in parallel on first render (10 items each), with auto load-more at rail end.
 */
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { CatalogEmptyState } from '@/components/customer/catalog-empty-state'
import { CafeProductScrollCard } from '@/components/customer/cafe-product-scroll-card'
import { CafeProductScrollCardSkeleton } from '@/components/customer/cafe-product-scroll-card-skeleton'
import { HorizontalScrollSection } from '@/components/customer/horizontal-scroll-section'
import { isApiEnabled } from '@/lib/api/client'
import { isMockDataEnabled } from '@/lib/config/data-source'
import {
  fetchCafeCategories,
  type PublicProduct,
  type PublicProductCategory,
} from '@/lib/api/cafe.api'
import { useCafePageProducts, type CafeCategory } from '@/lib/hooks/use-cafe-page-products'

// Static fallback category list (matches seed-cafe.sql IDs)
const STATIC_CAFE_CATEGORIES: PublicProductCategory[] = [
  { id: 'pcat-cafe-coffee', name: 'Coffee', displayOrder: 1, isActive: true },
  { id: 'pcat-cafe-specialty', name: 'Specialty Drinks', displayOrder: 2, isActive: true },
  { id: 'pcat-cafe-hot-drinks', name: 'Hot Drinks', displayOrder: 3, isActive: true },
  { id: 'pcat-cafe-cold-brew', name: 'Cold Brew & Iced Coffee', displayOrder: 4, isActive: true },
  { id: 'pcat-cafe-cold-drinks', name: 'Cold Drinks', displayOrder: 5, isActive: true },
  { id: 'pcat-cafe-pastries', name: 'Pastries & Baked Goods', displayOrder: 6, isActive: true },
  { id: 'pcat-cafe-pizza', name: 'Pizza', displayOrder: 7, isActive: true },
  { id: 'pcat-cafe-sandwiches', name: 'Sandwiches & Wraps', displayOrder: 8, isActive: true },
  { id: 'pcat-cafe-kids-corner', name: "Kids' Corner", displayOrder: 9, isActive: true },
  { id: 'pcat-cafe-salads', name: 'Salads & Bowls', displayOrder: 10, isActive: true },
  { id: 'pcat-cafe-sweets', name: 'Sweets & Desserts', displayOrder: 11, isActive: true },
]

const SKELETONS = Array.from({ length: 5 }, (_, i) => i)

// ─── Category section ─────────────────────────────────────────────────────────

interface CafeCategorySectionProps {
  readonly category: CafeCategory
  readonly products: PublicProduct[]
  readonly isLoading: boolean
  readonly isLoadingMore: boolean
  readonly hasMore: boolean
  readonly onLoadMore: () => void
}

function CafeCategorySection({
  category,
  products,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
}: CafeCategorySectionProps) {
  return (
    <HorizontalScrollSection
      title={category.name}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      onLoadMore={onLoadMore}
      autoLoadMore
    >
      {isLoading
        ? SKELETONS.map((i) => <CafeProductScrollCardSkeleton key={i} />)
        : products.map((product) => (
            <CafeProductScrollCard key={product.id} product={product} />
          ))}
    </HorizontalScrollSection>
  )
}

// ─── Page client ──────────────────────────────────────────────────────────────

export function CafeMenuClient() {
  const [categories, setCategories] = useState<PublicProductCategory[]>([])
  const [categoriesReady, setCategoriesReady] = useState(false)

  useEffect(() => {
    if (isMockDataEnabled()) {
      setCategories(STATIC_CAFE_CATEGORIES)
      setCategoriesReady(true)
      return
    }
    if (!isApiEnabled) {
      setCategories([])
      setCategoriesReady(true)
      return
    }
    fetchCafeCategories()
      .then((cats) => {
        setCategories(cats)
        setCategoriesReady(true)
      })
      .catch(() => {
        setCategories([])
        setCategoriesReady(true)
      })
  }, [])

  const hookCategories = useMemo<CafeCategory[]>(
    () =>
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        displayOrder: typeof c.displayOrder === 'number' ? c.displayOrder : undefined,
      })),
    [categories],
  )

  const { sectionMap, loadMore } = useCafePageProducts(hookCategories)

  return (
    <div className="space-y-4">
      {/* Hero */}
      <section className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-6 md:p-10">
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <h1
            className="text-4xl font-black tracking-tight text-foreground md:text-5xl"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            Cafe & Food
          </h1>
          <p className="text-muted-foreground">
            Fresh drinks, pastries, and bites — order for pickup or delivery.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button type="button" size="lg" asChild>
              <Link href="/cafe/order-ahead">Order for Pickup</Link>
            </Button>
            <Button type="button" size="lg" variant="outline" asChild>
              <Link href="/cafe/delivery">Order for Delivery</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Category rails */}
      {!categoriesReady ? (
        Array.from({ length: 3 }, (_, i) => (
          <HorizontalScrollSection key={i} title="">
            {SKELETONS.map((j) => (
              <CafeProductScrollCardSkeleton key={j} />
            ))}
          </HorizontalScrollSection>
        ))
      ) : categories.length === 0 ? (
        <CatalogEmptyState
          title="No cafe menu categories yet"
          description="We don't have any cafe or food items listed right now. Please check back later."
        />
      ) : (
        hookCategories.map((category) => {
          const data = sectionMap.get(category.id)
          return (
            <CafeCategorySection
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
