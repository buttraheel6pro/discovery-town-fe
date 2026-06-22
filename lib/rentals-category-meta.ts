/** Rentals sub-category card metadata — admin imageUrl overrides static fallbacks. */
import type { HomeExploreCardAccent } from '@/components/customer/home-explore-card'
import {
  SCHEDULING_CATEGORY_ACCENT_CYCLE,
  SCHEDULING_CATEGORY_DEFAULT_IMAGE,
} from '@/lib/scheduling-category-card-meta'
import type { ProductCategory } from '@/lib/types'

export interface RentalsCategoryCardMeta {
  readonly description: string
  readonly imageSrc: string
  readonly accent: HomeExploreCardAccent
}

export type RentalsCategoryCardFields = Pick<
  ProductCategory,
  'id' | 'name' | 'description' | 'imageUrl'
>

export const RENTALS_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'pcat-rentals-inflatables':
    'Bounce houses, slides, and inflatable play structures for every party size.',
  'pcat-rentals-trains-mechanicals':
    'Trackless trains, mechanical rides, and crowd-pleasing attractions.',
  'pcat-rentals-interactive-play':
    'Giant games, interactive play zones, and hands-on entertainment.',
  'pcat-rentals-party-setup':
    'Tables, chairs, tents, staging, and everything to set the scene.',
  'pcat-rentals-party-supply':
    'Tableware, linens, and supply bundles for polished events.',
  'pcat-rentals-food-drinks':
    'Popcorn carts, beverage stations, and food-service equipment.',
  'pcat-rentals-entertainers':
    'Characters, performers, and hosted entertainment for your guests.',
  'pcat-rentals-party-staff':
    'Event staff, attendants, and on-site support for smooth operations.',
  'pcat-rentals-venue':
    'Spaces, layouts, and venue essentials for hosted celebrations.',
  'pcat-rentals-av-lighting-power':
    'Sound, lighting, power, and AV gear for professional events.',
  'pcat-rentals-invitations':
    'Printed and digital invitation packages for your celebration.',
  'pcat-rentals-photo-video':
    'Photo booths, backdrops, and video capture for lasting memories.',
  'pcat-rentals-concessions':
    'Concession stands, serving equipment, and add-on food service.',
}

export const RENTALS_CATEGORY_CARD_META: Record<
  string,
  { readonly description: string; readonly imageSrc: string; readonly accent: HomeExploreCardAccent }
> = {
  'pcat-rentals-inflatables': {
    description: RENTALS_CATEGORY_DESCRIPTIONS['pcat-rentals-inflatables'],
    imageSrc:
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=900&q=80',
    accent: 'accent',
  },
  'pcat-rentals-trains-mechanicals': {
    description: RENTALS_CATEGORY_DESCRIPTIONS['pcat-rentals-trains-mechanicals'],
    imageSrc: '/categories/rentals-trains-mechanicals.jpg',
    accent: 'primary',
  },
  'pcat-rentals-interactive-play': {
    description: RENTALS_CATEGORY_DESCRIPTIONS['pcat-rentals-interactive-play'],
    imageSrc: '/categories/rentals-interactive-play.jpg',
    accent: 'chart-4',
  },
  'pcat-rentals-party-setup': {
    description: RENTALS_CATEGORY_DESCRIPTIONS['pcat-rentals-party-setup'],
    imageSrc:
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=900&q=80',
    accent: 'chart-5',
  },
  'pcat-rentals-party-supply': {
    description: RENTALS_CATEGORY_DESCRIPTIONS['pcat-rentals-party-supply'],
    imageSrc:
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=900&q=80',
    accent: 'accent',
  },
  'pcat-rentals-food-drinks': {
    description: RENTALS_CATEGORY_DESCRIPTIONS['pcat-rentals-food-drinks'],
    imageSrc:
      'https://images.unsplash.com/photo-1555244162-803834f70033?w=900&q=80',
    accent: 'primary',
  },
  'pcat-rentals-entertainers': {
    description: RENTALS_CATEGORY_DESCRIPTIONS['pcat-rentals-entertainers'],
    imageSrc:
      'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=900&q=80',
    accent: 'chart-4',
  },
  'pcat-rentals-party-staff': {
    description: RENTALS_CATEGORY_DESCRIPTIONS['pcat-rentals-party-staff'],
    imageSrc:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?w=900&q=80',
    accent: 'chart-5',
  },
  'pcat-rentals-venue': {
    description: RENTALS_CATEGORY_DESCRIPTIONS['pcat-rentals-venue'],
    imageSrc: '/categories/rentals-venue.jpg',
    accent: 'accent',
  },
  'pcat-rentals-av-lighting-power': {
    description: RENTALS_CATEGORY_DESCRIPTIONS['pcat-rentals-av-lighting-power'],
    imageSrc:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&q=80',
    accent: 'primary',
  },
  'pcat-rentals-invitations': {
    description: RENTALS_CATEGORY_DESCRIPTIONS['pcat-rentals-invitations'],
    imageSrc: '/categories/rentals-invitations.jpg',
    accent: 'chart-4',
  },
  'pcat-rentals-photo-video': {
    description: RENTALS_CATEGORY_DESCRIPTIONS['pcat-rentals-photo-video'],
    imageSrc:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=80',
    accent: 'chart-5',
  },
  'pcat-rentals-concessions': {
    description: RENTALS_CATEGORY_DESCRIPTIONS['pcat-rentals-concessions'],
    imageSrc:
      'https://images.unsplash.com/photo-1555244162-803834f70033?w=900&q=80',
    accent: 'accent',
  },
}

function resolveRentalsCategoryImageSrc(
  category: RentalsCategoryCardFields,
  staticFallbackImageSrc?: string,
): string {
  const configured = category.imageUrl?.trim()
  if (configured) {
    return configured
  }
  return staticFallbackImageSrc ?? SCHEDULING_CATEGORY_DEFAULT_IMAGE
}

function resolveRentalsCategoryDescription(
  category: RentalsCategoryCardFields,
  staticFallbackDescription?: string,
): string {
  const configured = category.description?.trim()
  if (configured) {
    return configured
  }
  if (staticFallbackDescription) {
    return staticFallbackDescription
  }
  return `Browse ${category.name.toLowerCase()} rentals at Discovery Town.`
}

export function resolveRentalsCategoryCardMeta(
  category: RentalsCategoryCardFields,
  index: number,
): RentalsCategoryCardMeta {
  const known = RENTALS_CATEGORY_CARD_META[category.id]
  return {
    description: resolveRentalsCategoryDescription(
      category,
      known?.description ?? RENTALS_CATEGORY_DESCRIPTIONS[category.id],
    ),
    imageSrc: resolveRentalsCategoryImageSrc(category, known?.imageSrc),
    accent:
      known?.accent ??
      SCHEDULING_CATEGORY_ACCENT_CYCLE[index % SCHEDULING_CATEGORY_ACCENT_CYCLE.length],
  }
}
