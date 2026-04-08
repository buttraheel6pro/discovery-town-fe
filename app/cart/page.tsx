/** Cart page — shared cart for shop + future checkout flows. */
'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag } from 'lucide-react'

import { CouponValidationFeedback } from '@/components/customer/coupon-validation-feedback'
import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { ShopCartItem } from '@/components/customer/shop-cart-item'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { calcCartTotals, formatPrice } from '@/lib/utils'
import { useInventory } from '@/lib/inventory-store'

export default function CartPage() {
  const { cart, updateCartQuantity, removeFromCart, applyCoupon, removeCoupon } = useInventory()
  const [promoCode, setPromoCode] = useState('')

  const { subtotal, tax, total } = useMemo(() => {
    return calcCartTotals(cart.items, cart.couponDiscount, 20)
  }, [cart.couponDiscount, cart.items])

  return (
    <>
      <CustomerNavbar />
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link
            href="/shop"
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
              <Link href="/shop">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Browse products
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-4">
                {cart.items.map((item) => (
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

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => promoCode.trim() && applyCoupon(promoCode.trim())}
                      >
                        Apply
                      </Button>
                    </div>
                    <CouponValidationFeedback code={promoCode} subtotal={subtotal} />
                    {cart.couponCode ? (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-green-700 font-semibold">
                          Applied <span className="font-mono">{cart.couponCode}</span>
                        </span>
                        <button
                          type="button"
                          className="text-muted-foreground underline"
                          onClick={removeCoupon}
                        >
                          Remove
                        </button>
                      </div>
                    ) : null}
                  </div>

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
  );
}
