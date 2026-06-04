/** Party booking hook for event package selection, pricing, and submission. */
'use client'

import { useEffect, useMemo, useState } from 'react'

import { eventPackageOptionalAddOnsMock } from '@/lib/mock-data'
import { useInventory } from '@/lib/inventory-store'
import { useScheduling } from '@/lib/scheduling-store'
import {
  buildEventBookingAddOnLines,
  clampEventAddOnQuantity,
  getPackageIncludedAddOnIds,
  type EventAddOnConfigurationResult,
} from '@/lib/event-booking-add-ons'
import {
  resolveEventBookingScheduleMode,
} from '@/lib/event-booking-schedule'
import type {
  AvailableWindow,
  CartModifierSelection,
  Coupon,
  EventOccasion,
  EventPackage,
  SchedulingBooking,
} from '@/lib/types'
import { EventBookingScheduleModeEnum } from '@/lib/types'

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
  summary: string
  selectedModifiers: CartModifierSelection[]
  selectedByGroup: Record<string, string[]>
  selectedAttributesByGroup: Record<string, string[]>
  customerNote: string | null
}

function createBookingId(): string {
  return `bk-event-${Math.random().toString(16).slice(2, 10)}`
}

function todayIsoDate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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
  const { bookingAddOns } = useInventory()
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
  const [selectedDate, setSelectedDate] = useState<string | null>(todayIsoDate())
  const [selectedToDate, setSelectedToDate] = useState<string | null>(todayIsoDate())
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

  const packageIncludedAddOnIds = useMemo(
    () => getPackageIncludedAddOnIds(selectedPackage),
    [selectedPackage],
  )

  useEffect(() => {
    if (packageIncludedAddOnIds.size === 0) {
      return
    }
    setOptionalAddOns((prev) => {
      let changed = false
      const next = { ...prev }
      for (const addOnId of packageIncludedAddOnIds) {
        if (next[addOnId]) {
          delete next[addOnId]
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [packageIncludedAddOnIds, selectedPackageId])

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
  const scheduleMode = service ? resolveEventBookingScheduleMode(service) : EventBookingScheduleModeEnum.PER_EVENT

  const canContinueFromTiming = (() => {
    if (scheduleMode === EventBookingScheduleModeEnum.PER_EVENT) {
      return Boolean(selectedDate && selectedWindow)
    }
    if (scheduleMode === EventBookingScheduleModeEnum.PER_DAY) {
      return Boolean(selectedDate && selectedToDate && selectedWindow)
    }
    return Boolean(selectedDate && selectedWindow)
  })()
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
      next[addOnId] = {
        unitPrice: Math.max(0, price),
        quantity: 1,
        summary: addOnId,
        selectedModifiers: [],
        selectedByGroup: {},
        selectedAttributesByGroup: {},
        customerNote: null,
      }
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
        summary: prev[addOnId]?.summary ?? addOnId,
        selectedModifiers: prev[addOnId]?.selectedModifiers ?? [],
        selectedByGroup: prev[addOnId]?.selectedByGroup ?? {},
        selectedAttributesByGroup: prev[addOnId]?.selectedAttributesByGroup ?? {},
        customerNote: prev[addOnId]?.customerNote ?? null,
      }
      return next
    })
  }

  function setOptionalAddOnFromConfiguration(
    addOnId: string,
    configuration: EventAddOnConfigurationResult,
  ): void {
    setOptionalAddOns((prev) => ({
      ...prev,
      [addOnId]: {
        unitPrice: Math.max(0, configuration.unitPrice),
        quantity: clampEventAddOnQuantity(configuration.quantity),
        summary: configuration.summary,
        selectedModifiers: [...configuration.selectedModifiers],
        selectedByGroup: { ...configuration.selectedByGroup },
        selectedAttributesByGroup: { ...configuration.selectedAttributesByGroup },
        customerNote: configuration.customerNote,
      },
    }))
  }

  function clearOptionalAddOn(addOnId: string): void {
    setOptionalAddOns((prev) => {
      const next = { ...prev }
      delete next[addOnId]
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

  function submitBooking(options?: { readonly persist?: boolean }): SchedulingBooking | null {
    if (!selectedPackage || !selectedWindow || !selectedDate || !service) {
      return null
    }
    const persist = options?.persist !== false
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
      addOns: buildEventBookingAddOnLines(selectedPackage, optionalAddOns, (addOnId) => {
        const fromInventory = bookingAddOns.find((entry) => entry.id === addOnId)
        const fromCatalog = eventPackageOptionalAddOnsMock.find((entry) => entry.id === addOnId)
        return fromInventory?.name ?? fromCatalog?.name ?? addOnId
      }),
      createdAt: nowIso,
      couponCode: couponCode ?? null,
      actedByStaffId: null,
    }
    if (persist) {
      addBooking(booking)
    }
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
    selectedToDate,
    setSelectedToDate,
    selectedWindow,
    setSelectedWindow,
    childrenCount,
    setChildrenCount,
    adultsCount,
    setAdultsCount,
    optionalAddOns,
    toggleOptionalAddOn,
    setOptionalAddOnQuantity,
    setOptionalAddOnFromConfiguration,
    clearOptionalAddOn,
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
