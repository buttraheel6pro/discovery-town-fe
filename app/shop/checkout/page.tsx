/** Shop checkout page — Stripe checkout when API is enabled, mock payment otherwise. */
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CreditCard, Lock } from 'lucide-react'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { isStripeCheckoutEnabled, StripeCheckoutForm } from '@/components/customer/stripe-checkout-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { isApiEnabled } from '@/lib/api/client'
import { checkoutOrder, getOrder } from '@/lib/api/orders.api'
import { calcCartTotals, formatPrice } from '@/lib/utils'
import { useInventory } from '@/lib/inventory-store'
import type { Order } from '@/lib/types'

export default function ShopCheckoutPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { cart, addOrder, clearCart, savePaymentMethod } = useInventory()

  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const useStripe = isApiEnabled && isStripeCheckoutEnabled()

  const { subtotal, tax, total } = useMemo(() => {
    return calcCartTotals(cart.items, cart.couponDiscount, 20)
  }, [cart.couponDiscount, cart.items])

  const orderItems = useMemo(
    () =>
      cart.items
        .filter((i) => i.type === 'product')
        .map((i) => ({
          productId: String(i.metadata?.productId ?? ''),
          quantity: i.quantity,
        }))
        .filter((i) => i.productId.length > 0),
    [cart.items],
  )

  useEffect(() => {
    if (!useStripe || orderItems.length === 0) {
      setClientSecret(null)
      setPendingOrderId(null)
      return
    }

    let cancelled = false
    setCheckoutError(null)

    checkoutOrder({
      contactId: cart.contactId ?? undefined,
      channel: 'ONLINE',
      items: orderItems,
      couponCode: cart.couponCode ?? undefined,
    })
      .then((session) => {
        if (cancelled) return
        setClientSecret(session.clientSecret)
        setPendingOrderId(session.orderId)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'Checkout failed'
        setCheckoutError(message)
      })

    return () => {
      cancelled = true
    }
  }, [cart.contactId, cart.couponCode, orderItems, useStripe])

  const canPlaceMock =
    cart.items.length > 0 && cardNumber.trim().length >= 8 && expiry.trim() && cvv.trim().length >= 3

  async function completeStripeOrder() {
    if (!pendingOrderId) return
    const order = await getOrder(pendingOrderId)
    addOrder(order)
    clearCart()
    toast({ title: 'Order placed', description: `Order ${order.orderNumber} confirmed.` })
    router.push(`/shop/order-confirmation?orderId=${encodeURIComponent(order.id)}`)
  }

  function placeMockOrder() {
    if (!canPlaceMock) return

    const nowIso = new Date().toISOString()
    const orderId = `order-online-${Date.now()}`
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
    const contactId = cart.contactId ?? 'contact-1'
    const tenantId = 'tenant-1'

    const digits = cardNumber.replaceAll(/\D/g, '')
    const last4 = digits.slice(-4).padStart(4, '0')
    const brand = digits.startsWith('4')
      ? 'Visa'
      : digits.startsWith('5')
        ? 'Mastercard'
        : digits.startsWith('3')
          ? 'Amex'
          : 'Card'
    const expiryParts = expiry.trim().split('/')
    const expMonth = Number.parseInt(expiryParts[0] ?? '', 10)
    const expYearRaw = Number.parseInt(expiryParts[1] ?? '', 10)
    const expYear = expYearRaw < 100 ? 2000 + expYearRaw : expYearRaw

    const items: Order['items'] = cart.items
      .filter((i) => i.type === 'product')
      .map((i) => ({
        id: `li-${i.id}`,
        orderId,
        productId: String(i.metadata?.productId ?? ''),
        productName: i.name,
        quantity: i.quantity,
        unitPrice: i.price,
        totalPrice: i.price * i.quantity,
        total: i.price * i.quantity,
        imageUrl: i.imageUrl ?? null,
        sku: typeof i.description === 'string' ? i.description : undefined,
      }))

    const created: Order = {
      id: orderId,
      tenantId,
      orderNumber,
      contactId,
      contactName: cart.contactName ?? 'Guest',
      contactEmail: 'guest@example.com',
      channel: 'ONLINE',
      items,
      subtotal,
      discount: cart.couponDiscount,
      couponCode: cart.couponCode,
      couponDiscount: cart.couponDiscount,
      tax,
      total,
      status: 'PROCESSING',
      paymentStatus: 'PAID',
      paymentGateway: 'STRIPE',
      paymentMethod: 'CARD',
      paymentReference: 'pi_mock_checkout',
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    if (Number.isFinite(expMonth) && expMonth >= 1 && expMonth <= 12 && Number.isFinite(expYear) && expYear >= 2020) {
      savePaymentMethod({
        tenantId,
        contactId,
        brand,
        last4,
        expMonth,
        expYear,
        isDefault: true,
      })
    }

    addOrder(created)
    clearCart()
    toast({ title: 'Order placed', description: `Order ${orderNumber} confirmed.` })
    router.push(`/shop/order-confirmation?orderId=${encodeURIComponent(orderId)}`)
  }

  return (
    <>
      <CustomerNavbar />
      <main className="bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-foreground" style={{ fontFamily: 'var(--font-barlow)' }}>
                Checkout
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {useStripe ? 'Secure payment via Stripe.' : 'Secure payment (mock).'}
              </p>
            </div>
            <Link href="/cart" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
              Back to cart
            </Link>
          </div>

          {cart.items.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center">
              <p className="text-sm font-semibold text-foreground">Your cart is empty.</p>
              <p className="mt-1 text-sm text-muted-foreground">Browse the shop to add items.</p>
              <div className="mt-4 flex justify-center">
                <Button asChild>
                  <Link href="/shop">Browse shop</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <section className="lg:col-span-7 space-y-4 rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-black text-foreground" style={{ fontFamily: 'var(--font-barlow)' }}>
                    Payment
                  </h2>
                </div>

                {useStripe ? (
                  <div className="space-y-4">
                    {checkoutError ? (
                      <p className="text-sm text-destructive">{checkoutError}</p>
                    ) : null}
                    {clientSecret ? (
                      <StripeCheckoutForm clientSecret={clientSecret} onSuccess={() => void completeStripeOrder()} />
                    ) : (
                      <p className="text-sm text-muted-foreground">Preparing secure checkout…</p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="cc-number">Card number</Label>
                        <Input id="cc-number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="1234 5678 9012 3456" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cc-exp">Expiry</Label>
                        <Input id="cc-exp" value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM/YY" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cc-cvv">CVV</Label>
                        <Input id="cc-cvv" value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="123" />
                      </div>
                    </div>

                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold h-11" onClick={placeMockOrder} disabled={!canPlaceMock}>
                      <Lock className="mr-2 h-4 w-4" />
                      Place order {formatPrice(total)}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      This is a mock checkout for demo purposes.
                    </p>
                  </>
                )}
              </section>

              <aside className="lg:col-span-5 space-y-4 rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-black text-foreground" style={{ fontFamily: 'var(--font-barlow)' }}>
                  Order summary
                </h2>
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
                    <span>Tax</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-black text-foreground" style={{ fontFamily: 'var(--font-barlow)' }}>
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
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
