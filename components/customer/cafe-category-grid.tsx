/** Category tiles for cafe landing — routes to slug-based menu pages. */
'use client'

import Link from 'next/link'

import { cn } from '@/lib/utils'
import { cafeCategoryToSlug } from '@/lib/cafe-utils'
import type { CafeCategory } from '@/lib/types'

const TILES: Array<{ category: CafeCategory; emoji: string }> = [
  { category: 'Coffee', emoji: '☕' },
  { category: 'Cold Drinks', emoji: '🧊' },
  { category: 'Specialty', emoji: '✨' },
  { category: 'Pizza', emoji: '🍕' },
  { category: 'Sandwiches', emoji: '🥪' },
  { category: 'Kids Corner', emoji: '🧒' },
  { category: 'Salads & Snacks', emoji: '🥗' },
  { category: 'Sweets', emoji: '🍪' },
]

export interface CafeCategoryGridProps {
  readonly className?: string
}

export function CafeCategoryGrid({ className }: Readonly<CafeCategoryGridProps>) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4',
        className,
      )}
    >
      {TILES.map((tile) => {
        const slug = cafeCategoryToSlug(tile.category)
        return (
          <Link
            key={tile.category}
            href={`/cafe/${slug}`}
            className={cn(
              'flex flex-col items-center justify-center rounded-xl border border-border bg-card p-4 text-center',
              'transition-colors hover:border-primary/40 hover:bg-accent/30',
            )}
          >
            <span className="text-2xl" aria-hidden>
              {tile.emoji}
            </span>
            <span className="mt-2 text-sm font-semibold leading-tight">{tile.category}</span>
          </Link>
        )
      })}
    </div>
  )
}
