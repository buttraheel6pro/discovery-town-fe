/**
 * Gifts menu page — horizontal-scroll rails per product category, batch-loaded
 * in parallel on first render (10 items each), with auto load-more at rail end.
 */
'use client'

import { useEffect, useMemo, useState } from 'react'

import { HorizontalScrollSection } from '@/components/customer/horizontal-scroll-section'
import { CatalogEmptyState } from '@/components/customer/catalog-empty-state'
import { GiftProductScrollCard } from '@/components/customer/gift-product-scroll-card'
import { GiftProductScrollCardSkeleton } from '@/components/customer/gift-product-scroll-card-skeleton'
import { isApiEnabled } from '@/lib/api/client'
import { isMockDataEnabled } from '@/lib/config/data-source'
import {
  fetchGiftCategories,
  type GiftPublicProduct,
  type GiftPublicCategory,
} from '@/lib/api/gifts.api'
import { useGiftsPageProducts, type GiftCategory } from '@/lib/hooks/use-gifts-page-products'

// Static fallback category list (matches seed-gifts.sql IDs)
const STATIC_GIFT_CATEGORIES: GiftPublicCategory[] = [
  { id: 'pcat-gifts-bundles',    name: 'Gift Bundles',          displayOrder: 1,  isActive: true },
  { id: 'pcat-gifts-birthday',   name: 'Birthday Gifts',        displayOrder: 2,  isActive: true },
  { id: 'pcat-gifts-family',     name: 'Family Fun',            displayOrder: 3,  isActive: true },
  { id: 'pcat-gifts-kids',       name: 'Kids & Toddlers',       displayOrder: 4,  isActive: true },
  { id: 'pcat-gifts-wellness',   name: 'Wellness & Self-Care',  displayOrder: 5,  isActive: true },
  { id: 'pcat-gifts-sport',      name: 'Sport & Active',        displayOrder: 6,  isActive: true },
  { id: 'pcat-gifts-food',       name: 'Food & Treats',         displayOrder: 7,  isActive: true },
  { id: 'pcat-gifts-experience', name: 'Experience Vouchers',   displayOrder: 8,  isActive: true },
  { id: 'pcat-gifts-seasonal',   name: 'Seasonal & Holiday',    displayOrder: 9,  isActive: true },
  { id: 'pcat-gifts-corporate',  name: 'Corporate Gifts',       displayOrder: 10, isActive: true },
]

const SKELETONS = Array.from({ length: 5 }, (_, i) => i)

// ─── Category section ─────────────────────────────────────────────────────────

interface GiftCategorySectionProps {
  readonly category: GiftCategory
  readonly products: GiftPublicProduct[]
  readonly isLoading: boolean
  readonly isLoadingMore: boolean
  readonly hasMore: boolean
  readonly onLoadMore: () => void
}

function GiftCategorySection({
  category,
  products,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
}: GiftCategorySectionProps) {
  return (
    <HorizontalScrollSection
      title={category.name}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      onLoadMore={onLoadMore}
      autoLoadMore
    >
      {isLoading
        ? SKELETONS.map((i) => <GiftProductScrollCardSkeleton key={i} />)
        : products.map((product) => (
            <GiftProductScrollCard key={product.id} product={product} />
          ))}
    </HorizontalScrollSection>
  )
}

// ─── Page client ──────────────────────────────────────────────────────────────

export function GiftsMenuClient() {
  const [categories, setCategories] = useState<GiftPublicCategory[]>([])
  const [categoriesReady, setCategoriesReady] = useState(false)

  useEffect(() => {
    if (isMockDataEnabled()) {
      setCategories(STATIC_GIFT_CATEGORIES)
      setCategoriesReady(true)
      return
    }
    if (!isApiEnabled) {
      setCategories([])
      setCategoriesReady(true)
      return
    }
    fetchGiftCategories()
      .then((cats) => {
        setCategories(cats)
        setCategoriesReady(true)
      })
      .catch(() => {
        setCategories([])
        setCategoriesReady(true)
      })
  }, [])

  const hookCategories = useMemo<GiftCategory[]>(
    () =>
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        displayOrder: typeof c.displayOrder === 'number' ? c.displayOrder : undefined,
      })),
    [categories],
  )

  const { sectionMap, loadMore } = useGiftsPageProducts(hookCategories)

  return (
    <div className="space-y-4">
      {/* Hero */}
      <section className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-6 md:p-10">
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <h1
            className="text-4xl font-black tracking-tight text-foreground md:text-5xl"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            Gifts
          </h1>
          <p className="text-muted-foreground">
            Curated gift bundles, experience vouchers, and treats for every occasion.
          </p>
        </div>
      </section>

      {/* Category rails */}
      {!categoriesReady ? (
        Array.from({ length: 3 }, (_, i) => (
          <HorizontalScrollSection key={i} title="">
            {SKELETONS.map((j) => (
              <GiftProductScrollCardSkeleton key={j} />
            ))}
          </HorizontalScrollSection>
        ))
      ) : categories.length === 0 ? (
        <CatalogEmptyState
          title="No gift categories yet"
          description="We don't have any gift items listed right now. Please check back later."
        />
      ) : (
        hookCategories.map((category) => {
          const data = sectionMap.get(category.id)
          return (
            <GiftCategorySection
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
