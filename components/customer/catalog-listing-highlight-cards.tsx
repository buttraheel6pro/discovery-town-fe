/** Pastel highlight cards in one row below menu landing category grids. */
'use client'

import Image from 'next/image'

import {
  CATALOG_LISTING_HIGHLIGHT_BLUE_CARD_COLOR,
  CATALOG_LISTING_HIGHLIGHT_CARD_HEADING_STYLE,
  CATALOG_LISTING_HIGHLIGHT_CARD_ICON_SIZE_PX,
  CATALOG_LISTING_HIGHLIGHT_CARD_LAYOUT,
  CATALOG_LISTING_HIGHLIGHT_CARD_PARAGRAPH_SPACING_PX,
  CATALOG_LISTING_HIGHLIGHT_CARD_TEXT_STYLE,
  CATALOG_LISTING_HIGHLIGHT_CREAM_CARD_COLOR,
  CATALOG_LISTING_HIGHLIGHT_PUBLIC_ICONS,
  getCatalogListingHighlightCards,
  type CatalogListingHighlightCard,
  type CatalogListingHighlightCardTheme,
  type CatalogListingModuleKey,
} from '@/lib/catalog-listing-highlight-cards'
import { cn } from '@/lib/utils'

const { widthPx, heightPx, radiusPx } = CATALOG_LISTING_HIGHLIGHT_CARD_LAYOUT

const THEME_CLASS_NAMES: Record<
  CatalogListingHighlightCard['theme'],
  { readonly card: string; readonly description: string }
> = {
  pink: {
    card: 'bg-highlight-pink text-foreground',
    description: 'text-highlight-pink-fg',
  },
  yellow: {
    card: 'text-foreground',
    description: 'text-highlight-yellow-fg',
  },
  blue: {
    card: 'bg-highlight-blue text-foreground',
    description: 'text-highlight-blue-fg',
  },
  peach: {
    card: 'text-foreground',
    description: 'text-highlight-peach-fg',
  },
}

const CARD_BACKGROUND_COLORS: Partial<Record<CatalogListingHighlightCardTheme, string>> = {
  blue: CATALOG_LISTING_HIGHLIGHT_BLUE_CARD_COLOR,
  yellow: CATALOG_LISTING_HIGHLIGHT_CREAM_CARD_COLOR,
  peach: CATALOG_LISTING_HIGHLIGHT_CREAM_CARD_COLOR,
}

export interface CatalogListingHighlightCardsProps {
  readonly moduleKey?: CatalogListingModuleKey
  readonly className?: string
}

export function CatalogListingHighlightCards({
  moduleKey = 'default',
  className,
}: Readonly<CatalogListingHighlightCardsProps>) {
  const cards = getCatalogListingHighlightCards(moduleKey)

  return (
    <div
      className={cn(
        'flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1',
        'lg:flex-wrap lg:justify-between lg:overflow-visible lg:pb-0',
        className,
      )}
      aria-label="Discovery Town highlights"
    >
      {cards.map((card) => {
        const theme = THEME_CLASS_NAMES[card.theme]
        const icon = CATALOG_LISTING_HIGHLIGHT_PUBLIC_ICONS[card.icon]
        const backgroundColor = CARD_BACKGROUND_COLORS[card.theme]

        return (
          <article
            key={card.id}
            className={cn(
              'flex shrink-0 snap-start flex-col p-5',
              theme.card,
            )}
            style={{
              width: widthPx,
              height: heightPx,
              borderRadius: radiusPx,
              gap: CATALOG_LISTING_HIGHLIGHT_CARD_PARAGRAPH_SPACING_PX,
              ...(backgroundColor ? { backgroundColor } : {}),
            }}
          >
            <div className="flex items-center gap-3">
              <Image
                src={icon.src}
                alt=""
                aria-hidden
                width={icon.width}
                height={icon.height}
                className="shrink-0 object-contain"
                style={{
                  width: CATALOG_LISTING_HIGHLIGHT_CARD_ICON_SIZE_PX,
                  height: CATALOG_LISTING_HIGHLIGHT_CARD_ICON_SIZE_PX,
                }}
              />
              <h4 className="m-0 min-w-0" style={CATALOG_LISTING_HIGHLIGHT_CARD_HEADING_STYLE}>
                {card.title}
              </h4>
            </div>
            <p
              className={cn('m-0', theme.description)}
              style={CATALOG_LISTING_HIGHLIGHT_CARD_TEXT_STYLE}
            >
              {card.description}
            </p>
          </article>
        )
      })}
    </div>
  )
}
