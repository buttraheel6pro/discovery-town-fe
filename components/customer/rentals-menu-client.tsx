/**
 * Rentals menu — horizontal-scroll rails per product category, batch-loaded
 * in parallel on first render (10 items each), with auto load-more at rail end.
 */
'use client'

import { useEffect, useMemo, useState } from 'react'

import { HorizontalScrollSection } from '@/components/customer/horizontal-scroll-section'
import { CatalogEmptyState } from '@/components/customer/catalog-empty-state'
import { RentalProductScrollCard } from '@/components/customer/rental-product-scroll-card'
import { RentalProductScrollCardSkeleton } from '@/components/customer/rental-product-scroll-card-skeleton'
import { isApiEnabled } from '@/lib/api/client'
import { isMockDataEnabled } from '@/lib/config/data-source'
import {
  fetchRentalCategories,
  type RentalPublicProduct,
  type RentalPublicCategory,
} from '@/lib/api/rentals.api'
import { useRentalsPageProducts, type RentalCategory } from '@/lib/hooks/use-rentals-page-products'

// Static fallback category list (matches seed-rentals.sql IDs)
const STATIC_RENTAL_CATEGORIES: RentalPublicCategory[] = [
  { id: 'pcat-rent-inflatables', name: 'Inflatables',           displayOrder: 1, isActive: true },
  { id: 'pcat-rent-interactive', name: 'Interactive Games',     displayOrder: 2, isActive: true },
  { id: 'pcat-rent-party-setup', name: 'Party Setup & Decor',   displayOrder: 3, isActive: true },
  { id: 'pcat-rent-food-drink',  name: 'Food & Drink Stations', displayOrder: 4, isActive: true },
  { id: 'pcat-rent-av-lighting', name: 'AV & Lighting',         displayOrder: 5, isActive: true },
  { id: 'pcat-rent-sports',      name: 'Sports Equipment',      displayOrder: 6, isActive: true },
  { id: 'pcat-rent-mechanicals', name: 'Rides & Mechanicals',   displayOrder: 7, isActive: true },
  { id: 'pcat-rent-staffed',     name: 'Staffed Add-Ons',       displayOrder: 8, isActive: true },
]

const SKELETONS = Array.from({ length: 5 }, (_, i) => i)

// ─── Category section ─────────────────────────────────────────────────────────

interface RentalCategorySectionProps {
  readonly category: RentalCategory
  readonly products: RentalPublicProduct[]
  readonly isLoading: boolean
  readonly isLoadingMore: boolean
  readonly hasMore: boolean
  readonly onLoadMore: () => void
}

function RentalCategorySection({
  category,
  products,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
}: RentalCategorySectionProps) {
  return (
    <HorizontalScrollSection
      title={category.name}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      onLoadMore={onLoadMore}
      autoLoadMore
    >
      {isLoading
        ? SKELETONS.map((i) => <RentalProductScrollCardSkeleton key={i} />)
        : products.map((product) => (
            <RentalProductScrollCard key={product.id} product={product} />
          ))}
    </HorizontalScrollSection>
  )
}

// ─── Page client ──────────────────────────────────────────────────────────────

export function RentalsMenuClient() {
  const [categories, setCategories] = useState<RentalPublicCategory[]>([])
  const [categoriesReady, setCategoriesReady] = useState(false)

  useEffect(() => {
    if (isMockDataEnabled()) {
      setCategories(STATIC_RENTAL_CATEGORIES)
      setCategoriesReady(true)
      return
    }
    if (!isApiEnabled) {
      setCategories([])
      setCategoriesReady(true)
      return
    }
    fetchRentalCategories()
      .then((cats) => {
        setCategories(cats)
        setCategoriesReady(true)
      })
      .catch(() => {
        setCategories([])
        setCategoriesReady(true)
      })
  }, [])

  const hookCategories = useMemo<RentalCategory[]>(
    () =>
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        displayOrder: typeof c.displayOrder === 'number' ? c.displayOrder : undefined,
      })),
    [categories],
  )

  const { sectionMap, loadMore } = useRentalsPageProducts(hookCategories)

  return (
    <div className="space-y-4">
      {/* Category rails */}
      {!categoriesReady ? (
        Array.from({ length: 3 }, (_, i) => (
          <HorizontalScrollSection key={i} title="">
            {SKELETONS.map((j) => (
              <RentalProductScrollCardSkeleton key={j} />
            ))}
          </HorizontalScrollSection>
        ))
      ) : categories.length === 0 ? (
        <CatalogEmptyState
          title="No rental categories yet"
          description="We don't have any rental items listed right now. Please check back later."
        />
      ) : (
        hookCategories.map((category) => {
          const data = sectionMap.get(category.id)
          return (
            <RentalCategorySection
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
