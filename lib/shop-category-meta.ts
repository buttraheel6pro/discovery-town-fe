/** Shop sub-category card metadata — admin imageUrl overrides static fallbacks. */
import type { HomeExploreCardAccent } from '@/components/customer/home-explore-card'
import type { ShopConsumerCategory } from '@/lib/shop-consumer-categories'
import {
  SCHEDULING_CATEGORY_ACCENT_CYCLE,
  SCHEDULING_CATEGORY_DEFAULT_IMAGE,
} from '@/lib/scheduling-category-card-meta'

export interface ShopCategoryCardMeta {
  readonly description: string
  readonly imageSrc: string
  readonly accent: HomeExploreCardAccent
}

export type ShopCategoryCardFields = Pick<
  ShopConsumerCategory,
  'id' | 'name' | 'description' | 'imageUrl'
>

export const SHOP_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'pcat-shop-apparel': 'Official Discovery Town tees, hoodies, and everyday wear.',
  'pcat-shop-headwear': 'Caps, beanies, and headwear for every season.',
  'pcat-shop-gear': 'Training gear, equipment, and active essentials.',
  'pcat-shop-footwear': 'Comfortable footwear for play, gym, and daily wear.',
  'pcat-shop-bags': 'Backpacks, totes, and carry-all bags for busy families.',
  'pcat-shop-water': 'Water bottles, hydration gear, and on-the-go drinkware.',
  'pcat-shop-toys': 'Toys, games, and playful picks for explorers of all ages.',
  'pcat-shop-accessories': 'Pins, patches, and finishing touches for fans.',
  'pcat-shop-wellness': 'Recovery, self-care, and wellness favorites.',
  'pcat-shop-gifts': 'Curated gift sets for birthdays, holidays, and thank-yous.',
  'pcat-shop-clothes': 'Comfortable clothes for kids and families on the go.',
  'pcat-shop-furniture': 'Functional furniture and home pieces from Discovery Town.',
}

export const SHOP_CATEGORY_CARD_META: Record<
  string,
  { readonly description: string; readonly imageSrc: string; readonly accent: HomeExploreCardAccent }
> = {
  'pcat-shop-apparel': {
    description: SHOP_CATEGORY_DESCRIPTIONS['pcat-shop-apparel'],
    imageSrc: '/categories/shop-apparel.jpg',
    accent: 'accent',
  },
  'pcat-shop-headwear': {
    description: SHOP_CATEGORY_DESCRIPTIONS['pcat-shop-headwear'],
    imageSrc:
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=900&q=80',
    accent: 'primary',
  },
  'pcat-shop-gear': {
    description: SHOP_CATEGORY_DESCRIPTIONS['pcat-shop-gear'],
    imageSrc: '/categories/shop-gear.jpg',
    accent: 'chart-4',
  },
  'pcat-shop-footwear': {
    description: SHOP_CATEGORY_DESCRIPTIONS['pcat-shop-footwear'],
    imageSrc:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80',
    accent: 'chart-5',
  },
  'pcat-shop-bags': {
    description: SHOP_CATEGORY_DESCRIPTIONS['pcat-shop-bags'],
    imageSrc:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&q=80',
    accent: 'accent',
  },
  'pcat-shop-water': {
    description: SHOP_CATEGORY_DESCRIPTIONS['pcat-shop-water'],
    imageSrc:
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=900&q=80',
    accent: 'primary',
  },
  'pcat-shop-toys': {
    description: SHOP_CATEGORY_DESCRIPTIONS['pcat-shop-toys'],
    imageSrc: '/categories/shop-toys.jpg',
    accent: 'chart-4',
  },
  'pcat-shop-accessories': {
    description: SHOP_CATEGORY_DESCRIPTIONS['pcat-shop-accessories'],
    imageSrc: '/categories/shop-accessories.jpg',
    accent: 'chart-5',
  },
  'pcat-shop-wellness': {
    description: SHOP_CATEGORY_DESCRIPTIONS['pcat-shop-wellness'],
    imageSrc:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=900&q=80',
    accent: 'accent',
  },
  'pcat-shop-gifts': {
    description: SHOP_CATEGORY_DESCRIPTIONS['pcat-shop-gifts'],
    imageSrc: '/categories/shop-gifts.jpg',
    accent: 'primary',
  },
  'pcat-shop-clothes': {
    description: SHOP_CATEGORY_DESCRIPTIONS['pcat-shop-clothes'],
    imageSrc: '/categories/shop-clothes.jpg',
    accent: 'chart-4',
  },
  'pcat-shop-furniture': {
    description: SHOP_CATEGORY_DESCRIPTIONS['pcat-shop-furniture'],
    imageSrc:
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&q=80',
    accent: 'chart-5',
  },
}

function resolveShopCategoryImageSrc(
  category: ShopCategoryCardFields,
  staticFallbackImageSrc?: string,
): string {
  const configured = category.imageUrl?.trim()
  if (configured) {
    return configured
  }
  return staticFallbackImageSrc ?? SCHEDULING_CATEGORY_DEFAULT_IMAGE
}

function resolveShopCategoryDescription(
  category: ShopCategoryCardFields,
  staticFallbackDescription?: string,
): string {
  const configured = category.description?.trim()
  if (configured) {
    return configured
  }
  if (staticFallbackDescription) {
    return staticFallbackDescription
  }
  return `Explore ${category.name.toLowerCase()} at the Discovery Town shop.`
}

export function resolveShopCategoryCardMeta(
  category: ShopCategoryCardFields,
  index: number,
): ShopCategoryCardMeta {
  const known = SHOP_CATEGORY_CARD_META[category.id]
  return {
    description: resolveShopCategoryDescription(
      category,
      known?.description ?? SHOP_CATEGORY_DESCRIPTIONS[category.id],
    ),
    imageSrc: resolveShopCategoryImageSrc(category, known?.imageSrc),
    accent:
      known?.accent ??
      SCHEDULING_CATEGORY_ACCENT_CYCLE[index % SCHEDULING_CATEGORY_ACCENT_CYCLE.length],
  }
}
