/** Staffed service booking wrapper for character and staff rentals. */
'use client'

import { useMemo, useState } from 'react'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

import { BookingWidget } from '@/components/customer/booking-widget'
import { CouponPanel } from '@/components/customer/coupon-panel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useInventory } from '@/lib/inventory-store'
import { useScheduling } from '@/lib/scheduling-store'
import { formatPrice } from '@/lib/utils'
import type { Coupon } from '@/lib/types'

export function StaffedServiceBooking() {
  const searchParams = useSearchParams()
  const { services } = useScheduling()
  const { products } = useInventory()
  const service = services.find((entry) => entry.id === 'svc-special-character-events') ?? services[0]
  const durationOptions = useMemo(() => {
    const characterProduct =
      products.find((product) => product.id === 'prod-rental-entertainer-mc') ??
      products.find(
        (product) =>
          product.isRental &&
          product.rentalBillingType === 'PER_HOUR' &&
          (product.fulfillment ?? '').includes('STAFF'),
      ) ??
      null
    const hourlyRate = characterProduct?.pricePerHour ?? 125
    const firstHourPrice = characterProduct?.priceFirstHourPremium ?? hourlyRate
    const tierRows = (characterProduct?.rentalHourlyTierPrices ?? [])
      .filter((tier) => Number.isFinite(tier.hours) && tier.hours >= 2 && Number.isFinite(tier.price))
      .sort((left, right) => left.hours - right.hours)
      .map((tier) => ({
        id: `dur-${tier.hours}`,
        label: `${tier.hours} hours`,
        value: tier.price,
      }))
    const fallbackRows = [
      { id: 'dur-1', label: '1 hour', value: firstHourPrice },
      { id: 'dur-2', label: '2 hours', value: hourlyRate * 2 },
      { id: 'dur-3', label: '3 hours', value: hourlyRate * 3 },
    ]
    if (tierRows.length === 0) {
      return fallbackRows
    }
    return [{ id: 'dur-1', label: '1 hour', value: firstHourPrice }, ...tierRows]
  }, [products])
  const [selectedDuration, setSelectedDuration] = useState('dur-2')
  const [travelAddress, setTravelAddress] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)

  useEffect(() => {
    if (searchParams.get('demo') !== 'character') {
      return
    }
    setSelectedDuration('dur-2')
    setTravelAddress('9753 Crosspoint Blvd, Indianapolis, Indiana, 46256')
    setCouponDiscount(25)
  }, [searchParams])

  const basePrice =
    durationOptions.find((option) => option.id === selectedDuration)?.value ??
    durationOptions[1]?.value ??
    durationOptions[0]?.value ??
    0
  const travelFee = travelAddress.trim().length > 0 ? 30 : 0
  const total = basePrice + travelFee - couponDiscount

  function applyCoupon(coupon: Coupon | null, discountAmount: number) {
    if (!coupon || discountAmount <= 0) {
      setCouponDiscount(0)
      return
    }
    setCouponDiscount(discountAmount)
  }

  const details = useMemo(
    () => ({
      basePrice,
      travelFee,
      total,
    }),
    [basePrice, total, travelFee],
  )

  if (!service) {
    return null
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Duration selector</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {durationOptions.map((option) => (
              <label key={option.id} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="duration"
                  checked={selectedDuration === option.id}
                  onChange={() => setSelectedDuration(option.id)}
                />
                {option.label} ({formatPrice(option.value)})
              </label>
            ))}
            <div className="space-y-2 pt-3">
              <Label htmlFor="travel-address">Address (for off-venue appearances)</Label>
              <Input
                id="travel-address"
                placeholder="Enter address for travel fee lookup"
                value={travelAddress}
                onChange={(event) => setTravelAddress(event.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        <BookingWidget
          service={service}
          onBooked={() => {
            return
          }}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Booking summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="flex items-center justify-between text-sm">
            <span>Duration total</span>
            <span>{formatPrice(details.basePrice)}</span>
          </p>
          <p className="flex items-center justify-between text-sm">
            <span>Travel fee</span>
            <span>{formatPrice(details.travelFee)}</span>
          </p>
          <CouponPanel context="ORDER" subtotal={details.basePrice + details.travelFee} onCouponApplied={applyCoupon} />
          {couponDiscount > 0 ? (
            <p className="text-xs font-semibold text-green-700">WELCOME10 — save {formatPrice(couponDiscount)}</p>
          ) : null}
          <p className="flex items-center justify-between text-base font-semibold">
            <span>Final total</span>
            <span>{formatPrice(details.total)}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
