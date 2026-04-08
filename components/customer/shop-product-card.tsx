/** ShopProductCard — product tile for the consumer shop grid. */
'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, Plus } from 'lucide-react'

import { StockStatusBadge } from '@/components/admin/stock-status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatPrice } from '@/lib/utils'
import { useInventory } from '@/lib/inventory-store'
import type { Product } from '@/lib/types'

const SHOP_FALLBACK_SRC = '/placeholder.jpg'
const PLACEHOLDER_SRC = '/placeholder.jpg'

export interface ShopProductCardProps {
  readonly product: Product
  readonly className?: string
}

export function ShopProductCard({ product, className }: Readonly<ShopProductCardProps>) {
  const { addToCart, cart } = useInventory()
  const [usePlaceholder, setUsePlaceholder] = useState(false)

  const inCartQty = useMemo(() => {
    return cart.items
      .filter((i) => i.type === 'product' && i.metadata?.productId === product.id)
      .reduce((s, i) => s + i.quantity, 0)
  }, [cart.items, product.id])

  const imageSrc = usePlaceholder
    ? PLACEHOLDER_SRC
    : product.imageUrl ?? SHOP_FALLBACK_SRC
  const compareAt = product.compareAtPrice ?? null
  const unitPrice = product.memberPrice ?? product.price
  const savings = compareAt != null && compareAt > unitPrice ? compareAt - unitPrice : null

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
            <Badge className="bg-background text-foreground text-xs">
              {product.category?.name ?? 'Shop'}
            </Badge>
            {savings != null ? (
              <Badge className="bg-accent text-accent-foreground text-xs font-semibold">
                Save {formatPrice(savings)}
              </Badge>
            ) : null}
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
          <p className="text-xs text-muted-foreground">{product.sku ?? '—'}</p>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="space-y-1">
            {compareAt != null ? (
              <p className="text-xs text-muted-foreground line-through">
                {formatPrice(compareAt)}
              </p>
            ) : null}
            <p
              className="text-lg font-black text-foreground"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              {formatPrice(unitPrice)}
            </p>
            {product.memberPrice != null ? (
              <p className="text-xs font-semibold text-accent">
                Member {formatPrice(product.memberPrice)}
              </p>
            ) : null}
          </div>

          <StockStatusBadge product={product} />
        </div>

        <Button
          size="sm"
          className={cn(
            'w-full font-semibold transition-all',
            inCartQty > 0
              ? 'bg-green-600 text-white hover:bg-green-600'
              : 'bg-accent text-accent-foreground hover:bg-accent/90',
          )}
          onClick={() => addToCart({ product })}
        >
          {inCartQty > 0 ? (
            <>
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Added ({inCartQty})
            </>
          ) : (
            <>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add to cart
            </>
          )}
        </Button>
      </div>
    </article>
  )
}

