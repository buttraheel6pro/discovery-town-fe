/** Cart page — shared cart for shop + future checkout flows. */
'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag } from 'lucide-react'

import { CouponPanel } from '@/components/customer/coupon-panel'
import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { ShopCartItem } from '@/components/customer/shop-cart-item'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useClients } from '@/lib/client-store'
import { calcCartTotals, formatPrice } from '@/lib/utils'
import { useInventory } from '@/lib/inventory-store'
import type { Coupon } from '@/lib/types'

export default function CartPage() {
  const { cart, updateCartQuantity, removeFromCart, setCouponDirect, removeCoupon } =
    useInventory()
  const { contacts, subscriptions } = useClients()

  const primaryContact =
    contacts.find((c) => c.contactType === 'CUSTOMER') ?? contacts[0] ?? null
  const hasActiveSubscription = Boolean(
    primaryContact &&
      subscriptions.some(
        (s) =>
          s.contactId === primaryContact.id &&
          (s.status === 'ACTIVE' ||
            s.status === 'TRIALING' ||
            s.status === 'PAUSED'),
      ),
  )

  const { subtotal, tax, total } = useMemo(() => {
    return calcCartTotals(cart.items, cart.couponDiscount, 20)
  }, [cart.couponDiscount, cart.items])
  const groupedRequestItems = useMemo(
    () =>
      cart.items.filter(
        (item) => item.type === 'booking' && typeof item.metadata?.requestType === 'string',
      ),
    [cart.items],
  )
  const standardItems = useMemo(
    () => cart.items.filter((item) => !groupedRequestItems.some((requestItem) => requestItem.id === item.id)),
    [cart.items, groupedRequestItems],
  )

  function handleCouponApplied(coupon: Coupon | null, discountAmount: number) {
    if (!coupon || discountAmount <= 0) {
      removeCoupon()
      return
    }
    setCouponDirect(coupon.code, discountAmount)
  }

  return (
    <>
      <CustomerNavbar />
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link
            href="/store/shop"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Link>

          <h1
            className="text-3xl font-black text-foreground mb-8"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            Your cart
          </h1>

          {cart.items.length === 0 ? (
            <div className="text-center py-24 space-y-4">
              <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto" />
              <p className="text-xl font-bold text-muted-foreground">Your cart is empty</p>
              <Link href="/store/shop">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Browse products
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-4">
                {groupedRequestItems.length > 0 ? (
                  <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                    <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                      Request bundles
                    </h2>
                    {groupedRequestItems.map((item) => (
                      <div key={item.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{item.name}</p>
                            {item.description ? (
                              <p className="text-xs whitespace-pre-line text-muted-foreground">
                                {item.description}
                              </p>
                            ) : null}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)}>
                            Remove
                          </Button>
                        </div>
                        <p className="mt-2 font-semibold text-foreground">{formatPrice(item.price)}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                {standardItems.map((item) => (
                  <ShopCartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={(qty) => updateCartQuantity(item.id, qty)}
                    onRemove={() => removeFromCart(item.id)}
                  />
                ))}
              </div>

              <aside className="space-y-6">
                <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                  <h2 className="font-bold text-lg">Order summary</h2>
                  <Separator />

                  <CouponPanel
                    context="ORDER"
                    subtotal={subtotal}
                    onCouponApplied={handleCouponApplied}
                    hasActiveSubscription={hasActiveSubscription}
                    contactId={cart.contactId ?? primaryContact?.id}
                    externalAppliedCode={cart.couponCode}
                    externalDiscount={cart.couponDiscount}
                  />

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    {cart.couponDiscount > 0 ? (
                      <div className="flex justify-between text-green-700">
                        <span>Discount</span>
                        <span>-{formatPrice(cart.couponDiscount)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-muted-foreground">
                      <span>VAT (20%)</span>
                      <span>{formatPrice(tax)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-black text-base">
                      <span>Total</span>
                      <span className="text-accent">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold h-11"
                    asChild
                  >
                    <Link href="/shop/checkout">Proceed to checkout</Link>
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Mock checkout. Secure payment UI.
                  </p>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
      <CustomerFooter />
    </>
  )
}
