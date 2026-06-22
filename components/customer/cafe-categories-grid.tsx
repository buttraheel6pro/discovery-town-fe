/** Cafe landing grid — wires cafe categories into the shared explore grid. */
'use client'

import { useMemo } from 'react'

import { catalogSectionEmptyStateProps } from '@/components/customer/catalog-empty-state'
import {
  CategoryExploreGrid,
  type CategoryExploreCardItem,
} from '@/components/customer/category-explore-grid'
import { useCafeCategories } from '@/hooks/use-cafe-categories'
import { getCafeCategoryHref } from '@/lib/cafe-category-routes'
import { resolveCafeCategoryCardMeta } from '@/lib/cafe-category-meta'
import {
  getSchedulingCategoryExploreHref,
  resolveSchedulingExploreCardMeta,
} from '@/lib/product-menu-explore-categories'
import { MENU_LANDING_OVERLAP_GRID_CLASS } from '@/lib/category-explore-grid-layout'

export function CafeCategoriesGrid() {
  const { categories, isLoading } = useCafeCategories()

  const cards = useMemo(
    (): CategoryExploreCardItem[] =>
      categories.map((category, index) => {
        const isScheduling = category.source === 'scheduling' && category.schedulingCategory
        const meta = isScheduling
          ? resolveSchedulingExploreCardMeta(category.schedulingCategory, index)
          : resolveCafeCategoryCardMeta(category, index)
        const href = isScheduling
          ? getSchedulingCategoryExploreHref(category.schedulingCategory)
          : getCafeCategoryHref(category.slug)

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
      emptyState={catalogSectionEmptyStateProps('cafe & food')}
      animateSectionOnScroll={false}
      headingId="cafe-categories-heading"
      headingLabel="Browse cafe & food categories"
      className={MENU_LANDING_OVERLAP_GRID_CLASS}
    />
  )
}
