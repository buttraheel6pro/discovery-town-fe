/** Rental cart controls for dates, fulfillment, and rental totals. */
'use client'

import Link from 'next/link'
import { X } from 'lucide-react'

import { CouponPanel } from '@/components/customer/coupon-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/utils'
import type { CartState, Coupon, RentalAcknowledgmentType } from '@/lib/types'

const ACK_OPTIONS: { id: RentalAcknowledgmentType; label: string }[] = [
  { id: 'MECHANICAL_BULL_SAFETY', label: 'Mechanical Bull safety' },
  { id: 'GENERATOR_VENTILATION', label: 'Generator ventilation safety' },
  { id: 'FOOD_EQUIPMENT_SANITATION', label: 'Food equipment sanitation' },
  { id: 'DJ_CONTROLLER_DEPOSIT', label: 'DJ controller deposit notice' },
]

interface RentalCartSidebarProps {
  readonly cart: CartState
  readonly rentalSubtotal: number
  readonly onSetRentalDates: (start: string | null, end: string | null) => void
  readonly onSetFulfillmentMode: (mode: 'PICKUP' | 'DELIVERY' | null, address?: string | null) => void
  readonly onSetDeliveryFee: (fee: number) => void
  readonly onSetAcknowledgments: (acknowledgments: RentalAcknowledgmentType[]) => void
  readonly onCouponApplied: (coupon: Coupon | null, discountAmount: number) => void
  readonly hasActiveSubscription?: boolean
  readonly contactId?: string
  readonly externalAppliedCode?: string | null
  readonly externalDiscount?: number
  readonly onClose: () => void
}

function toInputDateTime(value: string | null | undefined): string {
  if (!value) {
    return ''
  }
  return value.slice(0, 16)
}

export function RentalCartSidebar({
  cart,
  rentalSubtotal,
  onSetRentalDates,
  onSetFulfillmentMode,
  onSetDeliveryFee,
  onSetAcknowledgments,
  onCouponApplied,
  hasActiveSubscription = false,
  contactId,
  externalAppliedCode,
  externalDiscount,
  onClose,
}: Readonly<RentalCartSidebarProps>) {
  const deliveryFee = cart.fulfillmentMode === 'DELIVERY' ? cart.deliveryFee ?? 0 : 0
  const total = rentalSubtotal + deliveryFee + (cart.depositTotal ?? 0)

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Rental order summary</h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
          aria-label="Close rental details"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Separator />

      <div className="space-y-3">
        <Label htmlFor="rental-start">Start</Label>
        <Input
          id="rental-start"
          type="datetime-local"
          value={toInputDateTime(cart.rentalStartAt)}
          onChange={(event) => {
            const nextStart = event.target.value || null
            onSetRentalDates(nextStart, cart.rentalEndAt ?? null)
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rental-end">End</Label>
        <Input
          id="rental-end"
          type="datetime-local"
          value={toInputDateTime(cart.rentalEndAt)}
          onChange={(event) => {
            const nextEnd = event.target.value || null
            onSetRentalDates(cart.rentalStartAt ?? null, nextEnd)
          }}
        />
      </div>
      {!cart.rentalStartAt || !cart.rentalEndAt ? (
        <p className="text-xs text-muted-foreground">Set your rental dates first.</p>
      ) : null}

      <div className="space-y-3">
        <Label>Fulfillment</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={cart.fulfillmentMode === 'PICKUP' ? 'default' : 'outline'}
            onClick={() => onSetFulfillmentMode('PICKUP', null)}
            className="flex-1"
          >
            Pickup
          </Button>
          <Button
            type="button"
            variant={cart.fulfillmentMode === 'DELIVERY' ? 'default' : 'outline'}
            onClick={() => onSetFulfillmentMode('DELIVERY')}
            className="flex-1"
          >
            Delivery
          </Button>
        </div>
      </div>

      {cart.fulfillmentMode === 'DELIVERY' ? (
        <div className="space-y-3">
          <Label htmlFor="delivery-address">Delivery address</Label>
          <Input
            id="delivery-address"
            value={cart.deliveryAddress ?? ''}
            onChange={(event) => onSetFulfillmentMode('DELIVERY', event.target.value)}
            placeholder="Street, city, postcode"
          />
          <Label htmlFor="delivery-fee">Delivery fee</Label>
          <Input
            id="delivery-fee"
            type="number"
            min={0}
            value={cart.deliveryFee ?? 0}
            onChange={(event) => onSetDeliveryFee(Number(event.target.value))}
          />
        </div>
      ) : null}
      <div className="space-y-3">
        <Label>Acknowledgments</Label>
        <div className="space-y-2">
          {ACK_OPTIONS.map((option) => {
            const checked = (cart.acknowledgments ?? []).includes(option.id)
            return (
              <label key={option.id} className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    const current = cart.acknowledgments ?? []
                    if (event.target.checked) {
                      onSetAcknowledgments([...current, option.id])
                    } else {
                      onSetAcknowledgments(current.filter((entry) => entry !== option.id))
                    }
                  }}
                />
                {option.label}
              </label>
            )
          })}
        </div>
      </div>

      <Separator />
      <CouponPanel
        context="ORDER"
        subtotal={rentalSubtotal}
        onCouponApplied={onCouponApplied}
        hasActiveSubscription={hasActiveSubscription}
        contactId={contactId}
        externalAppliedCode={externalAppliedCode}
        externalDiscount={externalDiscount}
      />
      <Separator />
      <div className="space-y-1 text-sm">
        <p className="flex items-center justify-between text-muted-foreground">
          <span>Rental subtotal</span>
          <span>{formatPrice(rentalSubtotal)}</span>
        </p>
        <p className="flex items-center justify-between text-muted-foreground">
          <span>Delivery fee</span>
          <span>{formatPrice(deliveryFee)}</span>
        </p>
        <p className="flex items-center justify-between text-muted-foreground">
          <span>Deposit</span>
          <span>{formatPrice(cart.depositTotal ?? 0)}</span>
        </p>
        <Separator />
        <p className="flex items-center justify-between text-base font-black text-foreground">
          <span>Total</span>
          <span className="text-accent">{formatPrice(total)}</span>
        </p>
      </div>

      <Button
        className="h-11 w-full bg-accent font-bold text-accent-foreground hover:bg-accent/90"
        asChild
      >
        <Link href="/shop/checkout">Proceed to rental checkout</Link>
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Rental checkout follows the same checkout page as shop items.
      </p>
    </div>
  )
}
