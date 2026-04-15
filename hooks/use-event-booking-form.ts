/** Party booking hook for event package selection, pricing, and submission. */
'use client'

import { useMemo, useState } from 'react'

import { useScheduling } from '@/lib/scheduling-store'
import type {
  AvailableWindow,
  Coupon,
  EventOccasion,
  EventPackage,
  SchedulingBooking,
} from '@/lib/types'

interface BirthdayDetails {
  celebrantName: string
  celebrantAge: number | null
}

interface UseEventBookingFormParams {
  readonly serviceId: string
  readonly packages: EventPackage[]
  readonly defaultPackageId?: string
  readonly defaultOccasion?: EventOccasion
  readonly defaultBirthdayName?: string
  readonly defaultBirthdayAge?: number
  readonly defaultChildren?: number
  readonly defaultAdults?: number
}

interface OptionalAddOnSelection {
  unitPrice: number
  quantity: number
}

function createBookingId(): string {
  return `bk-event-${Math.random().toString(16).slice(2, 10)}`
}

export function useEventBookingForm({
  serviceId,
  packages,
  defaultPackageId,
  defaultOccasion = 'BIRTHDAY',
  defaultBirthdayName = '',
  defaultBirthdayAge,
  defaultChildren = 1,
  defaultAdults = 1,
}: UseEventBookingFormParams) {
  const { services, addBooking } = useScheduling()
  const service = useMemo(
    () => services.find((entry) => entry.id === serviceId) ?? null,
    [serviceId, services],
  )

  const [occasion, setOccasion] = useState<EventOccasion>(defaultOccasion)
  const [birthdayDetails, setBirthdayDetails] = useState<BirthdayDetails>({
    celebrantName: defaultBirthdayName,
    celebrantAge: defaultBirthdayAge ?? null,
  })
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    defaultPackageId ?? null,
  )
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedWindow, setSelectedWindow] = useState<AvailableWindow | null>(null)
  const [childrenCount, setChildrenCount] = useState<number>(Math.max(1, defaultChildren))
  const [adultsCount, setAdultsCount] = useState<number>(Math.max(1, defaultAdults))
  const [optionalAddOns, setOptionalAddOns] = useState<Record<string, OptionalAddOnSelection>>({})
  const [notes, setNotes] = useState('')
  const [couponCode, setCouponCode] = useState<string | null>(null)
  const [couponDiscount, setCouponDiscount] = useState(0)

  const selectedPackage = useMemo(
    () => packages.find((entry) => entry.id === selectedPackageId) ?? null,
    [packages, selectedPackageId],
  )

  const childIncludedCap = selectedPackage?.maxChildSeats ?? childrenCount
  const adultIncludedCap = selectedPackage?.maxAdultSeats ?? adultsCount
  const additionalChildPrice = selectedPackage?.additionalChildPrice ?? 0
  const additionalAdultPrice = selectedPackage?.additionalAdultPrice ?? 0

  const extraChildren = Math.max(0, childrenCount - childIncludedCap)
  const extraAdults = Math.max(0, adultsCount - adultIncludedCap)
  const optionalAddOnTotal = useMemo(
    () =>
      Object.values(optionalAddOns).reduce(
        (sum, selection) =>
          sum + Math.max(0, selection.unitPrice) * Math.max(0, selection.quantity),
        0,
      ),
    [optionalAddOns],
  )

  const childrenOverageTotal = extraChildren * additionalChildPrice
  const adultsOverageTotal = extraAdults * additionalAdultPrice
  const basePrice = selectedPackage?.basePrice ?? 0
  const totalBeforeCoupon = Math.round(
    (basePrice + childrenOverageTotal + adultsOverageTotal + optionalAddOnTotal) * 100,
  ) / 100
  const grandTotal = Math.max(0, Math.round((totalBeforeCoupon - couponDiscount) * 100) / 100)

  const canContinueFromOccasion =
    occasion !== 'BIRTHDAY' ||
    (birthdayDetails.celebrantName.trim().length > 0 &&
      (birthdayDetails.celebrantAge ?? 0) >= 1 &&
      (birthdayDetails.celebrantAge ?? 0) <= 18)
  const canContinueFromTiming = Boolean(selectedDate && selectedWindow)
  const canSubmit = Boolean(selectedPackage && selectedDate && selectedWindow && service)

  function updateBirthdayDetails(patch: Partial<BirthdayDetails>): void {
    setBirthdayDetails((prev) => ({ ...prev, ...patch }))
  }

  function toggleOptionalAddOn(addOnId: string, price: number, enabled: boolean): void {
    setOptionalAddOns((prev) => {
      const next = { ...prev }
      if (!enabled) {
        delete next[addOnId]
        return next
      }
      next[addOnId] = { unitPrice: Math.max(0, price), quantity: 1 }
      return next
    })
  }

  function setOptionalAddOnQuantity(addOnId: string, unitPrice: number, quantity: number): void {
    setOptionalAddOns((prev) => {
      const safeQuantity = Math.max(0, quantity)
      const next = { ...prev }
      if (safeQuantity <= 0) {
        delete next[addOnId]
        return next
      }
      next[addOnId] = {
        unitPrice: Math.max(0, unitPrice),
        quantity: safeQuantity,
      }
      return next
    })
  }

  function setCoupon(coupon: Coupon | null, discountAmount: number): void {
    if (!coupon || discountAmount <= 0) {
      setCouponCode(null)
      setCouponDiscount(0)
      return
    }
    setCouponCode(coupon.code.toUpperCase())
    setCouponDiscount(Math.max(0, discountAmount))
  }

  function submitBooking(): SchedulingBooking | null {
    if (!selectedPackage || !selectedWindow || !selectedDate || !service) {
      return null
    }
    const nowIso = new Date().toISOString()
    const booking: SchedulingBooking = {
      id: createBookingId(),
      bookingType: service.serviceType,
      serviceSlotId: null,
      serviceSlot: null,
      serviceId: service.id,
      service,
      eventPackageId: selectedPackage.id,
      contactId: 'contact-1',
      contactName: 'Rachel Green',
      participantName:
        occasion === 'BIRTHDAY' ? birthdayDetails.celebrantName.trim() || 'Birthday Child' : null,
      locationId: service.locationId ?? 'loc-1',
      locationName: 'Discovery Town Main Centre',
      status: selectedPackage.isWholeVenue ? 'PENDING' : 'CONFIRMED',
      startAt: selectedWindow.startAt,
      endAt: selectedWindow.endAt,
      guestCount: childrenCount + adultsCount,
      totalAmount: grandTotal,
      balanceDue: selectedPackage.depositAmount ?? 0,
      checkedInAt: null,
      cancelledAt: null,
      cancellationReason: null,
      notes: notes.trim().length > 0 ? notes.trim() : null,
      specialInstructions: null,
      source: 'ONLINE',
      addOns: selectedPackage.addOns.map((addOn) => ({
        id: `bo-${selectedPackage.id}-${addOn.addOnId}`,
        name: addOn.addOnId,
        quantity: addOn.included ? 1 : (optionalAddOns[addOn.addOnId]?.quantity ?? 1),
        unitPrice: addOn.included ? 0 : (optionalAddOns[addOn.addOnId]?.unitPrice ?? 0),
        totalPrice: addOn.included
          ? 0
          : (optionalAddOns[addOn.addOnId]?.unitPrice ?? 0) *
            (optionalAddOns[addOn.addOnId]?.quantity ?? 1),
      })),
      createdAt: nowIso,
      couponCode: couponCode ?? null,
      actedByStaffId: null,
    }
    addBooking(booking)
    return booking
  }

  return {
    service,
    occasion,
    setOccasion,
    birthdayDetails,
    updateBirthdayDetails,
    selectedPackage,
    selectedPackageId,
    setSelectedPackageId,
    selectedDate,
    setSelectedDate,
    selectedWindow,
    setSelectedWindow,
    childrenCount,
    setChildrenCount,
    adultsCount,
    setAdultsCount,
    optionalAddOns,
    toggleOptionalAddOn,
    setOptionalAddOnQuantity,
    notes,
    setNotes,
    couponCode,
    couponDiscount,
    setCoupon,
    extraChildren,
    extraAdults,
    additionalChildPrice,
    additionalAdultPrice,
    childrenOverageTotal,
    adultsOverageTotal,
    optionalAddOnTotal,
    basePrice,
    totalBeforeCoupon,
    grandTotal,
    canContinueFromOccasion,
    canContinueFromTiming,
    canSubmit,
    submitBooking,
  }
}
