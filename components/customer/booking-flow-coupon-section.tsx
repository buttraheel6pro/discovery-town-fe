/** Booking detail sidebar — CouponPanel, promo breakdown, and totals; clears promo when pricing inputs change. */
'use client'

import { useEffect, type ReactNode } from 'react'

import { CouponPanel } from '@/components/customer/coupon-panel'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/utils'
import type { Coupon } from '@/lib/types'

export interface BookingFlowCouponSectionProps {
  readonly pricingResetKey: string
  readonly totalBeforeCoupon: number
  readonly grandTotal: number
  readonly checkoutCouponDiscount: number
  readonly setCoupon: (coupon: Coupon | null, discountAmount: number) => void
  readonly appliedCouponCode: string | null
  readonly appliedCouponDiscount: number
  readonly hasActiveSubscription: boolean
  readonly contactId?: string
  readonly isFreeInfant: boolean
  readonly freeInfantMonths: number | null
  readonly depositPercent: number | null
  readonly depositDueToday: number | null
  readonly depositDueOnArrival: number | null
  readonly totalLabel?: ReactNode
  /** When false, only the coupon panel is shown (totals live elsewhere, e.g. Add to cart). */
  readonly showPricingSummary?: boolean
}

export function BookingFlowCouponSection({
  pricingResetKey,
  totalBeforeCoupon,
  grandTotal,
  checkoutCouponDiscount,
  setCoupon,
  appliedCouponCode,
  appliedCouponDiscount,
  hasActiveSubscription,
  contactId,
  isFreeInfant,
  freeInfantMonths,
  depositPercent,
  depositDueToday,
  depositDueOnArrival,
  totalLabel,
  showPricingSummary = true,
}: Readonly<BookingFlowCouponSectionProps>) {
  useEffect(() => {
    setCoupon(null, 0)
  }, [pricingResetKey, setCoupon])

  return (
    <>
      <Separator />
      <CouponPanel
        context="BOOKING"
        subtotal={totalBeforeCoupon}
        onCouponApplied={setCoupon}
        hasActiveSubscription={hasActiveSubscription}
        contactId={contactId}
        externalAppliedCode={appliedCouponCode}
        externalDiscount={appliedCouponDiscount}
      />
      {showPricingSummary ? (
        <>
          <Separator />
          <div className="space-y-1.5 text-sm">
            {checkoutCouponDiscount > 0 ? (
              <>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Before promo</span>
                  <span>{formatPrice(totalBeforeCoupon)}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-green-700">
                  <span>Promo</span>
                  <span>-{formatPrice(checkoutCouponDiscount)}</span>
                </div>
              </>
            ) : null}
            <div className="flex justify-between font-bold text-base">
              {totalLabel ?? <span>Total</span>}
              <span className="text-accent">{formatPrice(grandTotal)}</span>
            </div>
            {isFreeInfant && freeInfantMonths != null ? (
              <p className="text-sm font-semibold text-foreground">
                Infant (under {freeInfantMonths} months): FREE
              </p>
            ) : null}
            {depositPercent != null &&
            depositDueToday != null &&
            depositDueOnArrival != null ? (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due today (deposit)</span>
                  <span className="font-semibold text-foreground">
                    {formatPrice(depositDueToday)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due on arrival (balance)</span>
                  <span className="font-semibold text-foreground">
                    {formatPrice(depositDueOnArrival)}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </>
  )
}
