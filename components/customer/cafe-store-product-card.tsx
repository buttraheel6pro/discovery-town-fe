/** Cafe store card — matches ShopProductCard styling but uses cafe flow (View details → customiser). */
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { resolveAttributeOptionsForProduct } from '@/lib/cafe-utils'
import { cn, formatPrice } from '@/lib/utils'
import type { AttributeGroup, CafeProduct } from '@/lib/types'

const PLACEHOLDER_SRC = '/placeholder.jpg'

export interface CafeStoreProductCardProps {
  readonly product: CafeProduct
  readonly attributeGroups: AttributeGroup[]
  readonly className?: string
}

export function CafeStoreProductCard({
  product,
  attributeGroups,
  className,
}: Readonly<CafeStoreProductCardProps>) {
  const [usePlaceholder, setUsePlaceholder] = useState(false)
  const imageSrc = usePlaceholder ? PLACEHOLDER_SRC : product.imageUrl ?? PLACEHOLDER_SRC

  const chips = useMemo(
    () => resolveAttributeOptionsForProduct(product, attributeGroups),
    [attributeGroups, product],
  )

  return (
    <article
      className={cn(
        'group overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg',
        className,
      )}
    >
      <Link href={`/shop/${product.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
            onError={() => setUsePlaceholder(true)}
          />
          <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
            <Badge className="bg-background text-foreground text-xs">{product.category}</Badge>
          </div>
        </div>
      </Link>

      <div className="space-y-3 p-5">
        <div className="space-y-1">
          <Link href={`/shop/${product.id}`} className="block">
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
          {chips.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {chips.slice(0, 3).map((c) => (
                <Badge key={c.id} variant="secondary" className="text-xs">
                  {c.emoji} {c.label}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="space-y-1">
            <p
              className="text-lg font-black text-foreground"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              {formatPrice(product.basePrice)}
            </p>
            {product.preparationTimeMinutes != null && product.preparationTimeMinutes > 0 ? (
              <p className="text-xs text-muted-foreground">
                Prep: ~{product.preparationTimeMinutes} min
              </p>
            ) : null}
          </div>
        </div>

        <Button
          asChild
          size="sm"
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Link href={`/shop/${product.id}`}>View details</Link>
        </Button>
      </div>
    </article>
  )
}

