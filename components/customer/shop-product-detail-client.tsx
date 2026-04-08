/** Shop product detail client — quantity + add/buy actions, gallery, related products. */
'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus, ShoppingCart } from 'lucide-react'

import { StockStatusBadge } from '@/components/admin/stock-status-badge'
import { ShopImageGallery } from '@/components/customer/shop-image-gallery'
import { ShopProductCard } from '@/components/customer/shop-product-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn, formatPrice, getStockStatus } from '@/lib/utils'
import { useInventory } from '@/lib/inventory-store'
import type { Product } from '@/lib/types'

export interface ShopProductDetailClientProps {
  readonly product: Product | null
  readonly related: Product[]
  readonly categoryName: string | null
}

export function ShopProductDetailClient({
  product,
  related,
  categoryName,
}: Readonly<ShopProductDetailClientProps>) {
  const router = useRouter()
  const { addToCart } = useInventory()

  const [qtyRaw, setQtyRaw] = useState('1')

  const qty = useMemo(() => {
    const parsed = Number.parseInt(qtyRaw || '1', 10)
    if (!Number.isFinite(parsed) || parsed <= 0) return 1
    return parsed
  }, [qtyRaw])

  if (!product) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <p className="text-sm font-semibold text-foreground">Product not found.</p>
        <p className="mt-1 text-sm text-muted-foreground">Try browsing the shop instead.</p>
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={() => router.push('/shop')}>
            Back to shop
          </Button>
        </div>
      </div>
    )
  }

  const shopProduct = product

  const status = getStockStatus(shopProduct)
  const unitPrice = shopProduct.memberPrice ?? shopProduct.price
  const compareAt = shopProduct.compareAtPrice ?? null
  const savings = compareAt != null && compareAt > unitPrice ? compareAt - unitPrice : null

  const maxQty =
    shopProduct.allowBackorders || shopProduct.stockCount <= 0
      ? undefined
      : Math.max(1, shopProduct.stockCount)

  function dec() {
    setQtyRaw(String(Math.max(1, qty - 1)))
  }

  function inc() {
    const next = qty + 1
    if (maxQty != null && next > maxQty) return
    setQtyRaw(String(next))
  }

  function add() {
    addToCart({ product: shopProduct, quantity: qty })
  }

  function buyNow() {
    add()
    router.push('/cart')
  }

  const images = [
    shopProduct.imageUrl ?? '',
    ...(shopProduct.galleryUrls ?? shopProduct.galleryImages ?? []),
  ]

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ShopImageGallery images={images} alt={shopProduct.name} />
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24 space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {categoryName ?? 'Shop'}
              </p>
              <h1
                className="text-3xl font-black tracking-tight text-foreground"
                style={{ fontFamily: 'var(--font-barlow)' }}
              >
                {shopProduct.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                {shopProduct.sku ? (
                  <span className="inline-flex rounded-md bg-muted px-2 py-1 font-mono text-xs text-foreground">
                    {shopProduct.sku}
                  </span>
                ) : null}
                <StockStatusBadge product={shopProduct} />
                {status === 'LOW_STOCK' ? (
                  <span className="text-xs font-semibold text-amber-700">
                    Only {shopProduct.stockCount} left
                  </span>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-end gap-3">
                <p
                  className="text-3xl font-black text-foreground"
                  style={{ fontFamily: 'var(--font-barlow)' }}
                >
                  {formatPrice(unitPrice)}
                </p>
                {compareAt != null ? (
                  <p className="text-sm text-muted-foreground line-through">
                    {formatPrice(compareAt)}
                  </p>
                ) : null}
                {savings != null ? (
                  <span className="inline-flex rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                    Save {formatPrice(savings)}
                  </span>
                ) : null}
              </div>
              {shopProduct.memberPrice != null ? (
                <p className="text-sm font-semibold text-accent">
                  Member price: {formatPrice(shopProduct.memberPrice)}
                </p>
              ) : null}
              {shopProduct.taxable ? (
                <p className="text-xs text-muted-foreground">
                  Price includes {shopProduct.taxRate ?? 20}% tax
                </p>
              ) : null}
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">Quantity</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={dec} aria-label="Decrease quantity">
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  value={qtyRaw}
                  onChange={(e) => setQtyRaw(e.target.value)}
                  className="h-9 w-20 text-center"
                  inputMode="numeric"
                  aria-label="Quantity"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={inc}
                  aria-label="Increase quantity"
                  disabled={maxQty != null && qty >= maxQty}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                onClick={add}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to cart
              </Button>
              <Button variant="outline" className="font-semibold" onClick={buyNow}>
                Buy now
              </Button>
            </div>

            {shopProduct.description ? (
              <div
                className={cn('prose prose-sm max-w-none dark:prose-invert')}
                dangerouslySetInnerHTML={{ __html: shopProduct.description }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>
        </div>
      </div>

      {related.length ? (
        <section className="space-y-4">
          <h2
            className="text-xl font-black text-foreground"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            You might also like
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <ShopProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

