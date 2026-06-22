/** Shop landing grid — wires shop categories into the shared explore grid. */
'use client'

import { useMemo } from 'react'

import { catalogSectionEmptyStateProps } from '@/components/customer/catalog-empty-state'
import {
  CategoryExploreGrid,
  type CategoryExploreCardItem,
} from '@/components/customer/category-explore-grid'
import { useShopCategories } from '@/hooks/use-shop-categories'
import {
  getSchedulingCategoryExploreHref,
  resolveSchedulingExploreCardMeta,
} from '@/lib/product-menu-explore-categories'
import { getShopCategoryHref } from '@/lib/shop-category-routes'
import { resolveShopCategoryCardMeta } from '@/lib/shop-category-meta'
import { MENU_LANDING_OVERLAP_GRID_CLASS } from '@/lib/category-explore-grid-layout'

export function ShopCategoriesGrid() {
  const { categories, isLoading } = useShopCategories()

  const cards = useMemo(
    (): CategoryExploreCardItem[] =>
      categories.map((category, index) => {
        const isScheduling = category.source === 'scheduling' && category.schedulingCategory
        const meta = isScheduling
          ? resolveSchedulingExploreCardMeta(category.schedulingCategory, index)
          : resolveShopCategoryCardMeta(category, index)
        const href = isScheduling
          ? getSchedulingCategoryExploreHref(category.schedulingCategory)
          : getShopCategoryHref(category.slug)

        return {
          id: category.id,
          title: category.name,
          description: meta.description,
          href,
          imageSrc: meta.imageSrc,
          accent: meta.accent,
        }
      }),
    [categories],
  )

  return (
    <CategoryExploreGrid
      cards={cards}
      isLoading={isLoading}
      emptyState={catalogSectionEmptyStateProps('shop')}
      animateSectionOnScroll={false}
      headingId="shop-categories-heading"
      headingLabel="Browse shop categories"
      className={MENU_LANDING_OVERLAP_GRID_CLASS}
    />
  )
}
