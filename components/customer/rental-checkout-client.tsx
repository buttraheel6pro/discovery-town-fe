/** Rental checkout client with multi-step flow. */
'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ExternalLink } from 'lucide-react'

import { CouponPanel } from '@/components/customer/coupon-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useInventory } from '@/lib/inventory-store'
import { collectRentalAcknowledgmentOptions } from '@/lib/rental-acknowledgments'
import { formatPrice } from '@/lib/utils'
import type { Coupon } from '@/lib/types'

type CheckoutStep = 'fulfillment' | 'ack' | 'payment' | 'confirmation'

export function RentalCheckoutClient() {
  const router = useRouter()
  const {
    cart,
    products,
    productCategories,
    setCouponDirect,
    removeCoupon,
    setFulfillmentMode,
    setDeliveryFee,
    setAcknowledgments,
    addOrder,
    clearCart,
  } = useInventory()
  const [step, setStep] = useState<CheckoutStep>('fulfillment')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')

  const subtotal = useMemo(
    () => cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart.items],
  )
  const deliveryFee = cart.fulfillmentMode === 'DELIVERY' ? cart.deliveryFee ?? 0 : 0
  const deposit = cart.depositTotal ?? 0
  const total = subtotal - cart.couponDiscount + deliveryFee + deposit
  const hasScheduledRentalInCart = useMemo(() => {
    return cart.items.some((item) => {
      const productId = typeof item.metadata?.productId === 'string' ? item.metadata.productId : null
      if (!productId) return false
      const product = products.find((entry) => entry.id === productId) ?? null
      const billing = product?.rentalBillingType ?? ''
      return (
        billing === 'PER_DAY' || billing === 'PER_HOUR' || billing === 'PER_HALF_DAY'
      )
    })
  }, [cart.items, products])
  const missingRequiredRentalSchedule =
    hasScheduledRentalInCart && (!cart.rentalStartAt || !cart.rentalEndAt)

  const acknowledgmentOptions = useMemo(
    () =>
      collectRentalAcknowledgmentOptions(cart.items, products, productCategories),
    [cart.items, productCategories, products],
  )

  function applyCoupon(coupon: Coupon | null, discount: number) {
    if (!coupon || discount <= 0) {
      removeCoupon()
      return
    }
    setCouponDirect(coupon.code, discount)
  }

  function placeOrder() {
    if (!cardNumber || !expiry || !cvv || missingRequiredRentalSchedule) {
      return
    }
    const nowIso = new Date().toISOString()
    addOrder({
      id: `rental-order-${Date.now()}`,
      tenantId: 'tenant-1',
      orderNumber: `RNT-${Date.now().toString().slice(-6)}`,
      contactId: cart.contactId ?? 'contact-1',
      channel: 'ONLINE',
      items: cart.items.map((item) => ({
        id: `ritem-${item.id}`,
        orderId: `rental-order-${Date.now()}`,
        productId: String(item.metadata?.productId ?? ''),
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
        total: item.price * item.quantity,
      })),
      subtotal,
      discount: cart.couponDiscount,
      tax: 0,
      total,
      status: 'PROCESSING',
      paymentStatus: 'PAID',
      fulfillmentType: 'RENTAL',
      rentalStatus: 'PENDING',
      rentalStartAt: cart.rentalStartAt ?? null,
      rentalEndAt: cart.rentalEndAt ?? null,
      fulfillmentMode: cart.fulfillmentMode ?? null,
      deliveryAddress: cart.deliveryAddress ?? null,
      deliveryFee,
      depositAmount: deposit,
      acknowledgments: cart.acknowledgments ?? [],
      createdAt: nowIso,
      updatedAt: nowIso,
    })
    clearCart()
    setStep('confirmation')
  }

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-6">
      <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
        <span>Step 1: Fulfillment</span>
        <span>Step 2: Acknowledgments</span>
        <span>Step 3: Payment</span>
        <span>Step 4: Confirmation</span>
      </div>

      {missingRequiredRentalSchedule ? (
        <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          Rental schedule is not set. Go back to the product page and complete availability
          (dates or day and time slot).
        </p>
      ) : null}

      {step === 'fulfillment' ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Fulfillment</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setFulfillmentMode('PICKUP')}>
              Pickup
            </Button>
            <Button variant="outline" onClick={() => setFulfillmentMode('DELIVERY')}>
              Delivery
            </Button>
          </div>
          {cart.fulfillmentMode === 'DELIVERY' ? (
            <>
              <Label>Delivery address</Label>
              <Input
                value={cart.deliveryAddress ?? ''}
                onChange={(event) => setFulfillmentMode('DELIVERY', event.target.value)}
              />
              <Label>Delivery fee</Label>
              <Input
                type="number"
                min={0}
                value={cart.deliveryFee ?? 0}
                onChange={(event) => setDeliveryFee(Number(event.target.value))}
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Pickup venue: 9753 Crosspoint Blvd, Indianapolis, Indiana, 46256.
              Pickup hours 9:00AM-7:00PM.
            </p>
          )}
          <Button onClick={() => setStep('ack')} disabled={missingRequiredRentalSchedule}>
            Continue
          </Button>
        </div>
      ) : null}

      {step === 'ack' ? (
        <div className="space-y-3">
          <h2 className="text-xl font-bold">Acknowledgments</h2>
          {acknowledgmentOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No acknowledgments are configured for the rental categories in your cart.
            </p>
          ) : (
            acknowledgmentOptions.map((option) => {
              const checked = (cart.acknowledgments ?? []).includes(option.id)
              return (
                <div
                  key={option.id}
                  className="flex flex-col gap-1.5 text-sm sm:flex-row sm:flex-wrap sm:items-center"
                >
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1 shrink-0"
                      checked={checked}
                      onChange={(event) => {
                        const current = cart.acknowledgments ?? []
                        if (event.target.checked) {
                          setAcknowledgments([...current, option.id])
                        } else {
                          setAcknowledgments(
                            current.filter((entry) => entry !== option.id),
                          )
                        }
                      }}
                    />
                    <span>{option.label}</span>
                  </label>
                  {option.detailUrl ? (
                    <a
                      href={option.detailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-accent underline underline-offset-2 sm:ml-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Read details
                    </a>
                  ) : null}
                </div>
              )
            })
          )}
          <Button onClick={() => setStep('payment')}>Continue</Button>
        </div>
      ) : null}

      {step === 'payment' ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Payment</h2>
          <CouponPanel context="ORDER" subtotal={subtotal} onCouponApplied={applyCoupon} />
          <Separator />
          <Label>Card number</Label>
          <Input value={cardNumber} onChange={(event) => setCardNumber(event.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Expiry</Label>
              <Input value={expiry} onChange={(event) => setExpiry(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>CVV</Label>
              <Input value={cvv} onChange={(event) => setCvv(event.target.value)} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Total: {formatPrice(total)}</p>
          <Button onClick={placeOrder} disabled={missingRequiredRentalSchedule}>
            Place rental order
          </Button>
        </div>
      ) : null}

      {step === 'confirmation' ? (
        <div className="space-y-3 text-center">
          <h2 className="text-2xl font-black text-foreground">Rental confirmed</h2>
          <p className="text-sm text-muted-foreground">Your rental order has been submitted.</p>
          <Button onClick={() => router.push('/rentals')}>Back to rentals</Button>
          <Link className="block text-sm text-accent" href="/admin/orders">
            View in admin orders
          </Link>
        </div>
      ) : null}
    </div>
  )
}
