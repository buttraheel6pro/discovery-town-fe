/** Shared booking state for inline play facility / pass checkout. */
'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useBookingForm } from '@/hooks/use-booking-form'
import { resolveServiceChildAgeRules } from '@/lib/booking-child-age'
import { getBookingPrimaryGuardianId } from '@/lib/booking-household'
import { useClients } from '@/lib/client-store'
import { useInventory } from '@/lib/inventory-store'
import { resolvePackagesForSchedulingService } from '@/lib/event-package-catalog'
import { isOpenPlaySessionPassOffering } from '@/lib/open-play-session-pass'
import {
  buildGymCartBookingDescription,
  buildPlayCartBookingDescription,
  getPlayBookingConfirmCartLabel,
  GYM_CART_BOOKING_META_KEY,
  isGymFacilityCartCheckoutService,
  isPlayCartCheckoutService,
  PLAY_CART_BOOKING_META_KEY,
  usesBuyNowListingCta,
} from '@/lib/play-cart'
import { getSchedulingConsumerBackLink } from '@/lib/scheduling-consumer-categories'
import { navigateToListingAfterCartAdd } from '@/lib/product-detail-navigation'
import { useScheduling } from '@/lib/scheduling-store'
import { resolveSlotIncrementMinutes } from '@/lib/open-booking-slot-windows'
import { generateDurationOptions, isDocumentSignedAndValid } from '@/lib/utils'
import type { AvailableWindow, SchedulingService } from '@/lib/types'

export function getFacilityCartCheckoutKind(service: SchedulingService): 'play' | 'gym' | null {
  if (isPlayCartCheckoutService(service)) {
    return 'play'
  }
  if (isGymFacilityCartCheckoutService(service)) {
    return 'gym'
  }
  return null
}

export function getPlayFacilityConfirmButtonLabel(
  service: SchedulingService,
  hasSelectedWindow: boolean,
  buyNowListing: boolean,
  passOffering: boolean,
): string {
  if (buyNowListing) {
    return 'Buy now'
  }
  if (isPlayCartCheckoutService(service) || passOffering) {
    if (!passOffering && !hasSelectedWindow) {
      return 'Select a time slot'
    }
    return getPlayBookingConfirmCartLabel()
  }
  if (!hasSelectedWindow) {
    return 'Select a time slot'
  }
  return 'Confirm booking'
}

export function usePlayFacilityBooking(service: SchedulingService) {
  const router = useRouter()
  const { contacts, subscriptions, documents, addContact, addRelationship } = useClients()
  const { packages } = useScheduling()
  const { addCustomCartItem } = useInventory()
  const consumerBackLink = useMemo(
    () => getSchedulingConsumerBackLink(service.categoryId, service.category),
    [service.category, service.categoryId],
  )

  const primaryGuardianId = useMemo(
    () => getBookingPrimaryGuardianId(contacts),
    [contacts],
  )
  const primaryContact = useMemo(
    () => contacts.find((contact) => contact.id === primaryGuardianId) ?? contacts[0] ?? null,
    [contacts, primaryGuardianId],
  )
  const hasActiveMembership = Boolean(
    primaryContact &&
      subscriptions.some(
        (subscription) =>
          subscription.contactId === primaryContact.id &&
          (subscription.status === 'ACTIVE' || subscription.status === 'TRIALING'),
      ),
  )
  const membersOnlyBlocked = service.category.membersOnly === true && !hasActiveMembership
  const facilityCartCheckoutKind = getFacilityCartCheckoutKind(service)
  const childAgeRules = useMemo(() => resolveServiceChildAgeRules(service), [service])

  const todayStr = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [selectedWindow, setSelectedWindow] = useState<AvailableWindow | null>(null)
  const [durationMinutes, setDurationMinutes] = useState<number>(
    service.minDurationMinutes ?? service.durationMinutes ?? 60,
  )
  const [bookedOk, setBookedOk] = useState(false)
  const [addedToCartKind, setAddedToCartKind] = useState<null | 'play' | 'gym'>(null)

  const durationOptions = useMemo(() => {
    const min = service.minDurationMinutes
    const max = service.maxDurationMinutes
    const increment = resolveSlotIncrementMinutes(service)
    if (!min || !max || !increment || max <= min) {
      return []
    }
    return generateDurationOptions(min, max, increment)
  }, [service])

  const activePackages = useMemo(
    () => resolvePackagesForSchedulingService(service, packages),
    [packages, service],
  )
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const selectedPackage = useMemo(
    () => activePackages.find((entry) => entry.id === selectedPackageId) ?? null,
    [activePackages, selectedPackageId],
  )

  const serviceForBooking = useMemo<SchedulingService>(() => {
    if (!selectedPackage) {
      return service
    }
    return { ...service, basePrice: selectedPackage.basePrice }
  }, [selectedPackage, service])

  const bookingForm = useBookingForm({
    service: serviceForBooking,
    selectedWindow,
    selectedDurationMinutes: durationOptions.length > 0 ? durationMinutes : undefined,
    contacts,
    contactId: primaryContact?.id,
    contactName: primaryContact
      ? `${primaryContact.firstName} ${primaryContact.lastName}`.trim()
      : undefined,
  })

  const passCountHelperText = useMemo(() => {
    const parts = [bookingForm.passCountHelperText, childAgeRules?.label].filter(
      (part): part is string => Boolean(part),
    )
    return parts.length > 0 ? parts.join(' · ') : undefined
  }, [bookingForm.passCountHelperText, childAgeRules?.label])

  const selectedCategoryAddOnNames = useMemo(() => {
    const selectedIds = new Set(bookingForm.selectedCategoryAddOnIds)
    return bookingForm.categoryOptionalAddOns
      .filter((addOn) => selectedIds.has(addOn.id))
      .map((addOn) => addOn.name)
  }, [bookingForm.categoryOptionalAddOns, bookingForm.selectedCategoryAddOnIds])

  const selectedSiblingPassLabels = useMemo(() => {
    return bookingForm.additionalSiblingPassOptions
      .map((option) => {
        const quantity = bookingForm.additionalSiblingPassQuantities[option.serviceId] ?? 0
        if (quantity <= 0) {
          return null
        }
        return `${option.name} x${quantity}`
      })
      .filter((value): value is string => value != null)
  }, [bookingForm.additionalSiblingPassOptions, bookingForm.additionalSiblingPassQuantities])

  const selectedAdditionalAdultLabel = useMemo(() => {
    if (
      bookingForm.additionalAdultCount < 1 ||
      bookingForm.additionalAdultUnitPrice == null
    ) {
      return null
    }
    return `Additional adult x${bookingForm.additionalAdultCount}`
  }, [bookingForm.additionalAdultCount, bookingForm.additionalAdultUnitPrice])

  const requiredWaiverDocs = useMemo(() => {
    if (!service.requiresWaiver) {
      return []
    }
    const ids = service.requiredDocumentIds ?? []
    if (ids.length === 0) {
      return []
    }
    return documents.filter(
      (document) => document.documentType === 'WAIVER' && ids.includes(document.id),
    )
  }, [documents, service.requiredDocumentIds, service.requiresWaiver])

  const missingRequiredWaivers = useMemo(() => {
    if (!service.requiresWaiver) {
      return []
    }
    if (requiredWaiverDocs.length === 0) {
      return []
    }
    if (!primaryContact) {
      return requiredWaiverDocs
    }
    return requiredWaiverDocs.filter(
      (document) => !isDocumentSignedAndValid(primaryContact.documents, document.id),
    )
  }, [primaryContact, requiredWaiverDocs, service.requiresWaiver])

  const waiversOk = useMemo(() => {
    if (!service.requiresWaiver) {
      return true
    }
    if (requiredWaiverDocs.length === 0) {
      return bookingForm.waiverAccepted
    }
    return missingRequiredWaivers.length === 0
  }, [
    bookingForm.waiverAccepted,
    missingRequiredWaivers.length,
    requiredWaiverDocs.length,
    service.requiresWaiver,
  ])

  const openMode = service.bookingMode === 'OPEN'
  const isPassOffering = isOpenPlaySessionPassOffering(service)
  const showBookingDetailsForm = isPassOffering || selectedWindow != null
  const buyNowListing = usesBuyNowListingCta(service)

  function handleConfirmBooking() {
    if (bookedOk || addedToCartKind !== null) {
      return
    }
    if (!selectedWindow && !isPassOffering) {
      return
    }
    if (!bookingForm.canSubmitDetails) {
      return
    }
    if (facilityCartCheckoutKind === 'play') {
      const booking = bookingForm.submitBooking({ persist: false })
      addCustomCartItem({
        type: 'booking',
        name: service.name,
        description: buildPlayCartBookingDescription(booking, {
          packageName: selectedPackage?.name ?? null,
        }),
        price: booking.totalAmount,
        quantity: 1,
        imageUrl: service.imageUrl ?? undefined,
        metadata: {
          [PLAY_CART_BOOKING_META_KEY]: true,
          serviceId: service.id,
        },
      })
      setAddedToCartKind('play')
      navigateToListingAfterCartAdd(router, consumerBackLink.href, {
        itemName: service.name,
      })
      return
    }
    if (facilityCartCheckoutKind === 'gym') {
      const booking = bookingForm.submitBooking({ persist: false })
      addCustomCartItem({
        type: 'booking',
        name: service.name,
        description: buildGymCartBookingDescription(booking, {
          packageName: selectedPackage?.name ?? null,
        }),
        price: booking.totalAmount,
        quantity: 1,
        imageUrl: service.imageUrl ?? undefined,
        metadata: {
          [GYM_CART_BOOKING_META_KEY]: true,
          serviceId: service.id,
        },
      })
      setAddedToCartKind('gym')
      navigateToListingAfterCartAdd(router, consumerBackLink.href, {
        itemName: service.name,
      })
      return
    }
    bookingForm.submitBooking()
    setBookedOk(true)
  }

  return {
    service,
    contacts,
    addContact,
    addRelationship,
    primaryContact,
    membersOnlyBlocked,
    childAgeRules,
    selectedDate,
    setSelectedDate,
    selectedWindow,
    setSelectedWindow,
    durationMinutes,
    setDurationMinutes,
    durationOptions,
    activePackages,
    selectedPackageId,
    setSelectedPackageId,
    selectedPackage,
    bookingForm,
    passCountHelperText,
    selectedCategoryAddOnNames,
    selectedSiblingPassLabels,
    selectedAdditionalAdultLabel,
    requiredWaiverDocs,
    waiversOk,
    openMode,
    isPassOffering,
    showBookingDetailsForm,
    buyNowListing,
    bookedOk,
    addedToCartKind,
    handleConfirmBooking,
  }
}

export type PlayFacilityBookingState = ReturnType<typeof usePlayFacilityBooking>
