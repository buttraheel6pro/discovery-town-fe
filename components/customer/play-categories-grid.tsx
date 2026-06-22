/** Play landing grid — wires play categories into the shared explore grid. */
'use client'

import { useMemo } from 'react'

import {
  CategoryExploreGrid,
  type CategoryExploreCardItem,
} from '@/components/customer/category-explore-grid'
import { usePlayCategories } from '@/hooks/use-play-categories'
import {
  getSchedulingMenuExploreHref,
  resolveSchedulingMenuExploreCardMeta,
} from '@/lib/scheduling-menu-explore-categories'
import { MENU_LANDING_OVERLAP_GRID_CLASS } from '@/lib/category-explore-grid-layout'

export function PlayCategoriesGrid() {
  const { exploreCategories } = usePlayCategories()

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
      headingId="play-categories-heading"
      headingLabel="Browse play categories"
      className={MENU_LANDING_OVERLAP_GRID_CLASS}
    />
  )
}
