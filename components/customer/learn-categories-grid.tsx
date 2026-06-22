/** Learn landing grid — wires learn categories into the shared explore grid. */
'use client'

import { useMemo } from 'react'

import {
  CategoryExploreGrid,
  type CategoryExploreCardItem,
} from '@/components/customer/category-explore-grid'
import { useLearnCategories } from '@/hooks/use-learn-categories'
import {
  getSchedulingMenuExploreHref,
  resolveSchedulingMenuExploreCardMeta,
} from '@/lib/scheduling-menu-explore-categories'
import { MENU_LANDING_OVERLAP_GRID_CLASS } from '@/lib/category-explore-grid-layout'

export function LearnCategoriesGrid() {
  const { exploreCategories } = useLearnCategories()

  const cards = useMemo(
    (): CategoryExploreCardItem[] =>
      exploreCategories.map((category, index) => {
        const meta = resolveSchedulingMenuExploreCardMeta(category, index)
        return {
          id: category.id,
          title: category.name,
          description: meta.description,
          href: getSchedulingMenuExploreHref(category),
          imageSrc: meta.imageSrc,
          accent: meta.accent,
        }
      }),
    [exploreCategories],
  )

  return (
    <CategoryExploreGrid
      cards={cards}
      headingId="learn-categories-heading"
      headingLabel="Browse learn categories"
      className={MENU_LANDING_OVERLAP_GRID_CLASS}
    />
  )
}
