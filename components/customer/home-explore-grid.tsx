/** Homepage explore grid — tight tiled rows with scroll-triggered card reveals. */
'use client'

import { useMemo } from 'react'

import {
  HomeExploreCard,
  type HomeExploreCardAccent,
  type HomeExploreCardReveal,
} from '@/components/customer/home-explore-card'
import { useInView } from '@/hooks/use-in-view'
import { useCustomerNavLabels } from '@/hooks/use-customer-nav-labels'
import {
  CATALOG_MENU_ORDER,
  catalogSlugToProductType,
  type CatalogSlug,
  type ProductCatalogSlug,
} from '@/lib/catalog-slugs'
import {
  CUSTOMER_NAV_LABEL_ROUTES,
  isCustomerNavItemVisible,
  type CustomerNavLabelKey,
} from '@/lib/customer-nav-labels'
import { useInventory } from '@/lib/inventory-store'
import { hasConsumerVisibleProductType } from '@/lib/product-visibility'
import { cn } from '@/lib/utils'

interface ExploreCardItem {
  readonly key: CustomerNavLabelKey
  readonly title: string
  readonly description: string
  readonly href: string
  readonly imageSrc: string
  readonly accent: HomeExploreCardAccent
}

const SCHEDULING_SLUGS = new Set<CatalogSlug>(['gym', 'play', 'events', 'learn'])

function isProductCatalogSlug(slug: CatalogSlug): slug is ProductCatalogSlug {
  return !SCHEDULING_SLUGS.has(slug)
}

const SLUG_TO_NAV_KEY: Record<CatalogSlug, CustomerNavLabelKey> = {
  gym: 'gym',
  play: 'play',
  events: 'events',
  learn: 'learn',
  shop: 'shop',
  gifts: 'gifts',
  rentals: 'rentals',
  'cafe-food': 'cafeFood',
}

const CARD_META: Record<
  CustomerNavLabelKey,
  { description: string; imageSrc: string; accent: HomeExploreCardAccent }
> = {
  play: {
    description: 'Open play, parties, camps, and endless fun!',
    imageSrc: '/play.png',
    accent: 'accent',
  },
  gym: {
    description: 'Classes and training for every age and skill level.',
    imageSrc:
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50e?w=900&q=80',
    accent: 'primary',
  },
  learn: {
    description: 'Tutoring, enrichment, and learning adventures.',
    imageSrc:
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&q=80',
    accent: 'chart-4',
  },
  events: {
    description: 'Special events, seasonal fun, and unforgettable moments.',
    imageSrc: '/Events.png',
    accent: 'chart-4',
  },
  shop: {
    description: 'Curated toys, gifts, and more for every little explorer.',
    imageSrc: '/shop.png',
    accent: 'primary',
  },
  gifts: {
    description: 'Thoughtful gifts for every celebration and occasion.',
    imageSrc:
      'https://images.unsplash.com/photo-1513885535751-8b9238b3aee4?w=900&q=80',
    accent: 'accent',
  },
  rentals: {
    description:
      'Bounce houses, tables, chairs, and more — perfect for any celebration!',
    imageSrc:
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=900&q=80',
    accent: 'primary',
  },
  cafeFood: {
    description: 'Great coffee, tasty treats, and comfy vibes.',
    imageSrc: '/cafe.png',
    accent: 'chart-5',
  },
}

const ACCENT_CYCLE: HomeExploreCardAccent[] = [
  'accent',
  'primary',
  'chart-5',
  'chart-4',
]

const TILE_GAP = 'gap-2'
const GRID_INSET = 'px-2 pb-2 pt-1 sm:px-2.5 sm:pb-2.5 sm:pt-1.5'

function isCatalogSlugVisible(
  slug: CatalogSlug,
  hidden: Record<CustomerNavLabelKey, boolean>,
  productCategories: ReturnType<typeof useInventory>['productCategories'],
): boolean {
  const navKey = SLUG_TO_NAV_KEY[slug]
  if (!isCustomerNavItemVisible(navKey, hidden)) {
    return false
  }
  if (SCHEDULING_SLUGS.has(slug)) {
    return true
  }
  if (!isProductCatalogSlug(slug)) {
    return false
  }
  const productType = catalogSlugToProductType(slug)
  return hasConsumerVisibleProductType(productType, productCategories)
}

function buildExploreCards(
  labels: Record<CustomerNavLabelKey, string>,
  hidden: Record<CustomerNavLabelKey, boolean>,
  productCategories: ReturnType<typeof useInventory>['productCategories'],
): ExploreCardItem[] {
  return CATALOG_MENU_ORDER.flatMap((entry, index) => {
    if (!isCatalogSlugVisible(entry.slug, hidden, productCategories)) {
      return []
    }
    const key = SLUG_TO_NAV_KEY[entry.slug]
    const meta = CARD_META[key]
    return [{
      key,
      title: labels[key],
      description: meta.description,
      href: CUSTOMER_NAV_LABEL_ROUTES[key],
      imageSrc: meta.imageSrc,
      accent: meta.accent ?? ACCENT_CYCLE[index % ACCENT_CYCLE.length],
    }]
  })
}

function chunkIntoRows(cards: ExploreCardItem[]): ExploreCardItem[][] {
  const rows: ExploreCardItem[][] = []
  for (let index = 0; index < cards.length; index += 3) {
    rows.push(cards.slice(index, index + 3))
  }
  return rows
}

function rowGridClass(count: number): string {
  if (count === 1) {
    return 'grid-cols-1'
  }
  if (count === 2) {
    return 'grid-cols-1 sm:grid-cols-2'
  }
  return 'grid-cols-1 sm:grid-cols-3'
}

function revealFromForColumn(
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

interface ExploreCardGridProps {
  readonly cards: ExploreCardItem[]
  readonly gridClass: string
}

function ExploreCardGrid({ cards, gridClass }: ExploreCardGridProps) {
  return (
    <div className={cn('grid w-full', TILE_GAP, gridClass)}>
      {cards.map((card, columnIndex) => (
        <HomeExploreCard
          key={card.key}
          href={card.href}
          title={card.title}
          description={card.description}
          imageSrc={card.imageSrc}
          accent={card.accent}
          revealDelay={columnIndex * 120}
          revealFrom={revealFromForColumn(columnIndex, cards.length)}
          tiled
          size="tile"
        />
      ))}
    </div>
  )
}

export function HomeExploreGrid() {
  const { labels, hidden } = useCustomerNavLabels()
  const { productCategories } = useInventory()

  const cards = useMemo(
    () => buildExploreCards(labels, hidden, productCategories),
    [hidden, labels, productCategories],
  )

  const { gridCards, shopCard, rentalsCard } = useMemo(() => {
    const shop = cards.find((card) => card.key === 'shop')
    const rentals = cards.find((card) => card.key === 'rentals')
    const regular = cards.filter(
      (card) => card.key !== 'rentals' && card.key !== 'shop',
    )
    return { gridCards: regular, shopCard: shop, rentalsCard: rentals }
  }, [cards])

  const bottomRowCards = useMemo(
    () => [shopCard, rentalsCard].filter(
      (card): card is ExploreCardItem => card != null,
    ),
    [rentalsCard, shopCard],
  )

  const rows = useMemo(() => chunkIntoRows(gridCards), [gridCards])

  const { ref, inView } = useInView<HTMLElement>({
    rootMargin: '0px 0px -8% 0px',
    threshold: 0.05,
    once: true,
  })

  if (cards.length === 0) {
    return null
  }

  return (
    <section
      ref={ref}
      className={cn(
        'relative z-10 w-full bg-white',
        GRID_INSET,
        'transition-opacity duration-500',
        inView ? 'opacity-100' : 'opacity-0',
      )}
      aria-labelledby="explore-heading"
    >
      <h2 id="explore-heading" className="sr-only">
        Explore Discovery Town
      </h2>

      <div className={cn('flex w-full flex-col', TILE_GAP)}>
        {rows.map((row) => (
          <ExploreCardGrid
            key={row.map((card) => card.key).join('-')}
            cards={row}
            gridClass={rowGridClass(row.length)}
          />
        ))}

        {bottomRowCards.length > 0 ? (
          <ExploreCardGrid
            cards={bottomRowCards}
            gridClass={
              bottomRowCards.length === 2
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1'
            }
          />
        ) : null}
      </div>
    </section>
  )
}
