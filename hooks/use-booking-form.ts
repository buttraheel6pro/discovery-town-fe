/** Booking checkout state and submit helpers shared across scheduling detail pages. */
'use client'

import { useCallback, useMemo, useState } from 'react'

import { useScheduling } from '@/lib/scheduling-store'
import {
  computeSchedulingBaseTotal,
  toSchedulingBookingAddOnLines,
  totalForSelectedServiceAddOns,
} from '@/lib/utils'
import type {
  AvailableWindow,
  Coupon,
  SchedulingBooking,
  SchedulingService,
  SchedulingServiceAddOn,
  SchedulingSlot,
} from '@/lib/types'

export interface UseBookingFormParams {
  readonly service: SchedulingService
  readonly slot?: SchedulingSlot
  readonly selectedWindow?: AvailableWindow | null
  readonly selectedDurationMinutes?: number
  readonly contactId?: string
  readonly contactName?: string
  readonly actedByStaffId?: string | null
  readonly source?: SchedulingBooking['source']
}

function createBookingId(): string {
  return `bk-${Math.random().toString(16).slice(2, 10)}`
}

function createWaitlistId(): string {
  return `wl-${Math.random().toString(16).slice(2, 10)}`
}

export function useBookingForm({
  service,
  slot,
  selectedWindow,
  selectedDurationMinutes,
  contactId,
  contactName,
  actedByStaffId,
  source = 'ONLINE',
}: UseBookingFormParams) {
  const { addBooking, addToWaitlist, services } = useScheduling()

  const [guestCount, setGuestCount] = useState(1)
  const [participantName, setParticipantName] = useState('')
  const [participantDateOfBirth, setParticipantDateOfBirth] = useState<string | null>(null)
  const [waiverAccepted, setWaiverAccepted] = useState(false)
  const [notes, setNotes] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [addOnQuantities, setAddOnQuantities] = useState<Record<string, number>>({})
  const [selectedCategoryAddOnIds, setSelectedCategoryAddOnIds] = useState<string[]>([])
  const [checkoutCouponCode, setCheckoutCouponCode] = useState<string | null>(null)
  const [checkoutCouponDiscount, setCheckoutCouponDiscount] = useState(0)

  const needsParticipant =
    service.ageMin !== null || service.ageMax !== null || service.category.requiresAttendee === true

  const freeInfantMonths = service.category.freeInfantMonths ?? null

  const participantAgeMonths = useMemo(() => {
    if (!participantDateOfBirth) return null
    const dob = new Date(participantDateOfBirth)
    if (!Number.isFinite(dob.getTime())) return null
    const now = new Date()
    const years = now.getFullYear() - dob.getFullYear()
    const months = now.getMonth() - dob.getMonth()
    const totalMonths = years * 12 + months - (now.getDate() < dob.getDate() ? 1 : 0)
    return totalMonths >= 0 ? totalMonths : null
  }, [participantDateOfBirth])

  const isFreeInfant =
    freeInfantMonths != null &&
    participantAgeMonths != null &&
    participantAgeMonths <= freeInfantMonths &&
    guestCount === 1

  const durationHours = useMemo(() => {
    if (slot) {
      return (
        (new Date(slot.endAt).getTime() - new Date(slot.startAt).getTime()) / 3_600_000
      )
    }
    if (selectedDurationMinutes && selectedDurationMinutes > 0) {
      return selectedDurationMinutes / 60
    }
    if (selectedWindow) {
      return (
        (new Date(selectedWindow.endAt).getTime() -
          new Date(selectedWindow.startAt).getTime()) /
        3_600_000
      )
    }
    return service.durationMinutes / 60
  }, [slot, selectedDurationMinutes, selectedWindow, service.durationMinutes])

  const addOnCatalog = useMemo(() => {
    const map = new Map<string, SchedulingServiceAddOn>()
    for (const addOn of service.addOns ?? []) {
      if (addOn.isActive) {
        map.set(addOn.id, addOn)
      }
    }
    for (const schedulingService of services) {
      for (const addOn of schedulingService.addOns ?? []) {
        if (addOn.isActive && !map.has(addOn.id)) {
          map.set(addOn.id, addOn)
        }
      }
    }
    return map
  }, [service.addOns, services])

  const categoryIncludedAddOns = useMemo(() => {
    return (service.category.linkedAddOns ?? [])
      .filter((link) => link.isFree)
      .map((link) => addOnCatalog.get(link.addOnId))
      .filter((addOn): addOn is SchedulingServiceAddOn => addOn != null)
  }, [addOnCatalog, service.category.linkedAddOns])

  const categoryOptionalAddOns = useMemo(() => {
    return (service.category.linkedAddOns ?? [])
      .filter((link) => !link.isFree)
      .map((link) => addOnCatalog.get(link.addOnId))
      .filter((addOn): addOn is SchedulingServiceAddOn => addOn != null)
  }, [addOnCatalog, service.category.linkedAddOns])

  const baseTotal = useMemo(() => {
    const raw = computeSchedulingBaseTotal(
      service,
      slot,
      guestCount,
      selectedWindow ?? null,
      selectedDurationMinutes,
    )
    return isFreeInfant ? 0 : raw
  }, [guestCount, isFreeInfant, selectedDurationMinutes, selectedWindow, service, slot])

  const addOnTotal = useMemo(
    () =>
      totalForSelectedServiceAddOns(
        service.addOns,
        addOnQuantities,
        guestCount,
        durationHours,
      ),
    [addOnQuantities, durationHours, guestCount, service.addOns],
  )
  const categoryOptionalAddOnTotal = useMemo(() => {
    return selectedCategoryAddOnIds.reduce((sum, addOnId) => {
      const addOn = addOnCatalog.get(addOnId)
      if (!addOn) return sum
      if (addOn.pricingType === 'PER_PERSON') return sum + addOn.price * guestCount
      if (addOn.pricingType === 'PER_HOUR') return sum + addOn.price * durationHours
      return sum + addOn.price
    }, 0)
  }, [addOnCatalog, durationHours, guestCount, selectedCategoryAddOnIds])

  const totalBeforeCoupon = useMemo(
    () => Math.round((baseTotal + addOnTotal + categoryOptionalAddOnTotal) * 100) / 100,
    [addOnTotal, baseTotal, categoryOptionalAddOnTotal],
  )

  const grandTotal = useMemo(
    () => Math.max(0, Math.round((totalBeforeCoupon - checkoutCouponDiscount) * 100) / 100),
    [checkoutCouponDiscount, totalBeforeCoupon],
  )

  const setCoupon = useCallback((coupon: Coupon | null, discountAmount: number) => {
    if (!coupon || discountAmount <= 0) {
      setCheckoutCouponCode(null)
      setCheckoutCouponDiscount(0)
      return
    }
    setCheckoutCouponCode(coupon.code.trim().toUpperCase())
    setCheckoutCouponDiscount(Math.max(0, discountAmount))
  }, [])

  const depositPercent = service.category.depositPercent ?? null
  const depositDueToday = useMemo(() => {
    if (depositPercent == null) return null
    return Math.round(((grandTotal * depositPercent) / 100) * 100) / 100
  }, [depositPercent, grandTotal])
  const depositDueOnArrival = useMemo(() => {
    if (depositDueToday == null) return null
    return Math.round((grandTotal - depositDueToday) * 100) / 100
  }, [depositDueToday, grandTotal])

  const canSubmitDetails = useMemo(() => {
    if (needsParticipant && participantName.trim().length === 0) return false
    return true
  }, [needsParticipant, participantName])

  const submitBooking = useCallback(
    (options?: { readonly persist?: boolean }): SchedulingBooking => {
    const persist = options?.persist !== false
    const nowIso = new Date().toISOString()
    const addOnLines = toSchedulingBookingAddOnLines(
      service.addOns,
      addOnQuantities,
      guestCount,
      durationHours,
    )
    const categoryIncludedLines = categoryIncludedAddOns.map((addOn) => ({
      id: `bkao-${addOn.id}`,
      name: addOn.name,
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    }))
    const categoryOptionalLines = selectedCategoryAddOnIds
      .map((addOnId) => addOnCatalog.get(addOnId))
      .filter((addOn): addOn is SchedulingServiceAddOn => addOn != null)
      .map((addOn) => {
        const lineTotal =
          addOn.pricingType === 'PER_PERSON'
            ? addOn.price * guestCount
            : addOn.pricingType === 'PER_HOUR'
              ? addOn.price * durationHours
              : addOn.price
        return {
          id: `bkao-${addOn.id}`,
          name: addOn.name,
          quantity: 1,
          unitPrice: lineTotal,
          totalPrice: lineTotal,
        }
      })
    const bookingAddOns = [...addOnLines, ...categoryIncludedLines, ...categoryOptionalLines]
      .filter((line, index, rows) => rows.findIndex((row) => row.id === line.id) === index)

    const totalAmount = grandTotal

    let startAt: string | null = null
    let endAt: string | null = null
    if (slot) {
      startAt = slot.startAt
      endAt = slot.endAt
    } else if (selectedWindow) {
      startAt = selectedWindow.startAt
      if (service.pricingModel === 'per_hour' && selectedDurationMinutes) {
        endAt = new Date(
          new Date(selectedWindow.startAt).getTime() +
            selectedDurationMinutes * 60_000,
        ).toISOString()
      } else {
        endAt = selectedWindow.endAt
      }
    } else if (service.startDate && service.startTime) {
      const datePart = service.startDate.includes('T')
        ? service.startDate.split('T')[0]
        : service.startDate
      const [h, m] = service.startTime.split(':').map((x) => parseInt(x, 10))
      const start = new Date(`${datePart}T${String(h).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}:00`)
      startAt = start.toISOString()
      if (service.endDate && service.endTime) {
        const endPart = service.endDate.includes('T')
          ? service.endDate.split('T')[0]
          : service.endDate
        const [eh, em] = service.endTime.split(':').map((x) => parseInt(x, 10))
        endAt = new Date(
          `${endPart}T${String(eh).padStart(2, '0')}:${String(em || 0).padStart(2, '0')}:00`,
        ).toISOString()
      } else {
        endAt = new Date(start.getTime() + service.durationMinutes * 60_000).toISOString()
      }
    }

    const booking: SchedulingBooking = {
      id: createBookingId(),
      bookingType: service.serviceType,
      serviceSlotId: slot?.id ?? null,
      serviceSlot: slot ?? null,
      serviceId: service.id,
      service,
      contactId: contactId ?? 'contact-1',
      contactName: contactName ?? 'Rachel Green',
      participantName: needsParticipant ? participantName.trim() : null,
      locationId: slot?.locationId ?? service.locationId ?? 'loc-1',
      locationName: 'Discovery Town Main Centre',
      status: 'CONFIRMED',
      startAt,
      endAt,
      guestCount,
      totalAmount,
      balanceDue: 0,
      checkedInAt: null,
      cancelledAt: null,
      cancellationReason: null,
      notes: notes.trim() ? notes.trim() : null,
      specialInstructions: specialInstructions.trim() ? specialInstructions.trim() : null,
      source,
      addOns: bookingAddOns,
      createdAt: nowIso,
      couponCode: checkoutCouponCode,
      actedByStaffId: actedByStaffId ?? null,
    }

    if (persist) {
      addBooking(booking)
    }
    return booking
  }, [
    addBooking,
    addOnCatalog,
    addOnQuantities,
    categoryIncludedAddOns,
    checkoutCouponCode,
    durationHours,
    guestCount,
    grandTotal,
    needsParticipant,
    notes,
    participantName,
    selectedCategoryAddOnIds,
    selectedDurationMinutes,
    selectedWindow,
    service,
    slot,
    source,
    specialInstructions,
    contactId,
    contactName,
    actedByStaffId,
  ])

  const submitWaitlist = useCallback(() => {
    if (!slot) return
    addToWaitlist({
      id: createWaitlistId(),
      serviceSlotId: slot.id,
      contactId: 'contact-1',
      contactName: 'Rachel Green',
      position: 999,
      status: 'WAITING',
      notifiedAt: null,
      createdAt: new Date().toISOString(),
    })
  }, [addToWaitlist, slot])

  const setAddOnQuantity = useCallback((addOnId: string, quantity: number) => {
    setAddOnQuantities((prev) => {
      const next = { ...prev }
      if (quantity <= 0) {
        delete next[addOnId]
      } else {
        next[addOnId] = quantity
      }
      return next
    })
  }, [])

  const setCategoryAddOnSelected = useCallback((addOnId: string, selected: boolean) => {
    setSelectedCategoryAddOnIds((prev) => {
      if (selected) {
        if (prev.includes(addOnId)) return prev
        return [...prev, addOnId]
      }
      return prev.filter((id) => id !== addOnId)
    })
  }, [])

  return {
    guestCount,
    setGuestCount,
    participantName,
    setParticipantName,
    participantDateOfBirth,
    setParticipantDateOfBirth,
    waiverAccepted,
    setWaiverAccepted,
    notes,
    setNotes,
    specialInstructions,
    setSpecialInstructions,
    addOnQuantities,
    setAddOnQuantity,
    categoryIncludedAddOns,
    categoryOptionalAddOns,
    selectedCategoryAddOnIds,
    setCategoryAddOnSelected,
    needsParticipant,
    isFreeInfant,
    freeInfantMonths,
    depositPercent,
    depositDueToday,
    depositDueOnArrival,
    durationHours,
    baseTotal,
    addOnTotal,
    totalBeforeCoupon,
    checkoutCouponCode,
    checkoutCouponDiscount,
    grandTotal,
    setCoupon,
    canSubmitDetails,
    submitBooking,
    submitWaitlist,
  }
}
