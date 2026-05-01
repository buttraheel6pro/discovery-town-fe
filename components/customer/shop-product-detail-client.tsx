/** Shop product detail client — quantity + add/buy actions, gallery, related products. */
'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Minus, Plus, ShoppingCart } from 'lucide-react'

import { StockStatusBadge } from '@/components/admin/stock-status-badge'
import { ShopImageGallery } from '@/components/customer/shop-image-gallery'
import { ShopProductCard } from '@/components/customer/shop-product-card'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn, formatPrice, getStockStatus } from '@/lib/utils'
import { useInventory } from '@/lib/inventory-store'
import type { Product } from '@/lib/types'

export interface ShopProductDetailClientProps {
  readonly product: Product | null
  readonly related: Product[]
  readonly relatedTitle?: string
  readonly categoryName: string | null
  readonly isGiftProduct?: boolean
  readonly linkedProducts?: Product[]
  readonly linkedAddOnProducts?: Product[]
  readonly linkedCoupons?: Array<{ id: string; code: string; name: string; description?: string }>
}

export function ShopProductDetailClient({
  product,
  related,
  relatedTitle = 'You might also like',
  categoryName,
  isGiftProduct = false,
  linkedProducts = [],
  linkedAddOnProducts = [],
  linkedCoupons = [],
}: Readonly<ShopProductDetailClientProps>) {
  const router = useRouter()
  const { addToCart, addCustomCartItem } = useInventory()

  const [qtyRaw, setQtyRaw] = useState('1')
  const [selectedGiftQuantity, setSelectedGiftQuantity] = useState(0)
  const [selectedRelatedQuantities, setSelectedRelatedQuantities] = useState<Record<string, number>>({})

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
  const totalPrice = unitPrice * qty

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
    if (isGiftProduct) {
      if (selectedGiftQuantity <= 0) {
        return
      }
      const selectedAddOns = Object.entries(selectedRelatedQuantities)
        .map(([relatedId, quantity]) => {
          const product = related.find((row) => row.id === relatedId) ?? null
          if (!product || quantity <= 0) return null
          return {
            productId: product.id,
            name: product.name,
            imageUrl: product.imageUrl ?? '/placeholder.jpg',
            unitPrice: product.memberPrice ?? product.price,
            quantity,
          }
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      const totalPrice =
        unitPrice * selectedGiftQuantity +
        selectedAddOns.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

      addCustomCartItem({
        type: 'product',
        name: `${shopProduct.name} bundle`,
        description: `${selectedGiftQuantity} gift item(s), ${selectedAddOns.length} add-on type(s)`,
        price: totalPrice,
        quantity: 1,
        imageUrl: shopProduct.imageUrl ?? '/placeholder.jpg',
        metadata: {
          giftBundle: true,
          primary: {
            productId: shopProduct.id,
            name: shopProduct.name,
            imageUrl: shopProduct.imageUrl ?? '/placeholder.jpg',
            unitPrice,
            quantity: selectedGiftQuantity,
          },
          addOns: selectedAddOns,
        },
      })
      return
    }

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
  const selectedRelatedRows = related
    .filter((row) => (selectedRelatedQuantities[row.id] ?? 0) > 0)
    .map((row) => ({
      product: row,
      quantity: selectedRelatedQuantities[row.id] ?? 0,
      unitPrice: row.memberPrice ?? row.price,
    }))
  const selectedRelatedTotal = selectedRelatedRows.reduce(
    (sum, row) => sum + row.unitPrice * row.quantity,
    0,
  )
  const selectedGiftTotal = unitPrice * selectedGiftQuantity
  const grandTotal = isGiftProduct ? selectedGiftTotal + selectedRelatedTotal : totalPrice

  function updateRelatedQuantity(productId: string, delta: number) {
    setSelectedRelatedQuantities((prev) => {
      const current = prev[productId] ?? 0
      const next = Math.max(0, current + delta)
      const out = { ...prev }
      if (next === 0) {
        delete out[productId]
      } else {
        out[productId] = next
      }
      return out
    })
  }

  const productDetailSection = (
    <div
      className={cn(
        'grid grid-cols-1 lg:grid-cols-12 lg:items-stretch',
        isGiftProduct ? 'gap-6 lg:gap-8' : 'gap-10',
      )}
    >
      <div
        className={cn(
          'lg:col-span-5',
          isGiftProduct && 'flex min-h-[18rem] flex-col self-stretch lg:min-h-0',
        )}
      >
        <div
          className={cn(
            isGiftProduct
              ? 'flex min-h-0 w-full flex-1 flex-col'
              : 'mx-auto max-w-2xl',
          )}
        >
          <ShopImageGallery
            images={images}
            alt={shopProduct.name}
            fillMainHeight={isGiftProduct}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-col lg:col-span-7">
        <div className="space-y-5">
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

          {shopProduct.description ? (
            <div
              className={cn('prose prose-sm max-w-none dark:prose-invert')}
              dangerouslySetInnerHTML={{ __html: shopProduct.description }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}

          {linkedProducts.length > 0 || linkedAddOnProducts.length > 0 || linkedCoupons.length > 0 ? (
            <div className="space-y-4 rounded-xl border border-border bg-card p-4">
              <h2 className="text-base font-semibold text-foreground">Gift bundle details</h2>
              {linkedProducts.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Included products</p>
                  <div className="flex flex-wrap gap-2">
                    {linkedProducts.map((linkedProduct) => (
                      <HoverCard key={linkedProduct.id} openDelay={120} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <button
                            type="button"
                            className="relative h-14 w-14 overflow-hidden rounded-md border border-border bg-muted/30"
                            aria-label={linkedProduct.name}
                          >
                            <Image
                              src={linkedProduct.imageUrl ?? '/placeholder.jpg'}
                              alt={linkedProduct.name}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent
                          side="top"
                          align="start"
                          className="w-72 space-y-3 rounded-xl border border-border bg-card p-0"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-muted/30">
                            <Image
                              src={linkedProduct.imageUrl ?? '/placeholder.jpg'}
                              alt={linkedProduct.name}
                              fill
                              className="object-cover"
                              sizes="288px"
                            />
                          </div>
                          <div className="space-y-1 p-3">
                            <p className="text-base font-semibold text-foreground">
                              {linkedProduct.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {linkedProduct.description ?? 'Gift bundle product'}
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              {formatPrice(linkedProduct.memberPrice ?? linkedProduct.price)}
                            </p>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ))}
                  </div>
                </div>
              ) : null}
              {linkedCoupons.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Voucher coupons</p>
                  <div className="space-y-2">
                    {linkedCoupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className="rounded-md border border-border bg-muted/30 px-3 py-2"
                      >
                        <p className="text-sm font-semibold text-foreground">{coupon.code}</p>
                        <p className="text-xs text-muted-foreground">{coupon.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <Separator />

          {isGiftProduct && selectedGiftQuantity <= 0 ? (
            <Button
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              onClick={() => setSelectedGiftQuantity(1)}
            >
              Select items
            </Button>
          ) : (
            <>
              {isGiftProduct ? null : (
                <>
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
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )

  const giftRelatedSection = (
    <section className="space-y-4">
      <h2
        className="text-xl font-black text-foreground"
        style={{ fontFamily: 'var(--font-barlow)' }}
      >
        {relatedTitle}
      </h2>
      {related.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((p) => {
            const unit = p.memberPrice ?? p.price
            const selectedQty = selectedRelatedQuantities[p.id] ?? 0
            return (
              <div key={p.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="relative aspect-[4/3] bg-muted/30">
                  <Image
                    src={p.imageUrl ?? '/placeholder.jpg'}
                    alt={p.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="space-y-2 p-5">
                  <p
                    className="text-base font-bold leading-tight text-foreground"
                    style={{ fontFamily: 'var(--font-barlow)' }}
                  >
                    {p.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{p.sku ?? '—'}</p>
                  <p className="text-lg font-black text-foreground">{formatPrice(unit)}</p>
                </div>
                <Button
                  type="button"
                  className="mx-5 mb-5 mt-0 w-[calc(100%-2.5rem)] bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                  onClick={() => updateRelatedQuantity(p.id, 1)}
                >
                  {selectedQty > 0 ? `Added (${selectedQty})` : 'Add item'}
                </Button>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No add-on products available right now.</p>
      )}
    </section>
  )

  const giftLineRowClass =
    'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-background px-3 py-3 sm:gap-x-4 sm:px-4 sm:py-3.5'

  const giftCheckoutCard = (
    <div className="w-full rounded-xl border border-border bg-card p-5">
        <h3
          className="text-lg font-black text-foreground"
          style={{ fontFamily: 'var(--font-barlow)' }}
        >
          Cart & checkout
        </h3>
        {selectedGiftQuantity > 0 ? (
          <div className="translate-y-0 opacity-100 transition-all duration-300 ease-out">
            <div className="mt-5 max-h-[420px] space-y-3 overflow-x-hidden overflow-y-auto pr-1">
              <div className={giftLineRowClass} aria-label={`Gift bundle: ${shopProduct.name}`}>
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border">
                  <Image
                    src={shopProduct.imageUrl ?? '/placeholder.jpg'}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="shrink-0 tabular-nums">
                  <p className="text-sm font-semibold text-foreground">{formatPrice(unitPrice)}</p>
                  <p className="text-xs text-muted-foreground">each</p>
                </div>
                <div className="ml-auto flex shrink-0 flex-col items-end gap-1.5">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setSelectedGiftQuantity((prev) => Math.max(0, prev - 1))}
                      aria-label="Decrease gift quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">
                      {selectedGiftQuantity}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setSelectedGiftQuantity((prev) => prev + 1)}
                      aria-label="Increase gift quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-right text-sm font-bold tabular-nums text-foreground">
                    {formatPrice(selectedGiftTotal)}
                  </p>
                </div>
              </div>
              {selectedRelatedRows.map((row) => (
                <div
                  key={row.product.id}
                  className={giftLineRowClass}
                  aria-label={`Add-on: ${row.product.name}`}
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border">
                    <Image
                      src={row.product.imageUrl ?? '/placeholder.jpg'}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="shrink-0 tabular-nums">
                    <p className="text-sm font-semibold text-foreground">{formatPrice(row.unitPrice)}</p>
                    <p className="text-xs text-muted-foreground">each</p>
                  </div>
                  <div className="ml-auto flex shrink-0 flex-col items-end gap-1.5">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => updateRelatedQuantity(row.product.id, -1)}
                        aria-label="Decrease add-on quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">
                        {row.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => updateRelatedQuantity(row.product.id, 1)}
                        aria-label="Increase add-on quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-right text-sm font-bold tabular-nums text-foreground">
                      {formatPrice(row.unitPrice * row.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg border border-border bg-muted/20 px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Total</span>
                <span className="font-bold tabular-nums text-foreground">{formatPrice(grandTotal)}</span>
              </div>
              <Button
                className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                onClick={add}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to cart
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-5 text-sm text-muted-foreground transition-all duration-300 ease-out">
            Select item to open cart and checkout.
          </div>
        )}
      </div>
  )

  return (
    <div
      className={cn(
        'space-y-12',
        isGiftProduct && selectedGiftQuantity > 0 && 'xl:pr-[460px] 2xl:pr-[480px]',
      )}
    >
      {productDetailSection}

      {isGiftProduct && selectedGiftQuantity > 0 ? (
        <div className="relative">
          <div className="min-w-0 transition-all duration-300 ease-out">
            {giftRelatedSection}
          </div>
          <div className="mt-6 xl:hidden">
            {giftCheckoutCard}
          </div>
          <div className="hidden xl:block">
            <div className="fixed right-[max(1rem,calc((100vw-88rem)/2+1rem))] top-30 z-40 w-[min(420px,calc(100vw-2rem))]">
              {giftCheckoutCard}
            </div>
          </div>
        </div>
      ) : null}

      {!isGiftProduct && related.length > 0 ? (
        <section className="space-y-4">
          <h2
            className="text-xl font-black text-foreground"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            {relatedTitle}
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

