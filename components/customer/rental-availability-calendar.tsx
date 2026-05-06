/** Rental availability — routes billing to OpenBookingAvailabilitySection rental variants. */
'use client'

import { useMemo } from 'react'

import { OpenBookingAvailabilitySection } from '@/components/customer/open-booking-availability-section'
import { rentalBookedDates } from '@/lib/mock-data'

interface RentalAvailabilityCalendarProps {
  readonly productId: string
  readonly stockQuantity: number
  readonly rentalBillingType?: string | null
  readonly maxRentalDays?: number | null
  readonly rentalSlotIncrementMinutes?: number | null
  readonly selectedFromDate?: string
  readonly selectedToDate?: string
  readonly onDateRangeChange?: (fromDate: string, toDate: string) => void
  readonly selectedSlotStartAt?: string
  readonly selectedSlotEndAt?: string
  readonly onRentalSlotChange?: (startIso: string, endIso: string) => void
}

export function RentalAvailabilityCalendar({
  productId,
  stockQuantity,
  rentalBillingType,
  maxRentalDays = null,
  rentalSlotIncrementMinutes = null,
  selectedFromDate = '',
  selectedToDate = '',
  onDateRangeChange,
  selectedSlotStartAt = '',
  selectedSlotEndAt = '',
  onRentalSlotChange,
}: Readonly<RentalAvailabilityCalendarProps>) {
  const billing = (rentalBillingType ?? '').toUpperCase()

  const availabilityMap = useMemo(
    () => new Map((rentalBookedDates[productId] ?? []).map((entry) => [entry.date, entry.bookedUnits])),
    [productId],
  )

  if (billing === 'PER_DAY' && onDateRangeChange) {
    return (
      <OpenBookingAvailabilitySection
        variant="rental_per_day"
        availabilityMap={availabilityMap}
        maxRentalDays={maxRentalDays}
        onDateRangeChange={onDateRangeChange}
        selectedFromDate={selectedFromDate}
        selectedToDate={selectedToDate}
        stockQuantity={stockQuantity}
      />
    )
  }

  if (billing === 'PER_HOUR' && onRentalSlotChange) {
    return (
      <OpenBookingAvailabilitySection
        variant="rental_slots"
        slotBilling="PER_HOUR"
        availabilityMap={availabilityMap}
        onRentalSlotChange={onRentalSlotChange}
        slotIncrementMinutes={rentalSlotIncrementMinutes}
        selectedSlotEndAt={selectedSlotEndAt}
        selectedSlotStartAt={selectedSlotStartAt}
        stockQuantity={stockQuantity}
      />
    )
  }

  if (billing === 'PER_HALF_DAY' && onRentalSlotChange) {
    return (
      <OpenBookingAvailabilitySection
        variant="rental_slots"
        slotBilling="PER_HALF_DAY"
        availabilityMap={availabilityMap}
        onRentalSlotChange={onRentalSlotChange}
        selectedSlotEndAt={selectedSlotEndAt}
        selectedSlotStartAt={selectedSlotStartAt}
        stockQuantity={stockQuantity}
      />
    )
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
      <p>
        Calendar scheduling is available for per-day, per-hour, and per-half-day rentals. This
        product uses another billing type.
      </p>
    </section>
  )
}
