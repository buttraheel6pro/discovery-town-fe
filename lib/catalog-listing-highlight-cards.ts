/** Highlight cards below menu landing category grids — per-module copy can override defaults. */

import type { MenuLandingHeroKey } from '@/lib/menu-landing-hero-config'

export type CatalogListingModuleKey = MenuLandingHeroKey | 'default'

export type CatalogListingHighlightCardTheme = 'pink' | 'yellow' | 'blue' | 'peach'

export type CatalogListingHighlightCardIcon = 'image-16' | 'image-new' | 'image-4'

export const CATALOG_LISTING_HIGHLIGHT_PUBLIC_ICONS = {
  'image-16': { src: '/image 16.svg', width: 85, height: 80 },
  'image-new': { src: '/new.png', width: 101, height: 98 },
  'image-4': { src: '/image 4.svg', width: 107, height: 99 },
} as const satisfies Record<
  CatalogListingHighlightCardIcon,
  { readonly src: string; readonly width: number; readonly height: number }
>

export const CATALOG_LISTING_HIGHLIGHT_BLUE_CARD_COLOR = '#EBF2FF'
export const CATALOG_LISTING_HIGHLIGHT_CREAM_CARD_COLOR = '#FFF0CB'

export const CATALOG_LISTING_HIGHLIGHT_CARD_ICON_SIZE_PX = 56

export interface CatalogListingHighlightCard {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly theme: CatalogListingHighlightCardTheme
  readonly icon: CatalogListingHighlightCardIcon
}

export const DEFAULT_CATALOG_LISTING_HIGHLIGHT_DESCRIPTION =
  'Quisque eget tortor posuere, aliquet arcu ut, molestie nunc.'

/** Figma-aligned highlight card dimensions for menu landing rows. */
export const CATALOG_LISTING_HIGHLIGHT_CARD_LAYOUT = {
  widthPx: 299,
  heightPx: 209,
  radiusPx: 36,
} as const

/** Figma-aligned heading text on highlight cards. */
export const CATALOG_LISTING_HIGHLIGHT_CARD_HEADING_STYLE = {
  fontFamily: 'var(--font-mukta)',
  fontWeight: 700,
  fontSize: '18px',
  lineHeight: '27px',
  letterSpacing: '0',
} as const

/** Figma-aligned body text on highlight cards. */
export const CATALOG_LISTING_HIGHLIGHT_CARD_TEXT_STYLE = {
  fontFamily: 'var(--font-mukta)',
  fontWeight: 700,
  fontSize: '14.4px',
  lineHeight: '18px',
  letterSpacing: '0',
} as const

export const CATALOG_LISTING_HIGHLIGHT_CARD_PARAGRAPH_SPACING_PX = 9

const DEFAULT_CATALOG_LISTING_HIGHLIGHT_CARDS: readonly CatalogListingHighlightCard[] = [
  {
    id: 'learning-through-play',
    title: 'Learning Through Play',
    description: DEFAULT_CATALOG_LISTING_HIGHLIGHT_DESCRIPTION,
    theme: 'pink',
    icon: 'image-16',
  },
  {
    id: 'imaginative-play',
    title: 'Imaginative Play',
    description: DEFAULT_CATALOG_LISTING_HIGHLIGHT_DESCRIPTION,
    theme: 'yellow',
    icon: 'image-new',
  },
  {
    id: 'memories-that-last',
    title: 'Memories That Last',
    description: DEFAULT_CATALOG_LISTING_HIGHLIGHT_DESCRIPTION,
    theme: 'blue',
    icon: 'image-4',
  },
  {
    id: 'great-coffee',
    title: 'Great Coffee',
    description: DEFAULT_CATALOG_LISTING_HIGHLIGHT_DESCRIPTION,
    theme: 'peach',
    icon: 'image-new',
  },
] as const

const MODULE_CATALOG_LISTING_HIGHLIGHT_CARDS: Partial<
  Record<CatalogListingModuleKey, readonly CatalogListingHighlightCard[]>
> = {
  // Future: per-module overrides, e.g. shop: [...]
}

/** Returns highlight cards for a menu landing page. */
export function getCatalogListingHighlightCards(
  moduleKey: CatalogListingModuleKey = 'default',
): readonly CatalogListingHighlightCard[] {
  return MODULE_CATALOG_LISTING_HIGHLIGHT_CARDS[moduleKey] ?? DEFAULT_CATALOG_LISTING_HIGHLIGHT_CARDS
}
