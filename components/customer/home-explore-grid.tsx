/** Homepage explore grid — tight tiled rows with scroll-triggered card reveals. */
'use client'

import { useMemo } from 'react'

import {
  CategoryExploreGrid,
  type CategoryExploreCardItem,
} from '@/components/customer/category-explore-grid'
import type { HomeExploreCardAccent } from '@/components/customer/home-explore-card'
import { useCustomerNavLabels } from '@/hooks/use-customer-nav-labels'
import {
  CATALOG_MENU_ORDER,
  catalogSlugToProductType,
  type CatalogSlug,
  type ProductCatalogSlug,
} from '@/lib/catalog-slugs'
import { MENU_LANDING_HERO_IMAGES } from '@/lib/menu-landing-hero-config'
import {
  CUSTOMER_NAV_LABEL_ROUTES,
  isCustomerNavItemVisible,
  type CustomerNavLabelKey,
} from '@/lib/customer-nav-labels'
import { useInventory } from '@/lib/inventory-store'
import { hasConsumerVisibleProductType } from '@/lib/product-visibility'

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
    imageSrc: MENU_LANDING_HERO_IMAGES.gym,
    accent: 'primary',
  },
  learn: {
    description: 'Tutoring, enrichment, and learning adventures.',
    imageSrc: MENU_LANDING_HERO_IMAGES.learn,
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
    imageSrc: MENU_LANDING_HERO_IMAGES.gifts,
    accent: 'accent',
  },
  rentals: {
    description:
      'Bounce houses, tables, chairs, and more — perfect for any celebration!',
    imageSrc: MENU_LANDING_HERO_IMAGES.rentals,
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

const GRID_INSET =
  'mx-auto max-w-7xl px-4 pb-2 pt-1 sm:px-6 sm:pb-2.5 sm:pt-1.5 lg:px-8'

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
): CategoryExploreCardItem[] {
  return CATALOG_MENU_ORDER.flatMap((entry, index) => {
    if (!isCatalogSlugVisible(entry.slug, hidden, productCategories)) {
      return []
    }
    const key = SLUG_TO_NAV_KEY[entry.slug]
    const meta = CARD_META[key]
    return [{
      id: key,
      title: labels[key],
      description: meta.description,
      href: CUSTOMER_NAV_LABEL_ROUTES[key],
      imageSrc: meta.imageSrc,
      accent: meta.accent ?? ACCENT_CYCLE[index % ACCENT_CYCLE.length],
    }]
  })
}

export function HomeExploreGrid() {
  const { labels, hidden } = useCustomerNavLabels()
  const { productCategories } = useInventory()

  const cards = useMemo(
    () => buildExploreCards(labels, hidden, productCategories),
    [hidden, labels, productCategories],
  )

  const { gridCards, trailingRow } = useMemo(() => {
    const shop = cards.find((card) => card.id === 'shop')
    const rentals = cards.find((card) => card.id === 'rentals')
    const regular = cards.filter((card) => card.id !== 'rentals' && card.id !== 'shop')
    const bottomRow = [shop, rentals].filter(
      (card): card is CategoryExploreCardItem => card != null,
    )
    return { gridCards: regular, trailingRow: bottomRow }
  }, [cards])

  return (
    <CategoryExploreGrid
      cards={gridCards}
      trailingRow={trailingRow}
      headingId="explore-heading"
      headingLabel="Explore Discovery Town"
      className={`relative z-10 bg-white ${GRID_INSET}`}
    />
  )
}
