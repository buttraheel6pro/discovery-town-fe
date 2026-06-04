/** ShopProductCard — product tile for the consumer shop grid. */
'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { StockStatusBadge } from '@/components/admin/stock-status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatPrice } from '@/lib/utils'
import { useInventory } from '@/lib/inventory-store'
import { isRentalProduct } from '@/lib/rental-product'
import type { Product } from '@/lib/types'

const SHOP_FALLBACK_SRC = '/placeholder.jpg'
const PLACEHOLDER_SRC = '/placeholder.jpg'

export interface ShopProductCardProps {
  readonly product: Product
  readonly className?: string
}

export function ShopProductCard({ product, className }: Readonly<ShopProductCardProps>) {
  const { productCategories } = useInventory()
  const [usePlaceholder, setUsePlaceholder] = useState(false)

  const imageSrc = usePlaceholder
    ? PLACEHOLDER_SRC
    : product.imageUrl ?? SHOP_FALLBACK_SRC
  const isGiftProduct = useMemo(() => {
    const category = productCategories.find((row) => row.id === product.categoryId) ?? null
    return (category?.productType ?? '').toLowerCase() === 'gifts'
  }, [product.categoryId, productCategories])
  const isRental = useMemo(() => isRentalProduct(product), [product])
  const compareAt = product.compareAtPrice ?? null
  const unitPrice = product.memberPrice ?? product.price
  const giftUpper = product.giftPriceUpperLimit ?? null
  const showGiftPriceRange =
    isGiftProduct &&
    giftUpper != null &&
    Number.isFinite(giftUpper) &&
    giftUpper > unitPrice
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
              {showGiftPriceRange
                ? `${formatPrice(unitPrice)}–${formatPrice(giftUpper)}`
                : formatPrice(unitPrice)}
            </p>
            {product.memberPrice != null ? (
              <p className="text-xs font-semibold text-accent">
                Member {formatPrice(product.memberPrice)}
              </p>
            ) : null}
          </div>

          <StockStatusBadge product={product} />
        </div>

        <Button asChild size="sm" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href={`/shop/${product.id}`}>View details</Link>
        </Button>
      </div>
    </article>
  )
}

