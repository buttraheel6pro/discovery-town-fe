'use client'

import { useEffect, useMemo, useState, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Clock,
  Users,
  Calendar,
  CheckCircle2,
  Star,
  MapPin,
} from 'lucide-react'
import { BookingAdditionalAdultField } from '@/components/customer/booking-additional-adult-field'
import { BookingAmenitiesSection } from '@/components/customer/booking-amenities-section'
import { BookingCategoryAddons } from '@/components/customer/booking-category-addons'
import { BookingFamilyMemberFields } from '@/components/customer/booking-family-member-fields'
import { BookingStudentFields } from '@/components/customer/booking-student-fields'
import { BookingHouseholdFields } from '@/components/customer/booking-household-fields'
import { BookingFlowCouponSection } from '@/components/customer/booking-flow-coupon-section'
import { EventBookingScheduleSection } from '@/components/customer/event-booking-schedule-section'
import { CustomerNavbar } from '@/components/customer/navbar'
import { CustomerFooter } from '@/components/customer/footer'
import { PackageSelector } from '@/components/customer/package-selector'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BookingCartCard,
  BookingCartCardContent,
  BookingCartCardHeader,
  BookingCartCardTitle,
} from '@/components/customer/booking-cart-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBookingForm } from '@/hooks/use-booking-form'
import { useClients } from '@/lib/client-store'
import { useInventory } from '@/lib/inventory-store'
import { instructors } from '@/lib/mock-data'
import {
  formatLearningFormat,
  formatProgramTermLabel,
} from '@/lib/learn-catalog'
import {
  formatLearnProgramPeriodLabel,
  isLearnProgramEnrollmentReady,
  resolveLearnProgramBounds,
  resolveLearnProgramSessionsInBounds,
} from '@/lib/learn-enrollment'
import {
  buildEventCartBookingDescription,
  buildGymCartBookingDescription,
  buildLearnCartBookingDescription,
  buildPlayCartBookingDescription,
  EVENT_CART_BOOKING_META_KEY,
  GYM_CART_BOOKING_META_KEY,
  LEARN_CART_BOOKING_META_KEY,
  PLAY_CART_BOOKING_META_KEY,
  isEventSlotCartCheckoutService,
  isGymClassCartCheckoutService,
  isLearnCartCheckoutService,
  isPlayClassCartCheckoutService,
  isPlayMenuServiceEventScheduleListing,
  usesClassDetailSplitCartCheckoutLayout,
} from '@/lib/play-cart'
import { useScheduling } from '@/lib/scheduling-store'
import {
  buildSchedulingCategoryById,
  isConsumerVisibleSchedulingService,
} from '@/lib/scheduling-visibility'
import {
  getSchedulingConsumerBackLink,
  getSchedulingTopLevelId,
} from '@/lib/scheduling-consumer-categories'
import { getPlayBookingConfirmCartLabel } from '@/lib/play-cart'
import { navigateToListingAfterCartAdd } from '@/lib/product-detail-navigation'
import {
  eventBookingScheduleRequiresTimeSelection,
  isEventBookingScheduleReadyForBookingForm,
  resolveEventBookingScheduleMode,
  shouldShowCustomerEventBookingSchedule,
  shouldShowEventDayRangePicker,
} from '@/lib/event-booking-schedule'
import {
  findSchedulingSlotContainingWindow,
} from '@/lib/open-booking-slot-windows'
import {
  formatPrice,
  formatSlotDate,
  formatSlotTime,
  formatSlotTimeRange,
  isDocumentSignedAndValid,
} from '@/lib/utils'
import type {
  AvailableWindow,
  Instructors,
  SchedulingService,
  SchedulingSlot,
} from '@/lib/types'

const levelColors: Record<string, string> = {
  Beginner: 'bg-green-100 text-green-700',
  Intermediate: 'bg-yellow-100 text-yellow-700',
  Advanced: 'bg-red-100 text-red-700',
  'All Levels': 'bg-blue-100 text-blue-700',
}

function getClassEnrolButtonLabel(
  selectedSlot: SchedulingSlot | undefined,
  gymClassCartCheckout: boolean,
  learnCartCheckout: boolean,
  eventClassCartCheckout: boolean,
  playClassCartCheckout: boolean,
  showBookingDetailsReady: boolean,
  showEventBookingSchedule: boolean,
  requiresTimeSelection: boolean,
): string {
  if (showEventBookingSchedule && !showBookingDetailsReady) {
    return requiresTimeSelection ? 'Select date and time' : 'Select a date'
  }
  if (!selectedSlot && !showEventBookingSchedule) {
    return 'Select a session'
  }
  if (playClassCartCheckout && !showBookingDetailsReady) {
    return 'Select a time slot'
  }
  if (selectedSlot?.status === 'FULL') {
    return 'Class full'
  }
  if (playClassCartCheckout) {
    return getPlayBookingConfirmCartLabel()
  }
  if (gymClassCartCheckout || learnCartCheckout || eventClassCartCheckout) {
    return 'Add to cart'
  }
  return 'Enrol now'
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatBookingDateDisplay(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function formatStartTimeDisplay(startAt: string | null): string {
  if (!startAt) {
    return '—'
  }
  return formatSlotTime(startAt)
}

function getClassCartSuccessCopy(
  kind: 'gym' | 'learn' | 'event' | 'play',
  serviceName: string,
): { readonly title: string; readonly description: string } {
  const sectionByKind: Record<'gym' | 'learn' | 'event' | 'play', string> = {
    gym: 'Gym bookings',
    learn: 'Learn bookings',
    event: 'Event bookings',
    play: 'Play bookings',
  }
  return {
    title: 'Added to cart',
    description: `${serviceName} — open ${sectionByKind[kind]} in your cart to complete checkout.`,
  }
}

export function ClassDetailContent({ service }: Readonly<{ service: SchedulingService }>) {
  const router = useRouter()
  const { slots, packages, categories } = useScheduling()
  const { contacts, subscriptions, documents, addContact, addRelationship } = useClients()
  const { addCustomCartItem } = useInventory()

  const categoryById = useMemo(
    () => buildSchedulingCategoryById(categories),
    [categories],
  )

  const primaryContact =
    contacts.find((c) => c.contactType === 'CUSTOMER') ?? contacts[0] ?? null
  const hasActiveMembership = Boolean(
    primaryContact &&
      subscriptions.some(
        (s) =>
          s.contactId === primaryContact.id &&
          (s.status === 'ACTIVE' || s.status === 'TRIALING'),
      ),
  )
  const hasSubscriptionForCoupons = Boolean(
    primaryContact &&
      subscriptions.some(
        (s) =>
          s.contactId === primaryContact.id &&
          (s.status === 'ACTIVE' ||
            s.status === 'TRIALING' ||
            s.status === 'PAUSED'),
      ),
  )
  const membersOnlyBlocked = service.category.membersOnly === true && !hasActiveMembership
  const consumerBackLink = useMemo(
    () => getSchedulingConsumerBackLink(service.categoryId, service.category),
    [service.category, service.categoryId],
  )
  const gymClassCartCheckout = isGymClassCartCheckoutService(service)
  const learnCartCheckout = isLearnCartCheckoutService(service)
  const learnProgramSummary = useMemo(() => {
    if (!learnCartCheckout) {
      return null
    }
    const bounds = resolveLearnProgramBounds(service, slots)
    const sessions = resolveLearnProgramSessionsInBounds(service, slots)
    if (!bounds || sessions.length === 0) {
      return null
    }
    return {
      periodLabel: formatLearnProgramPeriodLabel(bounds),
      sessionCount: sessions.length,
    }
  }, [learnCartCheckout, service, slots])
  const eventClassCartCheckout =
    isEventSlotCartCheckoutService(service, categoryById) &&
    !gymClassCartCheckout &&
    !learnCartCheckout
  const playClassCartCheckout = isPlayClassCartCheckoutService(service, service.category)
  const instructor: Instructors | undefined = service.instructorId
    ? instructors.find((i) => i.instructorId === service.instructorId || i.id === service.instructorId)
    : undefined

  const upcomingSlots = useMemo(() => {
    const now = Date.now()
    return slots
      .filter(
        (s) =>
          s.serviceId === service.id &&
          s.status !== 'CANCELLED' &&
          s.status !== 'COMPLETED' &&
          new Date(s.startAt).getTime() >= now,
      )
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  }, [slots, service.id])

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [selectedPlayWindow, setSelectedPlayWindow] = useState<AvailableWindow | null>(null)
  const [selectedToDate, setSelectedToDate] = useState<string>(toIsoDate(new Date()))
  const [selectedAvailabilityDate, setSelectedAvailabilityDate] = useState<string>(
    toIsoDate(new Date()),
  )
  const selectedSlot: SchedulingSlot | undefined = useMemo(
    () => upcomingSlots.find((s) => s.id === selectedSlotId),
    [upcomingSlots, selectedSlotId],
  )
  const isPlayServiceOffering =
    getSchedulingTopLevelId(service.categoryId) === 'PLAY' &&
    service.bookingOfferingKind !== 'PASS'
  const showEventBookingSchedule = shouldShowCustomerEventBookingSchedule(service)
  const playMenuServiceEventSchedule = isPlayMenuServiceEventScheduleListing(
    service,
    service.category,
    showEventBookingSchedule,
  )
  const eventScheduleMode = useMemo(
    () => resolveEventBookingScheduleMode(service),
    [service],
  )
  const eventShowDayRangePicker = useMemo(
    () => shouldShowEventDayRangePicker(eventScheduleMode, slots, service),
    [eventScheduleMode, service, slots],
  )
  const showBookingDetailsForm = useMemo(() => {
    if (learnCartCheckout) {
      return isLearnProgramEnrollmentReady(service, slots, selectedPlayWindow)
    }
    if (!showEventBookingSchedule) {
      return selectedSlot != null
    }
    return isEventBookingScheduleReadyForBookingForm(eventScheduleMode, {
      selectedDate: selectedAvailabilityDate,
      selectedToDate: selectedToDate,
      selectedWindow: selectedPlayWindow,
      showDayRangePicker: eventShowDayRangePicker,
    })
  }, [
    eventScheduleMode,
    eventShowDayRangePicker,
    selectedAvailabilityDate,
    selectedPlayWindow,
    selectedSlot,
    selectedToDate,
    showEventBookingSchedule,
    learnCartCheckout,
    service,
    slots,
  ])
  const requiresTimeSelection = eventBookingScheduleRequiresTimeSelection(eventScheduleMode)
  const useSplitCartCheckoutLayout = usesClassDetailSplitCartCheckoutLayout(
    service,
    service.category,
    showEventBookingSchedule,
  )
  const selectedAvailabilityWindow = useMemo<AvailableWindow | null>(() => {
    if (showEventBookingSchedule) {
      return selectedPlayWindow
    }
    if (!selectedSlot) {
      return null
    }
    const slotDate = selectedSlot.startAt.split('T')[0]
    if (slotDate !== selectedAvailabilityDate) {
      return null
    }
    return {
      startAt: selectedSlot.startAt,
      endAt: selectedSlot.endAt,
      spotsRemaining: Math.max(0, selectedSlot.effectiveCapacity - selectedSlot.bookedCount),
    }
  }, [
    selectedAvailabilityDate,
    selectedPlayWindow,
    selectedSlot,
    showEventBookingSchedule,
  ])

  useEffect(() => {
    if (showEventBookingSchedule) {
      return
    }
    if (selectedSlotId === null && upcomingSlots[0]) {
      setSelectedSlotId(upcomingSlots[0].id)
    }
  }, [showEventBookingSchedule, upcomingSlots, selectedSlotId])

  useEffect(() => {
    if (showEventBookingSchedule) {
      return
    }
    if (!selectedSlot) {
      return
    }
    const slotDate = selectedSlot.startAt.split('T')[0]
    setSelectedAvailabilityDate(slotDate)
  }, [showEventBookingSchedule, selectedSlot])

  const activePackages = useMemo(
    () => packages.filter((p) => p.serviceId === service.id && p.isActive),
    [packages, service.id],
  )
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const selectedPackage = useMemo(
    () => activePackages.find((p) => p.id === selectedPackageId) ?? null,
    [activePackages, selectedPackageId],
  )

  const serviceForBooking = useMemo<SchedulingService>(() => {
    if (!selectedPackage) return service
    return { ...service, basePrice: selectedPackage.basePrice }
  }, [selectedPackage, service])

  const selectedSlotForBooking = useMemo<SchedulingSlot | undefined>(() => {
    if (!selectedSlot) return undefined
    if (!selectedPackage) return selectedSlot
    return { ...selectedSlot, effectivePrice: selectedPackage.basePrice }
  }, [selectedPackage, selectedSlot])

  const bookingForm = useBookingForm({
    service: serviceForBooking,
    slot: selectedSlotForBooking,
    selectedWindow: showEventBookingSchedule ? selectedPlayWindow : undefined,
    contacts,
    contactId: primaryContact?.id,
    contactName: primaryContact
      ? `${primaryContact.firstName} ${primaryContact.lastName}`.trim()
      : undefined,
  })

  const bookingPricingResetKey = useMemo(
    () =>
      [
        selectedSlot?.id ?? '',
        selectedPackageId ?? '',
        String(bookingForm.totalBeforeCoupon),
      ].join('|'),
    [bookingForm.totalBeforeCoupon, selectedPackageId, selectedSlot?.id],
  )
  const selectedCategoryAddOnNames = useMemo(() => {
    const selectedIds = new Set(bookingForm.selectedCategoryAddOnIds)
    return bookingForm.categoryOptionalAddOns
      .filter((addOn) => selectedIds.has(addOn.id))
      .map((addOn) => addOn.name)
  }, [bookingForm.categoryOptionalAddOns, bookingForm.selectedCategoryAddOnIds])
  const selectedAdditionalAdultLabel = useMemo(() => {
    if (
      bookingForm.additionalAdultCount < 1 ||
      bookingForm.additionalAdultUnitPrice == null
    ) {
      return null
    }
    return `Additional adult x${bookingForm.additionalAdultCount}`
  }, [bookingForm.additionalAdultCount, bookingForm.additionalAdultUnitPrice])
  const showOptionalAddOnsSummary =
    bookingForm.showAdditionalAdultPicker ||
    bookingForm.categoryOptionalAddOns.length > 0

  const requiredWaiverDocs = useMemo(() => {
    if (!service.requiresWaiver) return []
    const ids = service.requiredDocumentIds ?? []
    if (ids.length === 0) return []
    return documents.filter((d) => d.documentType === 'WAIVER' && ids.includes(d.id))
  }, [documents, service.requiredDocumentIds, service.requiresWaiver])

  const missingRequiredWaivers = useMemo(() => {
    if (!service.requiresWaiver) return []
    if (requiredWaiverDocs.length === 0) return []
    if (!primaryContact) return requiredWaiverDocs
    return requiredWaiverDocs.filter(
      (d) => !isDocumentSignedAndValid(primaryContact.documents, d.id),
    )
  }, [primaryContact, requiredWaiverDocs, service.requiresWaiver])

  const waiversOk = useMemo(() => {
    if (!service.requiresWaiver) return true
    if (requiredWaiverDocs.length === 0) return bookingForm.waiverAccepted
    return missingRequiredWaivers.length === 0
  }, [
    bookingForm.waiverAccepted,
    missingRequiredWaivers.length,
    requiredWaiverDocs.length,
    service.requiresWaiver,
  ])

  const [enrolled, setEnrolled] = useState(false)
  const [classCartSuccessKind, setClassCartSuccessKind] = useState<
    null | 'gym' | 'learn' | 'event' | 'play'
  >(null)
  const [waitlistOpen, setWaitlistOpen] = useState(false)

  const capacity = selectedSlot?.effectiveCapacity ?? service.capacity
  const booked = selectedSlot?.bookedCount ?? 0
  const spotsLeft = Math.max(0, capacity - booked)
  const fillPct = capacity > 0 ? Math.round((booked / capacity) * 100) : 0
  const level = service.level ?? 'All Levels'
  const levelClass = levelColors[level] ?? levelColors['All Levels']

  function handleEnrol() {
    if (enrolled || classCartSuccessKind !== null) {
      return
    }
    if (showEventBookingSchedule) {
      if (!selectedPlayWindow) return
    } else {
      if (!selectedSlot) return
      if (isPlayServiceOffering && !selectedPlayWindow) return
      if (selectedSlot.status === 'FULL') return
    }
    if (!bookingForm.canSubmitDetails) return
    if (gymClassCartCheckout) {
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
      setClassCartSuccessKind('gym')
      navigateToListingAfterCartAdd(router, consumerBackLink.href, {
        itemName: service.name,
      })
      return
    }
    if (learnCartCheckout) {
      const booking = bookingForm.submitBooking({ persist: false })
      addCustomCartItem({
        type: 'booking',
        name: service.name,
        description: buildLearnCartBookingDescription(booking, {
          packageName: selectedPackage?.name ?? null,
        }),
        price: booking.totalAmount,
        quantity: 1,
        imageUrl: service.imageUrl ?? undefined,
        metadata: {
          [LEARN_CART_BOOKING_META_KEY]: true,
          serviceId: service.id,
        },
      })
      setClassCartSuccessKind('learn')
      navigateToListingAfterCartAdd(router, consumerBackLink.href, {
        itemName: service.name,
      })
      return
    }
    if (eventClassCartCheckout) {
      const booking = bookingForm.submitBooking({ persist: false })
      addCustomCartItem({
        type: 'booking',
        name: service.name,
        description: buildEventCartBookingDescription(booking, {
          packageName: selectedPackage?.name ?? null,
          occasionLabel: null,
          selectedDate: null,
        }),
        price: booking.totalAmount,
        quantity: 1,
        imageUrl: service.imageUrl ?? undefined,
        metadata: {
          [EVENT_CART_BOOKING_META_KEY]: true,
          serviceId: service.id,
        },
      })
      setClassCartSuccessKind('event')
      navigateToListingAfterCartAdd(router, consumerBackLink.href, {
        itemName: service.name,
      })
      return
    }
    if (playClassCartCheckout || playMenuServiceEventSchedule) {
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
      setClassCartSuccessKind('play')
      navigateToListingAfterCartAdd(router, consumerBackLink.href, {
        itemName: service.name,
      })
      return
    }
    bookingForm.submitBooking()
    setEnrolled(true)
  }

  return (
    <>
      <div className="relative h-36 sm:h-48">
        {service.imageUrl ? (
          <Image
            src={service.imageUrl}
            alt={service.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-secondary" aria-hidden />
        )}
        <div className="absolute inset-0 bg-primary/65" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
          <Link
            href={consumerBackLink.href}
            className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-4 w-fit"
          >
            <ArrowLeft className="w-4 h-4" /> {consumerBackLink.label}
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {learnCartCheckout ? (
                  <>
                    <Badge className="bg-accent text-accent-foreground">
                      {service.subjectArea ?? 'Learn'}
                    </Badge>
                    {service.gradeLevel ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                        Grades {service.gradeLevel}
                      </span>
                    ) : null}
                    {service.learningFormat ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                        {formatLearningFormat(service.learningFormat)}
                      </span>
                    ) : null}
                    {service.programTerm ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                        {formatProgramTermLabel(service.programTerm, service.programYear)}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Badge className="bg-accent text-accent-foreground">
                      {service.sport ?? 'CLASS'}
                    </Badge>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${levelClass}`}>
                      {level}
                    </span>
                  </>
                )}
              </div>
              <h1
                className="text-3xl sm:text-4xl font-black text-white text-balance"
                style={{ fontFamily: 'var(--font-barlow)' }}
              >
                {service.name}
              </h1>
            </div>
            <p className="text-3xl font-black text-accent">
              ${service.basePrice}
              <span className="text-base font-normal text-white/80">/session</span>
            </p>
          </div>
        </div>
      </div>

      <div
        className={
          useSplitCartCheckoutLayout
            ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 gap-8 lg:grid-cols-3'
            : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8'
        }
      >
        <div
          className={
            useSplitCartCheckoutLayout ? 'space-y-8 lg:col-span-2' : 'lg:col-span-2 space-y-8'
          }
        >
          <section>
            <h2 className="text-xl font-bold mb-3">
              {learnCartCheckout ? 'About this Program' : 'About this Class'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {service.description ?? '—'}
            </p>
          </section>

          <Separator />

          <BookingAmenitiesSection
            serviceAmenities={service.amenities}
            freeCategoryAddOns={bookingForm.categoryIncludedAddOns}
          />

          {showEventBookingSchedule ? (
            <>
              <Separator />
              {/*
              <section>
                <h2 className="text-xl font-bold mb-5">Schedule</h2>
                {service.schedule?.length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {service.schedule.map((s, idx) => (
                      <div
                        key={`${s.dayOfWeek}-${idx}`}
                        className="flex items-center gap-3 p-4 rounded-xl bg-secondary border border-border"
                      >
                        <Calendar className="w-5 h-5 text-accent shrink-0" />
                        <div>
                          <p className="font-bold text-sm">{s.dayOfWeek}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.startTime} – {s.endTime}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">See available sessions to book.</p>
                )}
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-accent" /> {service.durationMinutes} min
                  </span>
                  {service.facilityName ? (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-accent" /> {service.facilityName}
                    </span>
                  ) : null}
                </div>
              </section>

              <Separator />
              */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-accent" /> {service.durationMinutes} min
                </span>
                {service.facilityName ? (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-accent" /> {service.facilityName}
                  </span>
                ) : null}
              </div>
              <EventBookingScheduleSection
                service={service}
                slots={slots}
                durationMinutes={service.durationMinutes}
                selectedDate={selectedAvailabilityDate}
                onSelectedDateChange={(date) => {
                  setSelectedAvailabilityDate(date)
                  setSelectedSlotId(null)
                  setSelectedPlayWindow(null)
                }}
                selectedToDate={selectedToDate}
                onSelectedToDateChange={setSelectedToDate}
                selectedWindow={selectedAvailabilityWindow}
                onSelectedWindowChange={(window) => {
                  if (!window) {
                    setSelectedSlotId(null)
                    setSelectedPlayWindow(null)
                    return
                  }
                  const matchedSlot = findSchedulingSlotContainingWindow(
                    slots,
                    service.id,
                    window,
                  )
                  setSelectedPlayWindow(window)
                  setSelectedSlotId(matchedSlot?.id ?? null)
                }}
              />
            </>
          ) : (
            <>
              <Separator />

              <section>
                <h2 className="text-xl font-bold mb-5">Schedule</h2>
                {service.schedule?.length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {service.schedule.map((s, idx) => (
                      <div
                        key={`${s.dayOfWeek}-${idx}`}
                        className="flex items-center gap-3 p-4 rounded-xl bg-secondary border border-border"
                      >
                        <Calendar className="w-5 h-5 text-accent shrink-0" />
                        <div>
                          <p className="font-bold text-sm">{s.dayOfWeek}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.startTime} – {s.endTime}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">See available sessions to book.</p>
                )}
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-accent" /> {service.durationMinutes} min
                  </span>
                  {service.facilityName ? (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-accent" /> {service.facilityName}
                    </span>
                  ) : null}
                </div>
              </section>
            </>
          )}

          {!showEventBookingSchedule && upcomingSlots.length > 0 ? (
            <>
              <Separator />
              <section>
                <h2 className="text-xl font-bold mb-3">Book a session</h2>
                <ul className="space-y-2">
                  {upcomingSlots.slice(0, 8).map((slot) => {
                    const full =
                      slot.status === 'FULL' ||
                      slot.bookedCount >= slot.effectiveCapacity
                    const active = slot.id === selectedSlotId
                    return (
                      <li key={slot.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${
                            active
                              ? 'border-accent bg-accent/10'
                              : 'border-border bg-card hover:bg-secondary'
                          }`}
                        >
                          <span className="font-semibold">
                            {formatSlotDate(slot.startAt)} ·{' '}
                            {formatSlotTimeRange(slot.startAt, slot.endAt)}
                          </span>
                          <span className="block text-xs text-muted-foreground mt-0.5">
                            {slot.staffName ?? 'Instructor TBC'} ·{' '}
                            {full ? 'Full' : `${slot.effectiveCapacity - slot.bookedCount} spots`}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            </>
          ) : null}

          {!learnCartCheckout && instructor ? (
            <>
              <Separator />
              <section>
                <h2 className="text-xl font-bold mb-5">Your Instructor</h2>
                <div className="flex items-start gap-4 p-5 rounded-xl bg-secondary border border-border">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={instructor.avatarUrl} alt={instructor.name} />
                    <AvatarFallback>
                      {instructor.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-base">{instructor.name}</p>
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                        <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />{' '}
                        {instructor.rating}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{instructor.bio}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {instructor.specializations.map((s) => (
                        <Badge key={s} variant="outline" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </>
          ) : !learnCartCheckout && service.instructorName ? (
            <>
              <Separator />
              <section>
                <h2 className="text-xl font-bold mb-5">Your Instructor</h2>
                <div className="flex items-start gap-4 p-5 rounded-xl bg-secondary border border-border">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback>
                      {service.instructorName
                        .split(' ')
                        .map((namePart) => namePart[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1.5">
                    <p className="font-bold text-base">{service.instructorName}</p>
                    {service.subjectArea ? (
                      <Badge variant="outline" className="text-xs">
                        {service.subjectArea}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </section>
            </>
          ) : null}
        </div>

        {useSplitCartCheckoutLayout ? (
          <aside className="space-y-4 lg:col-span-1 lg:row-span-2 lg:self-start lg:sticky lg:top-24">
            <BookingCartCard>
              <BookingCartCardHeader>
                <BookingCartCardTitle>Add to cart</BookingCartCardTitle>
              </BookingCartCardHeader>
              <BookingCartCardContent className="space-y-4">
                {classCartSuccessKind !== null ? (
                  <div className="text-center py-6 space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                    <p className="font-bold text-lg">
                      {getClassCartSuccessCopy(classCartSuccessKind, service.name).title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getClassCartSuccessCopy(classCartSuccessKind, service.name).description}
                    </p>
                    <Link href="/cart">
                      <Button variant="outline" className="w-full mt-2">
                        View cart
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 text-sm">
                      {learnProgramSummary ? (
                        <>
                          <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground shrink-0">Program period</span>
                            <span className="font-semibold text-right">
                              {learnProgramSummary.periodLabel}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sessions included</span>
                            <span className="font-semibold">
                              {learnProgramSummary.sessionCount}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Date</span>
                            <span className="font-semibold">
                              {formatBookingDateDisplay(selectedAvailabilityDate)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Start time</span>
                            <span className="font-semibold">
                              {formatStartTimeDisplay(
                                showEventBookingSchedule
                                  ? selectedPlayWindow?.startAt ?? null
                                  : selectedPlayWindow?.startAt ??
                                      selectedSlot?.startAt ??
                                      null,
                              )}
                            </span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {bookingForm.guestCountLabel}
                        </span>
                        <span className="font-semibold">{bookingForm.guestCount}</span>
                      </div>
                      {selectedPackage ? (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Package</span>
                          <span className="font-semibold">{selectedPackage.name}</span>
                        </div>
                      ) : null}
                    </div>

                    {showOptionalAddOnsSummary ? (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Selected options</Label>
                      {selectedAdditionalAdultLabel ||
                      selectedCategoryAddOnNames.length > 0 ? (
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {selectedAdditionalAdultLabel ? (
                            <li>• {selectedAdditionalAdultLabel}</li>
                          ) : null}
                          {selectedCategoryAddOnNames.map((name) => (
                            <li key={name}>• {name}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No optional add-ons selected.
                        </p>
                      )}
                    </div>
                    ) : null}

                    {membersOnlyBlocked ? (
                      <div className="space-y-2">
                        <Button
                          type="button"
                          className="w-full bg-amber-500 text-white hover:bg-amber-500/90 font-bold h-11"
                          disabled
                        >
                          Members Only
                        </Button>
                        <Link
                          href="/membership"
                          className="block text-center text-sm text-accent hover:underline"
                        >
                          Become a member →
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-t border-border pt-2">
                          <span className="text-sm text-muted-foreground">Total</span>
                          <span className="text-lg font-bold text-foreground">
                            {formatPrice(bookingForm.grandTotal)}
                          </span>
                        </div>
                        <Button
                          type="button"
                          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold h-11"
                          disabled={
                            !showBookingDetailsForm ||
                            selectedSlot?.status === 'FULL' ||
                            !bookingForm.canSubmitDetails ||
                            !waiversOk ||
                            enrolled ||
                            classCartSuccessKind !== null
                          }
                          onClick={handleEnrol}
                        >
                          Add to cart
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </BookingCartCardContent>
            </BookingCartCard>
          </aside>
        ) : null}

        {useSplitCartCheckoutLayout &&
        (showBookingDetailsForm || classCartSuccessKind !== null) ? (
          <aside className="lg:col-span-2">
            <BookingCartCard>
              <BookingCartCardHeader>
                <BookingCartCardTitle>
                  {learnCartCheckout
                    ? 'Enroll in this program'
                    : playMenuServiceEventSchedule
                      ? 'Enrol in this Class'
                      : 'Book this class'}
                </BookingCartCardTitle>
              </BookingCartCardHeader>
              <BookingCartCardContent className="space-y-5">
                {classCartSuccessKind !== null ? (
                  <div className="text-center py-6 space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                    <p className="font-bold text-lg">
                      {getClassCartSuccessCopy(classCartSuccessKind, service.name).title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getClassCartSuccessCopy(classCartSuccessKind, service.name).description}
                    </p>
                    <Link href="/cart">
                      <Button variant="outline" className="w-full mt-2">
                        View cart
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    {selectedSlot ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" /> {booked}/{capacity} booked
                          </span>
                          <span
                            className={spotsLeft <= 3 ? 'text-destructive font-bold' : ''}
                          >
                            {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                          </span>
                        </div>
                        <Progress value={fillPct} className="h-2" />
                      </div>
                    ) : null}

                    <div>
                      <Label className="text-sm font-semibold">
                        {bookingForm.guestCountLabel}
                      </Label>
                      <div className="flex items-center gap-3 mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            bookingForm.setGuestCount(
                              Math.max(
                                bookingForm.minGuestCount,
                                bookingForm.guestCount - 1,
                              ),
                            )
                          }
                          disabled={bookingForm.guestCount <= bookingForm.minGuestCount}
                          aria-label={`Decrease ${bookingForm.guestCountLabel.toLowerCase()}`}
                        >
                          –
                        </Button>
                        <span className="font-bold text-base w-12 text-center">
                          {bookingForm.guestCount}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => bookingForm.setGuestCount(bookingForm.guestCount + 1)}
                          disabled={
                            selectedSlot !== undefined &&
                            bookingForm.guestCount >=
                              Math.max(
                                1,
                                selectedSlot.effectiveCapacity - selectedSlot.bookedCount,
                              )
                          }
                          aria-label={`Increase ${bookingForm.guestCountLabel.toLowerCase()}`}
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    {activePackages.length > 0 ? (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Packages</Label>
                        <PackageSelector
                          packages={activePackages}
                          selectedId={selectedPackageId}
                          onSelect={(id) => setSelectedPackageId(id)}
                        />
                        {selectedPackage ? (
                          <Badge variant="secondary" className="w-fit">
                            Package selected: {selectedPackage.name}
                          </Badge>
                        ) : null}
                      </div>
                    ) : null}

                    {bookingForm.showAdditionalAdultPicker &&
                    bookingForm.additionalAdultUnitPrice != null ? (
                      <BookingAdditionalAdultField
                        count={bookingForm.additionalAdultCount}
                        unitPrice={bookingForm.additionalAdultUnitPrice}
                        freeAdultCount={bookingForm.freeAdultCount}
                        onChange={bookingForm.setAdditionalAdultCount}
                      />
                    ) : null}

                    {learnCartCheckout ? (
                      <BookingStudentFields
                        service={service}
                        contacts={contacts}
                        selectedChildIds={bookingForm.selectedChildIds}
                        onToggleChild={bookingForm.toggleSelectedChild}
                        participantContactId={bookingForm.participantContactId}
                        onParticipantContactChange={bookingForm.applyParticipantContact}
                        participantName={bookingForm.participantName}
                        onParticipantNameChange={bookingForm.setParticipantName}
                        idPrefix="learn-class"
                      />
                    ) : bookingForm.needsHouseholdChildren ? (
                      <BookingHouseholdFields
                        contacts={contacts}
                        primaryGuardianId={bookingForm.primaryGuardianContactId}
                        onPrimaryGuardianChange={bookingForm.setPrimaryGuardianContactId}
                        secondaryGuardianId={bookingForm.secondaryGuardianContactId}
                        onSecondaryGuardianChange={bookingForm.setSecondaryGuardianContactId}
                        selectedChildIds={bookingForm.selectedChildIds}
                        onToggleChild={bookingForm.toggleSelectedChild}
                        onAddContact={addContact}
                        onAddRelationship={addRelationship}
                        idPrefix="gym-class-household"
                        maxChildSelections={bookingForm.maxChildSelections}
                        passCount={bookingForm.guestCount}
                        additionalSiblingCount={bookingForm.additionalSiblingCount}
                      />
                    ) : (
                      <BookingFamilyMemberFields
                        service={service}
                        contacts={contacts}
                        selectedChildIds={bookingForm.selectedChildIds}
                        onToggleChild={bookingForm.toggleSelectedChild}
                        accompanyingAdultId={bookingForm.accompanyingAdultContactId}
                        onAccompanyingAdultChange={bookingForm.setAccompanyingAdultContactId}
                        participantContactId={bookingForm.participantContactId}
                        onParticipantContactChange={bookingForm.applyParticipantContact}
                        participantName={bookingForm.participantName}
                        onParticipantNameChange={bookingForm.setParticipantName}
                        idPrefix="gym-class"
                      />
                    )}

                    <BookingCategoryAddons
                      optional={bookingForm.categoryOptionalAddOns}
                      selectedOptionalIds={bookingForm.selectedCategoryAddOnIds}
                      onOptionalToggle={bookingForm.setCategoryAddOnSelected}
                    />

                    {service.requiresWaiver ? (
                      requiredWaiverDocs.length === 0 ? (
                        <div className="flex items-start gap-2">
                          <Checkbox
                            id="waiver-gym"
                            checked={bookingForm.waiverAccepted}
                            onCheckedChange={(v) => bookingForm.setWaiverAccepted(Boolean(v))}
                          />
                          <Label htmlFor="waiver-gym" className="text-sm leading-relaxed">
                            I confirm I have read and accept the waiver.
                          </Label>
                        </div>
                      ) : (
                        <div className="space-y-2 rounded-lg border border-border bg-card p-3">
                          <p className="text-sm font-semibold text-foreground">
                            Required waivers
                          </p>
                          <ul className="space-y-1">
                            {requiredWaiverDocs.map((doc) => {
                              const signed = primaryContact
                                ? isDocumentSignedAndValid(primaryContact.documents, doc.id)
                                : false
                              return (
                                <li
                                  key={doc.id}
                                  className="flex items-center justify-between gap-3 text-sm"
                                >
                                  <span className="text-muted-foreground">{doc.title}</span>
                                  <span
                                    className={
                                      signed
                                        ? 'text-emerald-700 font-medium'
                                        : 'text-destructive font-medium'
                                    }
                                  >
                                    {signed ? 'Signed' : 'Not signed'}
                                  </span>
                                </li>
                              )
                            })}
                          </ul>
                          {waiversOk ? null : (
                            <p className="text-xs text-muted-foreground">
                              Please sign required waivers in{' '}
                              <Link href="/account/documents" className="underline">
                                Documents & waivers
                              </Link>{' '}
                              before enrolling.
                            </p>
                          )}
                        </div>
                      )
                    ) : null}

                    <div className="space-y-2">
                      <Label htmlFor="notes-gym">Notes (optional)</Label>
                      <Textarea
                        id="notes-gym"
                        value={bookingForm.notes}
                        onChange={(e) => bookingForm.setNotes(e.target.value)}
                        placeholder="Anything we should know?"
                        rows={3}
                      />
                    </div>

                    {service.category.specialInstructionsEnabled ? (
                      <div className="space-y-2">
                        <Label htmlFor="special-gym">Special instructions (optional)</Label>
                        <Textarea
                          id="special-gym"
                          value={bookingForm.specialInstructions}
                          onChange={(e) => {
                            const next = e.target.value
                            bookingForm.setSpecialInstructions(next.slice(0, 2000))
                          }}
                          placeholder="Dietary requirements, accessibility needs, preferences..."
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                          {bookingForm.specialInstructions.length}/2000
                        </p>
                      </div>
                    ) : null}

                    <BookingFlowCouponSection
                      pricingResetKey={bookingPricingResetKey}
                      totalBeforeCoupon={bookingForm.totalBeforeCoupon}
                      grandTotal={bookingForm.grandTotal}
                      checkoutCouponDiscount={bookingForm.checkoutCouponDiscount}
                      setCoupon={bookingForm.setCoupon}
                      appliedCouponCode={bookingForm.checkoutCouponCode}
                      appliedCouponDiscount={bookingForm.checkoutCouponDiscount}
                      hasActiveSubscription={hasSubscriptionForCoupons}
                      contactId={primaryContact?.id}
                      isFreeInfant={bookingForm.isFreeInfant}
                      freeInfantMonths={bookingForm.freeInfantMonths}
                      depositPercent={bookingForm.depositPercent}
                      depositDueToday={bookingForm.depositDueToday}
                      depositDueOnArrival={bookingForm.depositDueOnArrival}
                      showPricingSummary={false}
                    />

                    {selectedSlot?.status === 'FULL' ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setWaitlistOpen(true)}
                      >
                        Join waitlist
                      </Button>
                    ) : null}

                    <p className="text-xs text-center text-muted-foreground">
                      Complete your selections, then use the Add to cart panel.
                    </p>
                  </>
                )}
              </BookingCartCardContent>
            </BookingCartCard>
          </aside>
        ) : !useSplitCartCheckoutLayout &&
          (showBookingDetailsForm || enrolled || classCartSuccessKind !== null) ? (
        <aside>
          <BookingCartCard className="sticky top-24">
            <BookingCartCardHeader>
              <BookingCartCardTitle>
                {eventClassCartCheckout || playClassCartCheckout
                  ? 'Book this class'
                  : 'Enrol in this Class'}
              </BookingCartCardTitle>
            </BookingCartCardHeader>
            <BookingCartCardContent className="space-y-5">
              {enrolled || classCartSuccessKind !== null ? (
                <div className="text-center py-6 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                  {classCartSuccessKind === 'gym' ? (
                    <>
                      <p className="font-bold text-lg">Added to cart</p>
                      <p className="text-sm text-muted-foreground">
                        {service.name} — open Gym bookings in your cart to complete checkout.
                      </p>
                      <Link href="/cart">
                        <Button variant="outline" className="w-full mt-2">
                          View cart
                        </Button>
                      </Link>
                    </>
                  ) : classCartSuccessKind === 'event' ? (
                    <>
                      <p className="font-bold text-lg">Added to cart</p>
                      <p className="text-sm text-muted-foreground">
                        {service.name} — open Event bookings in your cart to complete checkout.
                      </p>
                      <Link href="/cart">
                        <Button variant="outline" className="w-full mt-2">
                          View cart
                        </Button>
                      </Link>
                    </>
                  ) : classCartSuccessKind === 'play' ? (
                    <>
                      <p className="font-bold text-lg">Added to cart</p>
                      <p className="text-sm text-muted-foreground">
                        {service.name} — open Play bookings in your cart to complete checkout.
                      </p>
                      <Link href="/cart">
                        <Button variant="outline" className="w-full mt-2">
                          View cart
                        </Button>
                      </Link>
                    </>
                  ) : classCartSuccessKind === 'learn' ? (
                    <>
                      <p className="font-bold text-lg">Added to cart</p>
                      <p className="text-sm text-muted-foreground">
                        {service.name} — open Learn bookings in your cart to complete checkout.
                      </p>
                      <Link href="/cart">
                        <Button variant="outline" className="w-full mt-2">
                          View cart
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-lg">Enrolment Confirmed!</p>
                      <p className="text-sm text-muted-foreground">
                        You are booked for {service.name}.
                      </p>
                      <Link href="/account">
                        <Button variant="outline" className="w-full mt-2">
                          View My Bookings
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {showEventBookingSchedule && !learnCartCheckout ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date</span>
                        <span className="font-semibold">
                          {formatBookingDateDisplay(selectedAvailabilityDate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Start time</span>
                        <span className="font-semibold">
                          {formatStartTimeDisplay(selectedPlayWindow?.startAt ?? null)}
                        </span>
                      </div>
                    </div>
                  ) : learnProgramSummary ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0">Program period</span>
                        <span className="font-semibold text-right">
                          {learnProgramSummary.periodLabel}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sessions included</span>
                        <span className="font-semibold">{learnProgramSummary.sessionCount}</span>
                      </div>
                    </div>
                  ) : null}

                  {selectedSlot ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {booked}/{capacity} booked
                        </span>
                        <span
                          className={spotsLeft <= 3 ? 'text-destructive font-bold' : ''}
                        >
                          {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                        </span>
                      </div>
                      <Progress value={fillPct} className="h-2" />
                    </div>
                  ) : null}

                  <Separator />

                  <div>
                    <Label className="text-sm font-semibold">
                      {bookingForm.guestCountLabel}
                    </Label>
                    <div className="flex items-center gap-3 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          bookingForm.setGuestCount(
                            Math.max(
                              bookingForm.minGuestCount,
                              bookingForm.guestCount - 1,
                            ),
                          )
                        }
                        disabled={bookingForm.guestCount <= bookingForm.minGuestCount}
                        aria-label={`Decrease ${bookingForm.guestCountLabel.toLowerCase()}`}
                      >
                        –
                      </Button>
                      <span className="font-bold text-base w-12 text-center">
                        {bookingForm.guestCount}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => bookingForm.setGuestCount(bookingForm.guestCount + 1)}
                        disabled={
                          selectedSlot !== undefined &&
                          bookingForm.guestCount >=
                            Math.max(
                              1,
                              selectedSlot.effectiveCapacity - selectedSlot.bookedCount,
                            )
                        }
                        aria-label={`Increase ${bookingForm.guestCountLabel.toLowerCase()}`}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {activePackages.length > 0 ? (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Packages</Label>
                      <PackageSelector
                        packages={activePackages}
                        selectedId={selectedPackageId}
                        onSelect={(id) => setSelectedPackageId(id)}
                      />
                      {selectedPackage ? (
                        <Badge variant="secondary" className="w-fit">
                          Package selected: {selectedPackage.name}
                        </Badge>
                      ) : null}
                    </div>
                  ) : null}

                  {bookingForm.showAdditionalAdultPicker &&
                  bookingForm.additionalAdultUnitPrice != null ? (
                    <BookingAdditionalAdultField
                      count={bookingForm.additionalAdultCount}
                      unitPrice={bookingForm.additionalAdultUnitPrice}
                      freeAdultCount={bookingForm.freeAdultCount}
                      onChange={bookingForm.setAdditionalAdultCount}
                    />
                  ) : null}

                  <BookingCategoryAddons
                    optional={bookingForm.categoryOptionalAddOns}
                    selectedOptionalIds={bookingForm.selectedCategoryAddOnIds}
                    onOptionalToggle={bookingForm.setCategoryAddOnSelected}
                  />

                  {learnCartCheckout ? (
                    <BookingStudentFields
                      service={service}
                      contacts={contacts}
                      selectedChildIds={bookingForm.selectedChildIds}
                      onToggleChild={bookingForm.toggleSelectedChild}
                      participantContactId={bookingForm.participantContactId}
                      onParticipantContactChange={bookingForm.applyParticipantContact}
                      participantName={bookingForm.participantName}
                      onParticipantNameChange={bookingForm.setParticipantName}
                      idPrefix="learn-class-alt"
                    />
                  ) : bookingForm.needsHouseholdChildren ? (
                    <BookingHouseholdFields
                      contacts={contacts}
                      primaryGuardianId={bookingForm.primaryGuardianContactId}
                      onPrimaryGuardianChange={bookingForm.setPrimaryGuardianContactId}
                      secondaryGuardianId={bookingForm.secondaryGuardianContactId}
                      onSecondaryGuardianChange={bookingForm.setSecondaryGuardianContactId}
                      selectedChildIds={bookingForm.selectedChildIds}
                      onToggleChild={bookingForm.toggleSelectedChild}
                      onAddContact={addContact}
                      onAddRelationship={addRelationship}
                      idPrefix="class-household"
                      maxChildSelections={bookingForm.maxChildSelections}
                      passCount={bookingForm.guestCount}
                      additionalSiblingCount={bookingForm.additionalSiblingCount}
                    />
                  ) : (
                    <BookingFamilyMemberFields
                      service={service}
                      contacts={contacts}
                      selectedChildIds={bookingForm.selectedChildIds}
                      onToggleChild={bookingForm.toggleSelectedChild}
                      accompanyingAdultId={bookingForm.accompanyingAdultContactId}
                      onAccompanyingAdultChange={bookingForm.setAccompanyingAdultContactId}
                      participantContactId={bookingForm.participantContactId}
                      onParticipantContactChange={bookingForm.applyParticipantContact}
                      participantName={bookingForm.participantName}
                      onParticipantNameChange={bookingForm.setParticipantName}
                      idPrefix="class"
                    />
                  )}

                  {service.requiresWaiver ? (
                    requiredWaiverDocs.length === 0 ? (
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="waiver-c"
                          checked={bookingForm.waiverAccepted}
                          onCheckedChange={(v) => bookingForm.setWaiverAccepted(Boolean(v))}
                        />
                        <Label htmlFor="waiver-c" className="text-sm leading-relaxed">
                          I confirm I have read and accept the waiver.
                        </Label>
                      </div>
                    ) : (
                      <div className="space-y-2 rounded-lg border border-border bg-card p-3">
                        <p className="text-sm font-semibold text-foreground">
                          Required waivers
                        </p>
                        <ul className="space-y-1">
                          {requiredWaiverDocs.map((doc) => {
                            const signed = primaryContact
                              ? isDocumentSignedAndValid(primaryContact.documents, doc.id)
                              : false
                            return (
                              <li
                                key={doc.id}
                                className="flex items-center justify-between gap-3 text-sm"
                              >
                                <span className="text-muted-foreground">{doc.title}</span>
                                <span
                                  className={
                                    signed
                                      ? 'text-emerald-700 font-medium'
                                      : 'text-destructive font-medium'
                                  }
                                >
                                  {signed ? 'Signed' : 'Not signed'}
                                </span>
                              </li>
                            )
                          })}
                        </ul>
                        {waiversOk ? null : (
                          <p className="text-xs text-muted-foreground">
                            Please sign required waivers in{' '}
                            <Link href="/account/documents" className="underline">
                              Documents & waivers
                            </Link>{' '}
                            before enrolling.
                          </p>
                        )}
                      </div>
                    )
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="notes-c">Notes (optional)</Label>
                    <Textarea
                      id="notes-c"
                      value={bookingForm.notes}
                      onChange={(e) => bookingForm.setNotes(e.target.value)}
                      placeholder="Anything we should know?"
                      rows={3}
                    />
                  </div>

                  {service.category.specialInstructionsEnabled ? (
                    <div className="space-y-2">
                      <Label htmlFor="special-c">Special instructions (optional)</Label>
                      <Textarea
                        id="special-c"
                        value={bookingForm.specialInstructions}
                        onChange={(e) => {
                          const next = e.target.value
                          bookingForm.setSpecialInstructions(next.slice(0, 2000))
                        }}
                        placeholder="Dietary requirements, accessibility needs, preferences..."
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {bookingForm.specialInstructions.length}/2000
                      </p>
                    </div>
                  ) : null}

                  <BookingFlowCouponSection
                    pricingResetKey={bookingPricingResetKey}
                    totalBeforeCoupon={bookingForm.totalBeforeCoupon}
                    grandTotal={bookingForm.grandTotal}
                    checkoutCouponDiscount={bookingForm.checkoutCouponDiscount}
                    setCoupon={bookingForm.setCoupon}
                    appliedCouponCode={bookingForm.checkoutCouponCode}
                    appliedCouponDiscount={bookingForm.checkoutCouponDiscount}
                    hasActiveSubscription={hasSubscriptionForCoupons}
                    contactId={primaryContact?.id}
                    isFreeInfant={bookingForm.isFreeInfant}
                    freeInfantMonths={bookingForm.freeInfantMonths}
                    depositPercent={bookingForm.depositPercent}
                    depositDueToday={bookingForm.depositDueToday}
                    depositDueOnArrival={bookingForm.depositDueOnArrival}
                  />

                  {membersOnlyBlocked ? (
                    <div className="space-y-2">
                      <Button
                        className="w-full bg-amber-500 text-white hover:bg-amber-500/90 font-bold h-11"
                        disabled
                      >
                        Members Only
                      </Button>
                      <Link href="/membership" className="block text-center text-sm text-accent hover:underline">
                        Become a member →
                      </Link>
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold h-11"
                      disabled={
                        !showBookingDetailsForm ||
                        selectedSlot?.status === 'FULL' ||
                        !bookingForm.canSubmitDetails ||
                        !waiversOk ||
                        enrolled ||
                        classCartSuccessKind !== null
                      }
                      onClick={handleEnrol}
                    >
                      {getClassEnrolButtonLabel(
                        selectedSlot,
                        gymClassCartCheckout,
                        learnCartCheckout,
                        eventClassCartCheckout,
                        playClassCartCheckout,
                        showBookingDetailsForm,
                        showEventBookingSchedule,
                        requiresTimeSelection,
                      )}
                    </Button>
                  )}

                  {selectedSlot?.status === 'FULL' ? (
                    <Button variant="outline" className="w-full" onClick={() => setWaitlistOpen(true)}>
                      Join waitlist
                    </Button>
                  ) : null}

                  <p className="text-xs text-center text-muted-foreground">
                    Cancel anytime with 48h notice
                  </p>
                </>
              )}
            </BookingCartCardContent>
          </BookingCartCard>
        </aside>
        ) : null}
      </div>

      <Dialog open={waitlistOpen} onOpenChange={setWaitlistOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join waitlist</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            We will notify you if a space opens for this session.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setWaitlistOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-accent text-accent-foreground"
              onClick={() => {
                bookingForm.submitWaitlist()
                setWaitlistOpen(false)
              }}
            >
              Join
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function ClassDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { services, categories } = useScheduling()

  const categoryById = useMemo(() => buildSchedulingCategoryById(categories), [categories])

  const service = useMemo(() => {
    const found = services.find((s) => s.id === id)
    if (!found) {
      return undefined
    }
    return isConsumerVisibleSchedulingService(found, categoryById) ? found : undefined
  }, [categoryById, id, services])
  const redirectsToPassDetail = service?.bookingOfferingKind === 'PASS'

  useEffect(() => {
    if (!redirectsToPassDetail || !service) {
      return
    }
    const query = searchParams.toString()
    const suffix = query.length > 0 ? `?${query}` : ''
    router.replace(`/facilities/${service.id}${suffix}`)
  }, [redirectsToPassDetail, router, searchParams, service])

  if (!service) {
    return (
      <>
        <CustomerNavbar />
        <main className="py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">Class not found</p>
            <Link href="/gym" className="text-accent font-semibold">
              Back to Gym
            </Link>
          </div>
        </main>
        <CustomerFooter />
      </>
    )
  }

  if (redirectsToPassDetail) {
    return (
      <>
        <CustomerNavbar />
        <main className="py-16">
          <div className="max-w-3xl mx-auto px-4 text-center text-muted-foreground">
            Redirecting…
          </div>
        </main>
        <CustomerFooter />
      </>
    )
  }

  return (
    <>
      <CustomerNavbar />
      <main>
        <ClassDetailContent service={service} />
      </main>
      <CustomerFooter />
    </>
  )
}
