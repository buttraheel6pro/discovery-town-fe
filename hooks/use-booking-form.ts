/** Booking checkout state and submit helpers shared across scheduling detail pages. */
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  contactFullName as householdContactFullName,
  getBookingPrimaryGuardianId,
  getPrimaryGuardianCandidates,
  isOpenPlaySessionBookingService,
} from '@/lib/booking-household'
import {
  parseAdditionalAdultUnitPrice,
  resolveFreeAdultCount,
  showsAdditionalAdultPicker,
} from '@/lib/booking-additional-adult'
import {
  parseAdditionalSiblingUnitPrice,
  showsAdditionalSiblingPicker,
} from '@/lib/booking-additional-sibling'
import {
  needsAccompanyingAdultPicker,
  needsAgeParticipantPicker,
  needsHouseholdChildPicker,
} from '@/lib/booking-category-rules'
import {
  clampPassCount,
  passCountHelperText as buildPassCountHelperText,
  resolveMaxPassCount,
} from '@/lib/booking-pass-count'
import { resolveServiceChildAgeRules } from '@/lib/booking-child-age'
import { PARENTS_NIGHT_OUT_SERVICE_ID } from '@/lib/booking-household'
import { getSchedulingTopLevelId } from '@/lib/scheduling-consumer-categories'
import { usesEventTicketBookingSidebar } from '@/lib/scheduling-slot-availability'
import {
  buildSchedulingAddOnCatalog,
  resolveCategoryIncludedAddOns,
  resolveCategoryOptionalAddOns,
  resolveSchedulingCategoryForService,
} from '@/lib/scheduling-category-addons'
import { useScheduling } from '@/lib/scheduling-store'
import { useInventory } from '@/lib/inventory-store'
import {
  computeSchedulingBaseTotal,
} from '@/lib/utils'
import type {
  AvailableWindow,
  CmContact,
  Coupon,
  SchedulingBooking,
  SchedulingService,
  SchedulingServiceAddOn,
  SchedulingSlot,
} from '@/lib/types'

export interface AdditionalSiblingPassOption {
  readonly serviceId: string
  readonly name: string
  readonly unitPrice: number
}

function contactDisplayName(contact: Pick<CmContact, 'firstName' | 'lastName'>): string {
  return `${contact.firstName} ${contact.lastName}`.trim()
}

export interface UseBookingFormParams {
  readonly service: SchedulingService
  readonly slot?: SchedulingSlot
  readonly selectedWindow?: AvailableWindow | null
  readonly selectedDurationMinutes?: number
  readonly contactId?: string
  readonly contactName?: string
  readonly actedByStaffId?: string | null
  readonly source?: SchedulingBooking['source']
  readonly contacts?: readonly CmContact[]
}

function createBookingId(): string {
  return `bk-${Math.random().toString(16).slice(2, 10)}`
}

function createWaitlistId(): string {
  return `wl-${Math.random().toString(16).slice(2, 10)}`
}

function resolvedLegacySiblingPart(input: {
  additionalSiblingCount: number
  additionalSiblingUnitPrice: number | null
}): number {
  const { additionalSiblingCount, additionalSiblingUnitPrice } = input
  if (additionalSiblingUnitPrice == null || additionalSiblingCount <= 0) {
    return 0
  }
  return Math.round(additionalSiblingUnitPrice * additionalSiblingCount * 100) / 100
}

function resolvedLegacySiblingLines(input: {
  additionalSiblingCount: number
  additionalSiblingUnitPrice: number | null
}): Array<{
  id: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
}> {
  const { additionalSiblingCount, additionalSiblingUnitPrice } = input
  if (additionalSiblingUnitPrice == null || additionalSiblingCount <= 0) {
    return []
  }
  return [
    {
      id: 'bkao-additional-sibling',
      name: 'Additional sibling',
      quantity: additionalSiblingCount,
      unitPrice: additionalSiblingUnitPrice,
      totalPrice:
        Math.round(additionalSiblingUnitPrice * additionalSiblingCount * 100) / 100,
    },
  ]
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
  contacts = [],
}: UseBookingFormParams) {
  const { addBooking, addToWaitlist, services, categories } = useScheduling()
  const { bookingAddOns } = useInventory()

  const [guestCount, setGuestCount] = useState(1)
  const [participantName, setParticipantName] = useState('')
  const [participantContactId, setParticipantContactId] = useState('')
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([])
  const [accompanyingAdultContactId, setAccompanyingAdultContactId] = useState('')
  const [secondaryGuardianContactId, setSecondaryGuardianContactId] = useState('')
  const [participantDateOfBirth, setParticipantDateOfBirth] = useState<string | null>(null)

  const usesOpenPlayHouseholdBooking = isOpenPlaySessionBookingService(service.id)
  const maxPassCount = useMemo(() => resolveMaxPassCount(service), [service])

  const setGuestCountClamped = useCallback(
    (next: number) => {
      setGuestCount(clampPassCount(next, maxPassCount, 1))
    },
    [maxPassCount],
  )

  useEffect(() => {
    setGuestCount((prev) => clampPassCount(prev, maxPassCount, 1))
  }, [maxPassCount, service.id])

  const defaultPrimaryGuardianId = useMemo(
    () => getBookingPrimaryGuardianId(contacts),
    [contacts],
  )
  const [primaryGuardianContactId, setPrimaryGuardianContactId] = useState(
    defaultPrimaryGuardianId,
  )

  useEffect(() => {
    if (!usesOpenPlayHouseholdBooking) {
      return
    }
    setPrimaryGuardianContactId((current) => {
      const candidates = getPrimaryGuardianCandidates(contacts)
      if (candidates.some((c) => c.id === current)) {
        return current
      }
      return defaultPrimaryGuardianId
    })
  }, [contacts, defaultPrimaryGuardianId, usesOpenPlayHouseholdBooking])
  const [waiverAccepted, setWaiverAccepted] = useState(false)
  const [notes, setNotes] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [additionalAdultCount, setAdditionalAdultCount] = useState(0)
  const [additionalSiblingCount, setAdditionalSiblingCount] = useState(0)
  const [additionalSiblingPassQuantities, setAdditionalSiblingPassQuantities] = useState<
    Record<string, number>
  >({})
  const [selectedCategoryAddOnIds, setSelectedCategoryAddOnIds] = useState<string[]>([])
  const [checkoutCouponCode, setCheckoutCouponCode] = useState<string | null>(null)
  const [checkoutCouponDiscount, setCheckoutCouponDiscount] = useState(0)

  const usesTicketBookingSidebar = usesEventTicketBookingSidebar(service)

  const needsHouseholdChildren =
    !usesTicketBookingSidebar &&
    (usesOpenPlayHouseholdBooking || needsHouseholdChildPicker(service.category))
  const needsAccompanyingAdult =
    !usesTicketBookingSidebar &&
    !usesOpenPlayHouseholdBooking &&
    needsAccompanyingAdultPicker(service.category)
  const needsAgeParticipant = needsAgeParticipantPicker(
    service.category,
    service.ageMin,
    service.ageMax,
  )
  const needsParticipant = needsAgeParticipant

  const childContacts = useMemo(
    () => contacts.filter((c) => c.contactType === 'CHILD'),
    [contacts],
  )

  useEffect(() => {
    if (!usesOpenPlayHouseholdBooking) {
      return
    }
    setAccompanyingAdultContactId(primaryGuardianContactId)
  }, [primaryGuardianContactId, usesOpenPlayHouseholdBooking])

  const maxChildSelections = useMemo(() => {
    if (!usesOpenPlayHouseholdBooking) {
      return null
    }
    return guestCount + additionalSiblingCount
  }, [additionalSiblingCount, guestCount, usesOpenPlayHouseholdBooking])

  useEffect(() => {
    if (!usesOpenPlayHouseholdBooking || maxChildSelections == null) {
      return
    }
    setSelectedChildIds((prev) =>
      prev.length <= maxChildSelections ? prev : prev.slice(0, maxChildSelections),
    )
  }, [maxChildSelections, usesOpenPlayHouseholdBooking])

  useEffect(() => {
    if (!needsHouseholdChildren) {
      return
    }
    if (selectedChildIds.length === 0) {
      if (usesOpenPlayHouseholdBooking) {
        setParticipantName('')
      }
      return
    }
    const names = selectedChildIds
      .map((id) => childContacts.find((c) => c.id === id))
      .filter((c): c is CmContact => c != null)
      .map(contactDisplayName)
    setParticipantName(names.join(', '))
    if (!usesOpenPlayHouseholdBooking) {
      setGuestCount(selectedChildIds.length)
    }
  }, [
    childContacts,
    needsHouseholdChildren,
    selectedChildIds,
    usesOpenPlayHouseholdBooking,
  ])

  const bookingCategory = useMemo(
    () => resolveSchedulingCategoryForService(service, categories),
    [categories, service],
  )

  const freeInfantMonths = bookingCategory.freeInfantMonths ?? null

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

  const addOnCatalog = useMemo(
    () => buildSchedulingAddOnCatalog(services, bookingAddOns),
    [bookingAddOns, services],
  )

  const additionalAdultUnitPrice = useMemo(
    () => parseAdditionalAdultUnitPrice(service),
    [service],
  )
  const showAdditionalAdultPicker = useMemo(
    () => showsAdditionalAdultPicker(service),
    [service],
  )
  const additionalSiblingUnitPrice = useMemo(
    () => parseAdditionalSiblingUnitPrice(service),
    [service],
  )
  const additionalSiblingPassOptions = useMemo<AdditionalSiblingPassOption[]>(() => {
    return services
      .filter((entry) => entry.id !== service.id)
      .filter((entry) => entry.isActive)
      .filter((entry) => entry.bookingOfferingKind === 'PASS')
      .map((entry) => ({
        serviceId: entry.id,
        name: entry.name,
        unitPrice: entry.basePrice,
      }))
  }, [service.id, services])
  const siblingPassOptionById = useMemo(() => {
    const map = new Map<string, AdditionalSiblingPassOption>()
    for (const option of additionalSiblingPassOptions) {
      map.set(option.serviceId, option)
    }
    return map
  }, [additionalSiblingPassOptions])
  const showAdditionalSiblingPicker = useMemo(
    () => showsAdditionalSiblingPicker(service),
    [service],
  )
  const freeAdultCount = useMemo(() => resolveFreeAdultCount(service), [service])
  const isPlayCategory = getSchedulingTopLevelId(service.categoryId) === 'PLAY'
  const guestCountLabel =
    usesOpenPlayHouseholdBooking || isPlayCategory ? 'No of passes' : 'Guests'
  const passCountHelperText = useMemo(
    () => buildPassCountHelperText(service, maxPassCount),
    [maxPassCount, service],
  )

  const categoryIncludedAddOns = useMemo(
    () => resolveCategoryIncludedAddOns(bookingCategory, addOnCatalog),
    [addOnCatalog, bookingCategory],
  )

  const categoryOptionalAddOns = useMemo(
    () => resolveCategoryOptionalAddOns(bookingCategory, addOnCatalog),
    [addOnCatalog, bookingCategory],
  )

  const baseTotal = useMemo(() => {
    const quantityDrivenBaseTotal =
      service.bookingOfferingKind === 'PASS' || isPlayCategory
        ? Math.round(service.basePrice * guestCount * 100) / 100
        : computeSchedulingBaseTotal(
            service,
            slot,
            guestCount,
            selectedWindow ?? null,
            selectedDurationMinutes,
          )
    if (usesOpenPlayHouseholdBooking) {
      const siblingPart = additionalSiblingPassOptions.length > 0
        ? Object.entries(additionalSiblingPassQuantities).reduce((sum, [serviceId, quantity]) => {
            const option = siblingPassOptionById.get(serviceId)
            if (!option || quantity <= 0) {
              return sum
            }
            return sum + option.unitPrice * quantity
          }, 0)
        : resolvedLegacySiblingPart({
            additionalSiblingCount,
            additionalSiblingUnitPrice,
          })
      const raw = Math.round((quantityDrivenBaseTotal + siblingPart) * 100) / 100
      return isFreeInfant ? 0 : raw
    }
    const raw = quantityDrivenBaseTotal
    return isFreeInfant ? 0 : raw
  }, [
    additionalSiblingCount,
    additionalSiblingPassOptions.length,
    additionalSiblingPassQuantities,
    additionalSiblingUnitPrice,
    guestCount,
    isPlayCategory,
    isFreeInfant,
    selectedDurationMinutes,
    selectedWindow,
    service,
    slot,
    siblingPassOptionById,
    usesOpenPlayHouseholdBooking,
  ])

  const additionalAdultTotal = useMemo(() => {
    if (additionalAdultUnitPrice == null || additionalAdultCount <= 0) {
      return 0
    }
    return Math.round(additionalAdultUnitPrice * additionalAdultCount * 100) / 100
  }, [additionalAdultCount, additionalAdultUnitPrice])

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
    () =>
      Math.round(
        (baseTotal + additionalAdultTotal + categoryOptionalAddOnTotal) * 100,
      ) / 100,
    [additionalAdultTotal, baseTotal, categoryOptionalAddOnTotal],
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

  const depositPercent = bookingCategory.depositPercent ?? null
  const depositDueToday = useMemo(() => {
    if (depositPercent == null) return null
    return Math.round(((grandTotal * depositPercent) / 100) * 100) / 100
  }, [depositPercent, grandTotal])
  const depositDueOnArrival = useMemo(() => {
    if (depositDueToday == null) return null
    return Math.round((grandTotal - depositDueToday) * 100) / 100
  }, [depositDueToday, grandTotal])

  const toggleSelectedChild = useCallback(
    (childId: string, checked: boolean) => {
      setSelectedChildIds((prev) => {
        if (!checked) {
          return prev.filter((id) => id !== childId)
        }
        if (prev.includes(childId)) {
          return prev
        }
        if (maxChildSelections != null && prev.length >= maxChildSelections) {
          return prev
        }
        return [...prev, childId]
      })
    },
    [maxChildSelections],
  )

  const applyParticipantContact = useCallback(
    (contactIdValue: string) => {
      setParticipantContactId(contactIdValue)
      const contact = contacts.find((c) => c.id === contactIdValue) ?? null
      setParticipantName(contact ? contactDisplayName(contact) : '')
      setParticipantDateOfBirth(contact?.dateOfBirth ?? null)
    },
    [contacts],
  )

  const childAgeRules = useMemo(() => resolveServiceChildAgeRules(service), [service])

  const selectedChildrenMeetAgeRules = useMemo(() => {
    if (childAgeRules == null || !usesOpenPlayHouseholdBooking) {
      return true
    }
    if (selectedChildIds.length < 1) {
      return false
    }
    return selectedChildIds.every((childId) => {
      const child = contacts.find((entry) => entry.id === childId)
      if (child == null) {
        return false
      }
      return childAgeRules.isEligible(child.dateOfBirth)
    })
  }, [childAgeRules, contacts, selectedChildIds, usesOpenPlayHouseholdBooking])

  useEffect(() => {
    if (!usesOpenPlayHouseholdBooking || childAgeRules == null) {
      return
    }
    setSelectedChildIds((prev) =>
      prev.filter((childId) => {
        const child = contacts.find((entry) => entry.id === childId)
        if (child == null) {
          return false
        }
        return childAgeRules.isEligible(child.dateOfBirth)
      }),
    )
  }, [childAgeRules, contacts, usesOpenPlayHouseholdBooking])

  const canSubmitDetails = useMemo(() => {
    if (usesTicketBookingSidebar) {
      return guestCount >= 1
    }
    if (usesOpenPlayHouseholdBooking) {
      if (service.id === PARENTS_NIGHT_OUT_SERVICE_ID) {
        return selectedChildrenMeetAgeRules
      }
      return selectedChildIds.length >= 1
    }
    if (needsAccompanyingAdult && accompanyingAdultContactId.trim().length === 0) {
      return false
    }
    if (needsHouseholdChildren && selectedChildIds.length < 1) {
      return false
    }
    if (needsAgeParticipant && participantName.trim().length === 0) {
      return false
    }
    return true
  }, [
    accompanyingAdultContactId,
    guestCount,
    usesTicketBookingSidebar,
    needsAccompanyingAdult,
    needsAgeParticipant,
    needsHouseholdChildren,
    participantName,
    selectedChildIds.length,
    selectedChildrenMeetAgeRules,
    service.id,
    usesOpenPlayHouseholdBooking,
  ])

  const submitBooking = useCallback(
    (options?: { readonly persist?: boolean }): SchedulingBooking => {
    const persist = options?.persist !== false
    const nowIso = new Date().toISOString()
    const additionalAdultLines =
      additionalAdultUnitPrice != null && additionalAdultCount > 0
        ? [
            {
              id: 'bkao-additional-adult',
              name: 'Additional Adult',
              quantity: additionalAdultCount,
              unitPrice: additionalAdultUnitPrice,
              totalPrice: additionalAdultTotal,
            },
          ]
        : []
    const additionalSiblingLines =
      additionalSiblingPassOptions.length > 0
        ? Object.entries(additionalSiblingPassQuantities)
            .map(([serviceId, quantity]) => {
              const option = siblingPassOptionById.get(serviceId)
              if (!option || quantity <= 0) {
                return null
              }
              return {
                id: `bkao-additional-sibling-${serviceId}`,
                name: `Additional sibling (${option.name})`,
                quantity,
                unitPrice: option.unitPrice,
                totalPrice: Math.round(option.unitPrice * quantity * 100) / 100,
              }
            })
            .filter(
              (
                line,
              ): line is {
                id: string
                name: string
                quantity: number
                unitPrice: number
                totalPrice: number
              } => line != null,
            )
        : resolvedLegacySiblingLines({
            additionalSiblingCount,
            additionalSiblingUnitPrice,
          })
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
    const bookingAddOns = [
      ...additionalAdultLines,
      ...additionalSiblingLines,
      ...categoryIncludedLines,
      ...categoryOptionalLines,
    ].filter((line, index, rows) => rows.findIndex((row) => row.id === line.id) === index)

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

    const adultContact = contacts.find((c) => c.id === accompanyingAdultContactId) ?? null
    const primaryContact =
      contacts.find((c) => c.id === primaryGuardianContactId) ?? null
    const secondaryContact =
      contacts.find((c) => c.id === secondaryGuardianContactId) ?? null
    const participantLabel =
      needsHouseholdChildren || needsAgeParticipant ? participantName.trim() : null

    const booking: SchedulingBooking = {
      id: createBookingId(),
      bookingType: service.serviceType,
      serviceSlotId: slot?.id ?? null,
      serviceSlot: slot ?? null,
      serviceId: service.id,
      service,
      contactId: contactId ?? 'contact-1',
      contactName: contactName ?? 'Rachel Green',
      participantName: participantLabel || null,
      participantChildIds:
        needsHouseholdChildren && selectedChildIds.length > 0
          ? [...selectedChildIds]
          : undefined,
      primaryGuardianContactId: usesOpenPlayHouseholdBooking
        ? primaryGuardianContactId
        : undefined,
      primaryGuardianName:
        usesOpenPlayHouseholdBooking && primaryContact
          ? householdContactFullName(primaryContact)
          : undefined,
      secondaryGuardianContactId: usesOpenPlayHouseholdBooking
        ? secondaryGuardianContactId || null
        : undefined,
      secondaryGuardianName:
        usesOpenPlayHouseholdBooking && secondaryContact
          ? householdContactFullName(secondaryContact)
          : undefined,
      accompanyingAdultContactId: needsAccompanyingAdult
        ? accompanyingAdultContactId || null
        : undefined,
      accompanyingAdultName:
        needsAccompanyingAdult && adultContact
          ? contactDisplayName(adultContact)
          : undefined,
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
    additionalAdultCount,
    additionalAdultTotal,
    additionalAdultUnitPrice,
    additionalSiblingCount,
    additionalSiblingPassOptions.length,
    additionalSiblingPassQuantities,
    additionalSiblingUnitPrice,
    categoryIncludedAddOns,
    checkoutCouponCode,
    durationHours,
    guestCount,
    grandTotal,
    accompanyingAdultContactId,
    contacts,
    needsAccompanyingAdult,
    needsHouseholdChildren,
    needsParticipant,
    notes,
    participantName,
    primaryGuardianContactId,
    secondaryGuardianContactId,
    selectedChildIds,
    usesOpenPlayHouseholdBooking,
    selectedCategoryAddOnIds,
    selectedDurationMinutes,
    selectedWindow,
    service,
    siblingPassOptionById,
    slot,
    source,
    specialInstructions,
    contactId,
    contactName,
    actedByStaffId,
  ])

  useEffect(() => {
    if (additionalSiblingPassOptions.length === 0) {
      setAdditionalSiblingPassQuantities({})
      return
    }
    setAdditionalSiblingPassQuantities((previous) => {
      const next: Record<string, number> = {}
      for (const option of additionalSiblingPassOptions) {
        const quantity = previous[option.serviceId] ?? 0
        if (quantity > 0) {
          next[option.serviceId] = quantity
        }
      }
      return next
    })
  }, [additionalSiblingPassOptions])

  useEffect(() => {
    if (additionalSiblingPassOptions.length === 0) {
      return
    }
    const total = Object.values(additionalSiblingPassQuantities).reduce(
      (sum, quantity) => sum + Math.max(0, quantity),
      0,
    )
    setAdditionalSiblingCount(total)
  }, [additionalSiblingPassOptions.length, additionalSiblingPassQuantities])

  const setAdditionalSiblingPassQuantity = useCallback((serviceId: string, quantity: number) => {
    setAdditionalSiblingPassQuantities((previous) => {
      const safeQuantity = Math.max(0, Math.floor(quantity))
      const next = { ...previous }
      if (safeQuantity <= 0) {
        delete next[serviceId]
      } else {
        next[serviceId] = safeQuantity
      }
      return next
    })
  }, [])

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
    setGuestCount: setGuestCountClamped,
    maxPassCount,
    passCountHelperText,
    participantName,
    setParticipantName,
    participantContactId,
    applyParticipantContact,
    selectedChildIds,
    toggleSelectedChild,
    accompanyingAdultContactId,
    setAccompanyingAdultContactId,
    primaryGuardianContactId,
    setPrimaryGuardianContactId,
    secondaryGuardianContactId,
    setSecondaryGuardianContactId,
    usesOpenPlayHouseholdBooking,
    needsHouseholdChildren,
    needsAccompanyingAdult,
    needsAgeParticipant,
    participantDateOfBirth,
    setParticipantDateOfBirth,
    waiverAccepted,
    setWaiverAccepted,
    notes,
    setNotes,
    specialInstructions,
    setSpecialInstructions,
    additionalAdultCount,
    setAdditionalAdultCount,
    additionalAdultUnitPrice,
    showAdditionalAdultPicker,
    additionalSiblingCount,
    setAdditionalSiblingCount,
    additionalSiblingUnitPrice,
    showAdditionalSiblingPicker,
    additionalSiblingPassOptions,
    additionalSiblingPassQuantities,
    setAdditionalSiblingPassQuantity,
    maxChildSelections,
    guestCountLabel,
    freeAdultCount,
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
    additionalAdultTotal,
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
