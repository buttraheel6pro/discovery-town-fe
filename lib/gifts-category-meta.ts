/** Gifts sub-category card metadata — admin imageUrl overrides static fallbacks. */
import type { HomeExploreCardAccent } from '@/components/customer/home-explore-card'
import {
  SCHEDULING_CATEGORY_ACCENT_CYCLE,
  SCHEDULING_CATEGORY_DEFAULT_IMAGE,
} from '@/lib/scheduling-category-card-meta'
import type { ProductCategory } from '@/lib/types'

export interface GiftsCategoryCardMeta {
  readonly description: string
  readonly imageSrc: string
  readonly accent: HomeExploreCardAccent
}

export type GiftsCategoryCardFields = Pick<
  ProductCategory,
  'id' | 'name' | 'description' | 'imageUrl'
>

export const GIFTS_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'pcat-gifts-gourmet':
    'Perfect for hosts, food lovers, and elevated snacking.',
  'pcat-gifts-party-drop':
    'Curated to celebrate children and family time with playful treats.',
  'pcat-gifts-movie-night':
    'Cozy, restorative, and calming gift experiences.',
  'pcat-gifts-little-chef':
    'High-impact gifting curated for milestone celebrations.',
}

export const GIFTS_CATEGORY_CARD_META: Record<
  string,
  { readonly description: string; readonly imageSrc: string; readonly accent: HomeExploreCardAccent }
> = {
  'pcat-gifts-gourmet': {
    description: GIFTS_CATEGORY_DESCRIPTIONS['pcat-gifts-gourmet'],
    imageSrc:
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=900&q=80',
    accent: 'accent',
  },
  'pcat-gifts-party-drop': {
    description: GIFTS_CATEGORY_DESCRIPTIONS['pcat-gifts-party-drop'],
    imageSrc:
      'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=900&q=80',
    accent: 'chart-2',
  },
  'pcat-gifts-movie-night': {
    description: GIFTS_CATEGORY_DESCRIPTIONS['pcat-gifts-movie-night'],
    imageSrc:
      'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=900&q=80',
    accent: 'chart-3',
  },
  'pcat-gifts-little-chef': {
    description: GIFTS_CATEGORY_DESCRIPTIONS['pcat-gifts-little-chef'],
    imageSrc: '/categories/gifts-luxury-celebration.jpg',
    accent: 'chart-4',
  },
}

function resolveGiftsCategoryImageSrc(
  category: GiftsCategoryCardFields,
  staticFallbackImageSrc?: string,
): string {
  const configured = category.imageUrl?.trim()
  if (configured) {
    return configured
  }
  return staticFallbackImageSrc ?? SCHEDULING_CATEGORY_DEFAULT_IMAGE
}

function resolveGiftsCategoryDescription(
  category: GiftsCategoryCardFields,
  staticFallbackDescription?: string,
): string {
  const configured = category.description?.trim()
  if (configured) {
    return configured
  }
  if (staticFallbackDescription) {
    return staticFallbackDescription
  }
  return `Explore ${category.name.toLowerCase()} at the Discovery Town gifts shop.`
}

export function resolveGiftsCategoryCardMeta(
  category: GiftsCategoryCardFields,
  index: number,
): GiftsCategoryCardMeta {
  const known = GIFTS_CATEGORY_CARD_META[category.id]
  return {
    description: resolveGiftsCategoryDescription(
      category,
      known?.description ?? GIFTS_CATEGORY_DESCRIPTIONS[category.id],
    ),
    imageSrc: resolveGiftsCategoryImageSrc(category, known?.imageSrc),
    accent:
      known?.accent ??
      SCHEDULING_CATEGORY_ACCENT_CYCLE[index % SCHEDULING_CATEGORY_ACCENT_CYCLE.length],
  }
}
