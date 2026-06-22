/** Shared homepage-style category card grid — tiled rows with scroll reveals. */
'use client'

import { useMemo } from 'react'

import {
  CatalogEmptyState,
  type CatalogEmptyStateProps,
} from '@/components/customer/catalog-empty-state'
import { HomeExploreCard } from '@/components/customer/home-explore-card'
import { useInView } from '@/hooks/use-in-view'
import {
  CATEGORY_EXPLORE_TILE_GAP,
  categoryExploreRevealFrom,
  categoryExploreRowGridClass,
  chunkCategoryExploreCards,
  type CategoryExploreCardItem,
} from '@/lib/category-explore-grid-layout'
import { cn } from '@/lib/utils'

export type { CategoryExploreCardItem } from '@/lib/category-explore-grid-layout'

export interface CategoryExploreGridProps {
  readonly cards: readonly CategoryExploreCardItem[]
  /** Optional final row (e.g. homepage shop + rentals). */
  readonly trailingRow?: readonly CategoryExploreCardItem[]
  readonly isLoading?: boolean
  readonly emptyState?: CatalogEmptyStateProps
  readonly emptyStateWrapperClassName?: string
  readonly headingId: string
  readonly headingLabel: string
  readonly className?: string
  readonly animateSectionOnScroll?: boolean
}

interface CategoryExploreGridRowProps {
  readonly cards: readonly CategoryExploreCardItem[]
  readonly gridClass: string
}

function CategoryExploreGridSkeleton() {
  return (
    <div
      className={cn(
        'grid w-full grid-cols-1 sm:grid-cols-3',
        CATEGORY_EXPLORE_TILE_GAP,
      )}
      aria-busy="true"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="min-h-[13.5rem] animate-pulse rounded-xl bg-muted/60 sm:min-h-[15rem] md:min-h-[17.5rem]"
          aria-hidden
        />
      ))}
    </div>
  )
}

function CategoryExploreGridRow({ cards, gridClass }: CategoryExploreGridRowProps) {
  return (
    <div className={cn('grid w-full', CATEGORY_EXPLORE_TILE_GAP, gridClass)}>
      {cards.map((card, columnIndex) => (
        <HomeExploreCard
          key={card.id}
          href={card.href}
          title={card.title}
          description={card.description}
          imageSrc={card.imageSrc}
          accent={card.accent}
          revealDelay={columnIndex * 120}
          revealFrom={categoryExploreRevealFrom(columnIndex, cards.length)}
          tiled
          size="tile"
        />
      ))}
    </div>
  )
}

export function CategoryExploreGrid({
  cards,
  trailingRow = [],
  isLoading = false,
  emptyState,
  emptyStateWrapperClassName = 'w-full py-8',
  headingId,
  headingLabel,
  className,
  animateSectionOnScroll = true,
}: Readonly<CategoryExploreGridProps>) {
  const rows = useMemo(() => chunkCategoryExploreCards(cards), [cards])
  const hasTrailingRow = trailingRow.length > 0
  const hasContent = cards.length > 0 || hasTrailingRow

  const { ref, inView } = useInView<HTMLElement>({
    rootMargin: '0px 0px -8% 0px',
    threshold: 0.05,
    once: true,
  })

  if (isLoading) {
    return <CategoryExploreGridSkeleton />
  }

  if (!hasContent) {
    if (emptyState) {
      return (
        <div className={emptyStateWrapperClassName}>
          <CatalogEmptyState {...emptyState} />
        </div>
      )
    }
    return null
  }

  return (
    <section
      ref={animateSectionOnScroll ? ref : undefined}
      className={cn(
        'w-full',
        animateSectionOnScroll && 'transition-opacity duration-500',
        animateSectionOnScroll && (inView ? 'opacity-100' : 'opacity-0'),
        className,
      )}
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className="sr-only">
        {headingLabel}
      </h2>
      <div className={cn('flex w-full flex-col', CATEGORY_EXPLORE_TILE_GAP)}>
        {rows.map((row) => (
          <CategoryExploreGridRow
            key={row.map((card) => card.id).join('-')}
            cards={row}
            gridClass={categoryExploreRowGridClass(row.length)}
          />
        ))}
        {hasTrailingRow ? (
          <CategoryExploreGridRow
            cards={trailingRow}
            gridClass={categoryExploreRowGridClass(trailingRow.length)}
          />
        ) : null}
      </div>
    </section>
  )
}
