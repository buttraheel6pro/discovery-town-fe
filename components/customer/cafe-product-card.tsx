/** Cafe menu card — subtype, attribute chips, prep, notes, View Details. */
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { StickyNote } from 'lucide-react'
import { useMemo } from 'react'

import { CafeAttributeChip } from '@/components/customer/cafe-attribute-chip'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { resolveAttributeOptionsForProduct } from '@/lib/cafe-utils'
import { cn, formatPrice } from '@/lib/utils'
import type { AttributeGroup, CafeProduct } from '@/lib/types'

export interface CafeProductCardProps {
  readonly product: CafeProduct
  readonly attributeGroups: AttributeGroup[]
  readonly soldOut?: boolean
}

export function CafeProductCard({
  product,
  attributeGroups,
  soldOut = false,
}: Readonly<CafeProductCardProps>) {
  const chips = useMemo(
    () => resolveAttributeOptionsForProduct(product, attributeGroups),
    [product, attributeGroups],
  )
  const notes = product.notes?.trim() ?? ''
  const prep = product.preparationTimeMinutes ?? 0

  return (
    <article
      className={cn(
        'group overflow-hidden rounded-xl border border-border bg-card transition-all duration-300',
        soldOut ? 'opacity-70' : 'hover:-translate-y-0.5 hover:shadow-lg',
      )}
    >
      <Link href={`/shop/${product.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          <Image
            src={product.imageUrl ?? '/placeholder.jpg'}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              {product.category}
            </Badge>
            {soldOut ? (
              <Badge variant="destructive" className="text-xs">
                Sold out today
              </Badge>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="space-y-3 p-5">
        <div className="space-y-1">
          <Link href={`/shop/${product.id}`}>
            <h3
              className="text-base font-bold leading-tight text-foreground"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              {product.name}
            </h3>
          </Link>
          {product.subtype?.trim() ? (
            <div className="inline-flex w-fit items-center rounded-md border border-border bg-muted/40 px-2.5 py-1.5">
              <p className="text-xs font-semibold text-foreground">{product.subtype}</p>
            </div>
          ) : null}
        </div>

        {chips.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <CafeAttributeChip key={c.id} option={c} />
            ))}
          </div>
        ) : null}

        {prep > 0 ? (
          <p className="text-xs text-muted-foreground">Prep: ~{prep} min</p>
        ) : null}

        <div className="flex items-end justify-between gap-3">
          <p className="text-lg font-bold text-foreground">from {formatPrice(product.basePrice)}</p>
          <div className="flex items-center gap-2">
            {notes.length > 0 ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground" aria-label="Staff notes">
                      <StickyNote className="h-4 w-4" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">{notes}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
            {soldOut ? (
              <Button type="button" size="sm" disabled>
                View Details
              </Button>
            ) : (
              <Button type="button" size="sm" asChild>
                <Link href={`/shop/${product.id}`}>View Details</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
