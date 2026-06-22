/** Reusable scrollable catalog item list — image-hover preview, price, and one-line description. */
'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

export const CATALOG_ITEM_LIST_IMAGE_FALLBACK = '/placeholder.jpg'

export const CATALOG_ITEM_LIST_DEFAULT_DESCRIPTION =
  'Select an item to view details. Hover the image for a preview.'

export interface CatalogItemNameListItem {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly priceLabel: string
  readonly href: string
  readonly renderPreview: () => ReactNode
}

export interface CatalogItemNameListProps {
  readonly items: readonly CatalogItemNameListItem[]
  readonly isLoading?: boolean
  readonly categoryName?: string
  readonly listHeadingSuffix?: string
  readonly listDescription?: string
  readonly emptyMessage?: string
  readonly listAriaLabel?: string
  readonly loadingAriaLabel?: string
}

export function CatalogItemNameList({
  items,
  isLoading = false,
  categoryName,
  listHeadingSuffix = 'items',
  listDescription = CATALOG_ITEM_LIST_DEFAULT_DESCRIPTION,
  emptyMessage = 'No items available in this category yet.',
  listAriaLabel = 'Catalog items',
  loadingAriaLabel = 'Loading items',
}: Readonly<CatalogItemNameListProps>) {
  const listHeading = categoryName ? `${categoryName} ${listHeadingSuffix}` : listHeadingSuffix

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="shrink-0 border-b border-border px-4 py-3">
        <h3 className="text-sm font-bold text-foreground">{listHeading}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{listDescription}</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 py-2 [overflow-anchor:none]">
        {isLoading ? (
          <ul className="space-y-2 pb-2" aria-busy="true" aria-label={loadingAriaLabel}>
            {Array.from({ length: 5 }).map((_, index) => (
              <li
                key={index}
                className="flex h-[5.25rem] animate-pulse items-center gap-4 rounded-lg bg-muted/50 px-4"
                aria-hidden
              >
                <div className="h-14 w-14 shrink-0 rounded-lg bg-muted" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                </div>
                <div className="h-4 w-12 shrink-0 rounded bg-muted" />
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ul className="space-y-2 pb-2" aria-label={listAriaLabel}>
            {items.map((item) => (
              <li key={item.id}>
                <div
                  className={cn(
                    'flex min-h-[5.25rem] w-full items-center gap-2 rounded-lg border border-transparent',
                    'bg-background transition-colors hover:bg-muted/40',
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4 px-4 py-3">
                    {item.renderPreview()}

                    <Link href={item.href} className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold leading-snug text-foreground">
                        {item.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </Link>
                  </div>

                  <div className="shrink-0 pr-4 text-sm font-bold tabular-nums text-foreground">
                    {item.priceLabel}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
