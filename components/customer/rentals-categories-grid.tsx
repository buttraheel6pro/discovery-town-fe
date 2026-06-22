/** Rentals landing grid — wires rental categories into the shared explore grid. */
'use client'

import { useMemo } from 'react'

import { catalogSectionEmptyStateProps } from '@/components/customer/catalog-empty-state'
import {
  CategoryExploreGrid,
  type CategoryExploreCardItem,
} from '@/components/customer/category-explore-grid'
import { useRentalsCategories } from '@/hooks/use-rentals-categories'
import {
  getSchedulingCategoryExploreHref,
  resolveSchedulingExploreCardMeta,
} from '@/lib/product-menu-explore-categories'
import { getRentalsCategoryHref } from '@/lib/rentals-category-routes'
import { resolveRentalsCategoryCardMeta } from '@/lib/rentals-category-meta'
import { MENU_LANDING_OVERLAP_GRID_CLASS } from '@/lib/category-explore-grid-layout'

export function RentalsCategoriesGrid() {
  const { categories, isLoading } = useRentalsCategories()

  const cards = useMemo(
    (): CategoryExploreCardItem[] =>
      categories.map((category, index) => {
        const isScheduling = category.source === 'scheduling' && category.schedulingCategory
        const meta = isScheduling
          ? resolveSchedulingExploreCardMeta(category.schedulingCategory, index)
          : resolveRentalsCategoryCardMeta(category, index)
        const href = isScheduling
          ? getSchedulingCategoryExploreHref(category.schedulingCategory)
          : getRentalsCategoryHref(category.slug)

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
      emptyState={catalogSectionEmptyStateProps('rentals')}
      animateSectionOnScroll={false}
      headingId="rentals-categories-heading"
      headingLabel="Browse rental categories"
      className={MENU_LANDING_OVERLAP_GRID_CLASS}
    />
  )
}
