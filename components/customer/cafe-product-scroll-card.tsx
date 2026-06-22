/** Horizontal-rail card for cafe products — image, name, price, add-to-cart CTA. */
'use client'

import Image from 'next/image'
import { ShoppingCart } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PublicProduct } from '@/lib/api/cafe.api'

interface CafeProductScrollCardProps {
  readonly product: PublicProduct
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

export function CafeProductScrollCard({ product }: CafeProductScrollCardProps) {
  return (
    <div
      className={cn(
        'w-[260px] sm:w-[280px] flex-shrink-0 flex flex-col rounded-xl border border-border bg-card overflow-hidden',
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="280px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/30">
            <ShoppingCart className="h-10 w-10" />
          </div>
        )}
        {product.isFeatured ? (
          <Badge className="absolute left-2 top-2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5">
            Featured
          </Badge>
        ) : null}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {product.name}
        </p>

        {product.description ? (
          <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-base font-bold text-foreground">{formatPrice(product.price)}</span>
          <Button type="button" size="sm" className="h-7 px-3 text-xs gap-1">
            <ShoppingCart className="h-3 w-3" />
            Add
          </Button>
        </div>
      </div>
    </div>
  )
}
