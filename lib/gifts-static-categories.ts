/** Static gifts sub-categories — mock fallback aligned with mock-data & seed-gifts.sql. */

interface StaticGiftsCategory {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly displayOrder: number
}

export const STATIC_GIFTS_CONSUMER_CATEGORIES: readonly StaticGiftsCategory[] = [
  {
    id: 'pcat-gifts-gourmet',
    name: 'The Gourmet Collection: Treats & Taste',
    slug: 'gourmet-collection',
    displayOrder: 1,
  },
  {
    id: 'pcat-gifts-party-drop',
    name: 'The Family Fun Collection: Play & Bonding',
    slug: 'family-fun-play-bonding',
    displayOrder: 2,
  },
  {
    id: 'pcat-gifts-movie-night',
    name: 'The Wellness & Comfort Collection: Self-Care & Relaxation',
    slug: 'wellness-comfort-self-care',
    displayOrder: 3,
  },
  {
    id: 'pcat-gifts-little-chef',
    name: 'The Luxury Celebration: Grand Gestures',
    slug: 'luxury-celebration-grand-gestures',
    displayOrder: 4,
  },
]
