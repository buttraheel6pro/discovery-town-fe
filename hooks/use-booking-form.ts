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
  SchedulingBooking,
  SchedulingService,
  SchedulingSlot,
} from '@/lib/types'

export interface UseBookingFormParams {
  readonly service: SchedulingService
  readonly slot?: SchedulingSlot
  readonly selectedWindow?: AvailableWindow | null
  readonly selectedDurationMinutes?: number
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
}: UseBookingFormParams) {
  const { addBooking, addToWaitlist } = useScheduling()

  const [guestCount, setGuestCount] = useState(1)
  const [participantName, setParticipantName] = useState('')
  const [participantDateOfBirth, setParticipantDateOfBirth] = useState<string | null>(null)
  const [waiverAccepted, setWaiverAccepted] = useState(false)
  const [notes, setNotes] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [addOnQuantities, setAddOnQuantities] = useState<Record<string, number>>({})

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

  const grandTotal = useMemo(
    () => Math.round((baseTotal + addOnTotal) * 100) / 100,
    [addOnTotal, baseTotal],
  )

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

  const submitBooking = useCallback((): SchedulingBooking => {
    const nowIso = new Date().toISOString()
    const addOnLines = toSchedulingBookingAddOnLines(
      service.addOns,
      addOnQuantities,
      guestCount,
      durationHours,
    )

    const totalAmount = grandTotal

    let startAt: string | null = null
    let endAt: string | null = null
    if (!slot && selectedWindow) {
      startAt = selectedWindow.startAt
      if (service.pricingModel === 'per_hour' && selectedDurationMinutes) {
        endAt = new Date(
          new Date(selectedWindow.startAt).getTime() +
            selectedDurationMinutes * 60_000,
        ).toISOString()
      } else {
        endAt = selectedWindow.endAt
      }
    } else if (!slot && service.startDate && service.startTime) {
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
      contactId: 'contact-1',
      contactName: 'Rachel Green',
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
      source: 'ONLINE',
      addOns: addOnLines,
      createdAt: nowIso,
    }

    addBooking(booking)
    return booking
  }, [
    addBooking,
    addOnQuantities,
    durationHours,
    guestCount,
    grandTotal,
    needsParticipant,
    notes,
    participantName,
    selectedDurationMinutes,
    selectedWindow,
    service,
    slot,
    specialInstructions,
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
    needsParticipant,
    isFreeInfant,
    freeInfantMonths,
    depositPercent,
    depositDueToday,
    depositDueOnArrival,
    durationHours,
    baseTotal,
    addOnTotal,
    grandTotal,
    canSubmitDetails,
    submitBooking,
    submitWaitlist,
  }
}
