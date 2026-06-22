/** Cafe & Food sub-category card metadata — admin imageUrl overrides static fallbacks. */
import type { HomeExploreCardAccent } from '@/components/customer/home-explore-card'
import type { CafeConsumerCategory } from '@/lib/cafe-consumer-categories'
import {
  SCHEDULING_CATEGORY_ACCENT_CYCLE,
  SCHEDULING_CATEGORY_DEFAULT_IMAGE,
} from '@/lib/scheduling-category-card-meta'

export interface CafeCategoryCardMeta {
  readonly description: string
  readonly imageSrc: string
  readonly accent: HomeExploreCardAccent
}

export type CafeCategoryCardFields = Pick<
  CafeConsumerCategory,
  'id' | 'name' | 'description' | 'imageUrl'
>

export const CAFE_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'pcat-cafe-classic-hot':
    'Perfectly pulled espresso and freshly brewed beans — the foundation of every visit.',
  'pcat-cafe-cold-brew': 'Perfectly chilled and refreshing coffee for warm days.',
  'pcat-cafe-specialty-drinks': 'Seasonal signatures and barista-crafted favorites.',
  'pcat-cafe-hot-drinks': 'Warm teas, cocoas, and comforting sips for every mood.',
  'pcat-cafe-cold-drinks': 'Iced teas, lemonades, and chilled refreshments.',
  'pcat-cafe-frozen-treats': 'Blended treats and frozen delights for all ages.',
  'pcat-cafe-pastries-baked': 'Fresh pastries and baked goods made for sharing.',
  'pcat-cafe-sweets-treats': 'Cookies, brownies, and sweet bites to pair with your drink.',
  'pcat-cafe-baked-food': 'Hearty baked plates for breakfast and lunch.',
  'pcat-cafe-pizza': 'Family-friendly pizzas fresh from the oven.',
  'pcat-cafe-sandwiches': 'Sandwiches and wraps built for active families.',
  'pcat-cafe-toasts': 'Avocado toasts and open-faced favorites.',
  'pcat-cafe-kids-corner':
    'Easy-to-manage, balanced meals for little hands with wholesome sides.',
  'pcat-cafe-salads': 'Fresh salads and bowls for lighter cafe moments.',
  'pcat-cafe-snacks': 'Quick bites and shareable snacks on the go.',
  'pcat-cafe-take-out-link':
    'Grab-and-go salads, snacks, and lighter bites for takeout at Discovery Town.',
  'pcat-takeout-party':
    'Party-ready cafe food, desserts, and decor for pickup or delivery.',
}

export const CAFE_CATEGORY_CARD_META: Record<
  string,
  { readonly description: string; readonly imageSrc: string; readonly accent: HomeExploreCardAccent }
> = {
  'pcat-cafe-classic-hot': {
    description: CAFE_CATEGORY_DESCRIPTIONS['pcat-cafe-classic-hot'],
    imageSrc:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80',
    accent: 'accent',
  },
  'pcat-cafe-cold-brew': {
    description: CAFE_CATEGORY_DESCRIPTIONS['pcat-cafe-cold-brew'],
    imageSrc: '/categories/cafe-cold-brew.jpg',
    accent: 'primary',
  },
  'pcat-cafe-specialty-drinks': {
    description: CAFE_CATEGORY_DESCRIPTIONS['pcat-cafe-specialty-drinks'],
    imageSrc:
      'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=900&q=80',
    accent: 'chart-4',
  },
  'pcat-cafe-hot-drinks': {
    description: CAFE_CATEGORY_DESCRIPTIONS['pcat-cafe-hot-drinks'],
    imageSrc:
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=900&q=80',
    accent: 'chart-5',
  },
  'pcat-cafe-cold-drinks': {
    description: CAFE_CATEGORY_DESCRIPTIONS['pcat-cafe-cold-drinks'],
    imageSrc: '/categories/cafe-cold-drinks.jpg',
    accent: 'accent',
  },
  'pcat-cafe-frozen-treats': {
    description: CAFE_CATEGORY_DESCRIPTIONS['pcat-cafe-frozen-treats'],
    imageSrc:
      'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=900&q=80',
    accent: 'primary',
  },
  'pcat-cafe-pastries-baked': {
    description: CAFE_CATEGORY_DESCRIPTIONS['pcat-cafe-pastries-baked'],
    imageSrc:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&q=80',
    accent: 'chart-4',
  },
  'pcat-cafe-sweets-treats': {
    description: CAFE_CATEGORY_DESCRIPTIONS['pcat-cafe-sweets-treats'],
    imageSrc: '/categories/cafe-sweets-treats.jpg',
    accent: 'chart-5',
  },
  'pcat-cafe-baked-food': {
    description: CAFE_CATEGORY_DESCRIPTIONS['pcat-cafe-baked-food'],
    imageSrc:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80',
    accent: 'accent',
  },
  'pcat-cafe-pizza': {
    description: CAFE_CATEGORY_DESCRIPTIONS['pcat-cafe-pizza'],
    imageSrc:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&q=80',
    accent: 'primary',
  },
  'pcat-cafe-sandwiches': {
    description: CAFE_CATEGORY_DESCRIPTIONS['pcat-cafe-sandwiches'],
    imageSrc:
      'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=900&q=80',
    accent: 'chart-4',
  },
  'pcat-cafe-toasts': {
    description: CAFE_CATEGORY_DESCRIPTIONS['pcat-cafe-toasts'],
    imageSrc:
      'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=900&q=80',
    accent: 'chart-5',
  },
  'pcat-cafe-kids-corner': {
    description: CAFE_CATEGORY_DESCRIPTIONS['pcat-cafe-kids-corner'],
    imageSrc:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80',
    accent: 'accent',
  },
  'pcat-cafe-salads': {
    description: CAFE_CATEGORY_DESCRIPTIONS['pcat-cafe-salads'],
    imageSrc:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&q=80',
    accent: 'primary',
  },
  'pcat-cafe-snacks': {
    description: CAFE_CATEGORY_DESCRIPTIONS['pcat-cafe-snacks'],
    imageSrc: '/categories/cafe-snacks.jpg',
    accent: 'chart-4',
  },
  'pcat-cafe-take-out-link': {
    description: CAFE_CATEGORY_DESCRIPTIONS['pcat-cafe-take-out-link'],
    imageSrc:
      'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=900&q=80',
    accent: 'chart-5',
  },
  'pcat-takeout-party': {
    description: CAFE_CATEGORY_DESCRIPTIONS['pcat-takeout-party'],
    imageSrc:
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=900&q=80',
    accent: 'accent',
  },
}

function resolveCafeCategoryImageSrc(
  category: CafeCategoryCardFields,
  staticFallbackImageSrc?: string,
): string {
  const configured = category.imageUrl?.trim()
  if (configured) {
    return configured
  }
  return staticFallbackImageSrc ?? SCHEDULING_CATEGORY_DEFAULT_IMAGE
}

function resolveCafeCategoryDescription(
  category: CafeCategoryCardFields,
  staticFallbackDescription?: string,
): string {
  const configured = category.description?.trim()
  if (configured) {
    return configured
  }
  if (staticFallbackDescription) {
    return staticFallbackDescription
  }
  return `Explore ${category.name.toLowerCase()} at Discovery Town Cafe.`
}

export function resolveCafeCategoryCardMeta(
  category: CafeCategoryCardFields,
  index: number,
): CafeCategoryCardMeta {
  const known = CAFE_CATEGORY_CARD_META[category.id]
  return {
    description: resolveCafeCategoryDescription(
      category,
      known?.description ?? CAFE_CATEGORY_DESCRIPTIONS[category.id],
    ),
    imageSrc: resolveCafeCategoryImageSrc(category, known?.imageSrc),
    accent:
      known?.accent ??
      SCHEDULING_CATEGORY_ACCENT_CYCLE[index % SCHEDULING_CATEGORY_ACCENT_CYCLE.length],
  }
}
