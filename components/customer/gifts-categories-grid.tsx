/** Gifts landing grid — wires gifts categories into the shared explore grid. */
'use client'

import { useMemo } from 'react'

import { catalogSectionEmptyStateProps } from '@/components/customer/catalog-empty-state'
import {
  CategoryExploreGrid,
  type CategoryExploreCardItem,
} from '@/components/customer/category-explore-grid'
import { useGiftsCategories } from '@/hooks/use-gifts-categories'
import { getGiftsCategoryHref } from '@/lib/gifts-category-routes'
import { resolveGiftsCategoryCardMeta } from '@/lib/gifts-category-meta'
import {
  getSchedulingCategoryExploreHref,
  resolveSchedulingExploreCardMeta,
} from '@/lib/product-menu-explore-categories'
import { MENU_LANDING_OVERLAP_GRID_CLASS } from '@/lib/category-explore-grid-layout'

export function GiftsCategoriesGrid() {
  const { categories, isLoading } = useGiftsCategories()

  const cards = useMemo(
    (): CategoryExploreCardItem[] =>
      categories.map((category, index) => {
        const isScheduling = category.source === 'scheduling' && category.schedulingCategory
        const meta = isScheduling
          ? resolveSchedulingExploreCardMeta(category.schedulingCategory, index)
          : resolveGiftsCategoryCardMeta(category, index)
        const href = isScheduling
          ? getSchedulingCategoryExploreHref(category.schedulingCategory)
          : getGiftsCategoryHref(category.slug)

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
      emptyState={catalogSectionEmptyStateProps('gifts')}
      animateSectionOnScroll={false}
      headingId="gifts-categories-heading"
      headingLabel="Browse gift categories"
      className={MENU_LANDING_OVERLAP_GRID_CLASS}
    />
  )
}
