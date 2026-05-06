/** Rental cart controls for dates, fulfillment, and rental totals. */
'use client'

import Link from 'next/link'
import { ExternalLink, X } from 'lucide-react'

import { CouponPanel } from '@/components/customer/coupon-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/utils'
import type {
  CartState,
  Coupon,
  RentalAcknowledgmentCheckoutOption,
  RentalAcknowledgmentType,
} from '@/lib/types'

interface RentalCartSidebarProps {
  readonly cart: CartState
  readonly rentalSubtotal: number
  /** From rental product sub-categories (`ProductCategory.rentalAcknowledgments`). */
  readonly acknowledgmentOptions: readonly RentalAcknowledgmentCheckoutOption[]
  readonly onSetFulfillmentMode: (mode: 'PICKUP' | 'DELIVERY' | null, address?: string | null) => void
  readonly onSetDeliveryFee: (fee: number) => void
  readonly onSetAcknowledgments: (acknowledgments: RentalAcknowledgmentType[]) => void
  readonly onCouponApplied: (coupon: Coupon | null, discountAmount: number) => void
  readonly hasActiveSubscription?: boolean
  readonly contactId?: string
  readonly externalAppliedCode?: string | null
  readonly externalDiscount?: number
  readonly onClose: () => void
  /** When true, rental lines are not selected for checkout — proceed is disabled. */
  readonly checkoutDisabled?: boolean
}

export function RentalCartSidebar({
  cart,
  rentalSubtotal,
  acknowledgmentOptions,
  onSetFulfillmentMode,
  onSetDeliveryFee,
  onSetAcknowledgments,
  onCouponApplied,
  hasActiveSubscription = false,
  contactId,
  externalAppliedCode,
  externalDiscount,
  onClose,
  checkoutDisabled = false,
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

      {!cart.rentalStartAt || !cart.rentalEndAt ? (
        <p className="text-xs text-muted-foreground">
          Complete rental availability on the product page (dates, or day plus time slot) before
          checkout.
        </p>
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
        {acknowledgmentOptions.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No acknowledgments are configured for these rental categories. Add them under
            Admin → Scheduling → Services → Rentals when editing a sub-category.
          </p>
        ) : (
          <div className="space-y-3">
            {acknowledgmentOptions.map((option) => {
              const checked = (cart.acknowledgments ?? []).includes(option.id)
              return (
                <div
                  key={option.id}
                  className="flex flex-col gap-1.5 text-sm text-foreground sm:flex-row sm:flex-wrap sm:items-center"
                >
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1 shrink-0"
                      checked={checked}
                      onChange={(event) => {
                        const current = cart.acknowledgments ?? []
                        if (event.target.checked) {
                          onSetAcknowledgments([...current, option.id])
                        } else {
                          onSetAcknowledgments(
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
            })}
          </div>
        )}
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

      {checkoutDisabled ? (
        <Button className="h-11 w-full font-bold" type="button" disabled>
          Select rental items to continue
        </Button>
      ) : (
        <Button
          className="h-11 w-full bg-accent font-bold text-accent-foreground hover:bg-accent/90"
          asChild
        >
          <Link href="/shop/checkout">Proceed to checkout</Link>
        </Button>
      )}
    </div>
  )
}
