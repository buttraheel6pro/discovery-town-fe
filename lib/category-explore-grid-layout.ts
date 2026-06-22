/** Layout helpers for homepage-style category explore card grids. */
import type { HomeExploreCardAccent, HomeExploreCardReveal } from '@/components/customer/home-explore-card'

export const CATEGORY_EXPLORE_TILE_GAP = 'gap-2'

export interface CategoryExploreCardItem {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly href: string
  readonly imageSrc: string
  readonly accent: HomeExploreCardAccent
}

export function chunkCategoryExploreCards(
  cards: readonly CategoryExploreCardItem[],
): CategoryExploreCardItem[][] {
  const rows: CategoryExploreCardItem[][] = []
  for (let index = 0; index < cards.length; index += 3) {
    rows.push(cards.slice(index, index + 3))
  }
  return rows
}

export function categoryExploreRowGridClass(count: number): string {
  if (count === 1) {
    return 'grid-cols-1'
  }
  if (count === 2) {
    return 'grid-cols-1 sm:grid-cols-2'
  }
  return 'grid-cols-1 sm:grid-cols-3'
}

export function categoryExploreRevealFrom(
  columnIndex: number,
  columnCount: number,
): HomeExploreCardReveal {
  if (columnCount === 1) {
    return 'up'
  }
  if (columnCount === 2) {
    return columnIndex === 0 ? 'left' : 'right'
  }
  if (columnIndex === 0) {
    return 'left'
  }
  if (columnIndex === 2) {
    return 'right'
  }
  return 'up'
}

/** Shadow on overlapping menu landing category cards. */
export const MENU_LANDING_OVERLAP_GRID_CLASS =
  '[&_a]:!shadow-lg [&_a]:hover:!shadow-2xl'
