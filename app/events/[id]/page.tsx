'use client'

import { Suspense, useEffect, useMemo, useState, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Ticket,
  CheckCircle2,
  Share2,
  Tag,
} from 'lucide-react'
import { BookingAdditionalAdultField } from '@/components/customer/booking-additional-adult-field'
import { BookingAmenitiesSection } from '@/components/customer/booking-amenities-section'
import { BookingCategoryAddons } from '@/components/customer/booking-category-addons'
import { BookingFamilyMemberFields } from '@/components/customer/booking-family-member-fields'
import { BookingHouseholdFields } from '@/components/customer/booking-household-fields'
import { BookingFlowCouponSection } from '@/components/customer/booking-flow-coupon-section'
import { EventBookingWidget } from '@/components/customer/event-booking-widget'
import { EventBookingScheduleSection } from '@/components/customer/event-booking-schedule-section'
import { CustomerNavbar } from '@/components/customer/navbar'
import { CustomerFooter } from '@/components/customer/footer'
import { PackageSelector } from '@/components/customer/package-selector'
import { PrivatePlayPackageDetail } from '@/components/customer/private-play-package-detail'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
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
import {
  buildEventCartBookingDescription,
  EVENT_CART_BOOKING_META_KEY,
  getPlayBookingConfirmCartLabel,
  isEventSlotCartCheckoutService,
} from '@/lib/play-cart'
import {
  isMeetingRoomCatalogPackage,
  isEventsPagePreselectedPackage,
  isPrivateEventHubService,
  meetingRoomPackagesFromCatalog,
  partyRoomPackagesFromCatalog,
  resolvePackagesForSchedulingService,
  resolvePrivateEventHubPackages,
  wholeVenuePackagesFromCatalog,
  PRIVATE_PLAY_MEETING_ROOMS_SERVICE_ID,
} from '@/lib/event-package-catalog'
import {
  isPrivatePlayService,
  privatePlayPackageSectionTitle,
  shouldUsePrivatePlayDetailLayout,
} from '@/lib/private-play-packages'
import {
  buildSlotDrivenEventDisplayMeta,
  findUpcomingSlotForService,
  isCampPlayCatalogService,
  usesEventTicketBookingSidebar,
  usesPlayEventCheckoutLayout,
} from '@/lib/scheduling-slot-availability'
import {
  shouldShowCustomerEventBookingSchedule,
} from '@/lib/event-booking-schedule'
import {
  findSchedulingSlotContainingWindow,
} from '@/lib/open-booking-slot-windows'
import { useScheduling } from '@/lib/scheduling-store'
import {
  buildSchedulingCategoryById,
  isConsumerVisibleSchedulingService,
} from '@/lib/scheduling-visibility'
import { getSchedulingConsumerBackLink } from '@/lib/scheduling-consumer-categories'
import { formatPrice, formatSlotTime, isDocumentSignedAndValid } from '@/lib/utils'
import type { EventOccasion, SchedulingService, SchedulingSlot, AvailableWindow } from '@/lib/types'

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatLongDate(dateStr: string | undefined) {
  if (!dateStr) return '—'
  const d = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatCampDateDisplay(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function getEventRegisterButtonLabel(
  spotsLeft: number,
  published: boolean,
  eventSlotCartCheckout: boolean,
): string {
  if (spotsLeft === 0) {
    return 'Sold Out'
  }
  if (!published) {
    return 'Coming Soon'
  }
  if (eventSlotCartCheckout) {
    return getPlayBookingConfirmCartLabel()
  }
  return 'Register Now'
}

function EventDetailContent({
  service,
  eventSlotBase,
}: Readonly<{ service: SchedulingService; eventSlotBase: SchedulingSlot | undefined }>) {
  const searchParams = useSearchParams()
  const { slots, packages, categories } = useScheduling()
  const categoryById = useMemo(
    () => buildSchedulingCategoryById(categories),
    [categories],
  )
  const { contacts, subscriptions, documents, addContact, addRelationship } = useClients()
  const { addCustomCartItem } = useInventory()

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

  const eventSlot = useMemo(() => {
    const upcoming = findUpcomingSlotForService(slots, service.id)
    if (upcoming) {
      return upcoming
    }
    const found = slots.find(
      (entry) => entry.serviceId === service.id && entry.id === eventSlotBase?.id,
    )
    return found ?? eventSlotBase
  }, [eventSlotBase, service.id, slots])

  const usesTicketBookingSidebar = usesEventTicketBookingSidebar(service)
  const isCampPlayService = isCampPlayCatalogService(service)
  const usePlayEventCheckoutLayoutFlag = usesPlayEventCheckoutLayout(service)
  const showEventDetailMetaGrid = !usePlayEventCheckoutLayoutFlag

  const [scheduleDate, setScheduleDate] = useState<string>(() => toIsoDate(new Date()))
  const [scheduleToDate, setScheduleToDate] = useState<string>(() => toIsoDate(new Date()))
  const [scheduleWindow, setScheduleWindow] = useState<AvailableWindow | null>(null)
  const [scheduleSlotId, setScheduleSlotId] = useState<string | null>(null)

  const scheduleSlot = useMemo(() => {
    if (!scheduleSlotId) {
      return undefined
    }
    return slots.find((entry) => entry.id === scheduleSlotId)
  }, [scheduleSlotId, slots])

  const consumerBackLink = useMemo(
    () => getSchedulingConsumerBackLink(service.categoryId, service.category),
    [service.category, service.categoryId],
  )

  const eventDisplayMeta = useMemo(() => {
    if (eventSlot) {
      return buildSlotDrivenEventDisplayMeta(eventSlot, service.location, service)
    }
    const dateLabel = service.startDate ? formatLongDate(service.startDate) : '—'
    const endSuffix =
      service.endDate && service.endDate !== service.startDate
        ? ` – ${formatLongDate(service.endDate)}`
        : ''
    return {
      dateLabel: service.startDate ? `${dateLabel}${endSuffix}` : '—',
      timeLabel:
        service.startTime && service.endTime
          ? `${service.startTime} – ${service.endTime}`
          : '—',
      locationLabel: service.location ?? '—',
      organiserLabel: service.organizer ?? '—',
    }
  }, [eventSlot, service.endDate, service.location, service.organizer, service.startDate, service.startTime, service.endTime])

  const isPartyPackageFlow = service.serviceType === 'PARTY_PACKAGE'
  const isPrivateEventJourney =
    isPartyPackageFlow && searchParams.get('privateEvent') === '1'
  const showCustomerEventSchedule =
    shouldShowCustomerEventBookingSchedule(service) && !isPrivateEventJourney
  const packageFromUrl =
    searchParams.get('package') ?? searchParams.get('packageId')
  const [privateSelectedPackageId, setPrivateSelectedPackageId] = useState<string | null>(
    () => packageFromUrl,
  )

  const activePackages = useMemo(() => {
    if (isPrivateEventJourney && isPrivateEventHubService(service)) {
      return resolvePrivateEventHubPackages(packages)
    }
    return resolvePackagesForSchedulingService(service, packages)
  }, [isPrivateEventJourney, packages, service])

  useEffect(() => {
    if (!isPrivateEventJourney || packageFromUrl == null) {
      return
    }
    const isValid = activePackages.some((entry) => entry.id === packageFromUrl)
    if (isValid) {
      setPrivateSelectedPackageId(packageFromUrl)
    }
  }, [activePackages, isPrivateEventJourney, packageFromUrl])

  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const selectedPackage = useMemo(
    () => activePackages.find((p) => p.id === selectedPackageId) ?? null,
    [activePackages, selectedPackageId],
  )

  const serviceForBooking = useMemo<SchedulingService>(() => {
    if (!selectedPackage) return service
    return { ...service, basePrice: selectedPackage.basePrice }
  }, [selectedPackage, service])

  const slotForBooking = useMemo<SchedulingSlot | undefined>(() => {
    if (showCustomerEventSchedule && scheduleSlot) {
      if (!selectedPackage) {
        return scheduleSlot
      }
      return { ...scheduleSlot, effectivePrice: selectedPackage.basePrice }
    }
    if (!eventSlot) return undefined
    if (!selectedPackage) return eventSlot
    return { ...eventSlot, effectivePrice: selectedPackage.basePrice }
  }, [eventSlot, scheduleSlot, selectedPackage, showCustomerEventSchedule])

  const [registered, setRegistered] = useState(false)
  const [addedEventToCart, setAddedEventToCart] = useState(false)
  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const [privateFlowSummary, setPrivateFlowSummary] = useState<{
    occasion: EventOccasion
    birthdayName: string
    birthdayAge: number | null
    packageName: string | null
    date: string | null
    timeRange: string | null
    children: number
    adults: number
    selectedAddOnCount: number
  } | null>(null)

  const bookingForm = useBookingForm({
    service: serviceForBooking,
    slot: slotForBooking,
    selectedWindow: showCustomerEventSchedule ? scheduleWindow : undefined,
    contacts,
    contactId: primaryContact?.id,
    contactName: primaryContact
      ? `${primaryContact.firstName} ${primaryContact.lastName}`.trim()
      : undefined,
  })

  const bookingPricingResetKey = useMemo(
    () =>
      [
        eventSlot?.id ?? '',
        selectedPackageId ?? '',
        String(bookingForm.totalBeforeCoupon),
      ].join('|'),
    [bookingForm.totalBeforeCoupon, eventSlot?.id, selectedPackageId],
  )

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

  const showGenericWaiverCheckbox =
    service.requiresWaiver &&
    requiredWaiverDocs.length === 0 &&
    !usesTicketBookingSidebar

  const waiversOk = useMemo(() => {
    if (!service.requiresWaiver) {
      return true
    }
    if (requiredWaiverDocs.length > 0) {
      return missingRequiredWaivers.length === 0
    }
    if (usesTicketBookingSidebar) {
      return true
    }
    return bookingForm.waiverAccepted
  }, [
    bookingForm.waiverAccepted,
    missingRequiredWaivers.length,
    requiredWaiverDocs.length,
    service.requiresWaiver,
    usesTicketBookingSidebar,
  ])

  const max = eventSlot?.effectiveCapacity ?? service.maxAttendees ?? service.capacity
  const regCount = eventSlot?.bookedCount ?? service.registeredCount ?? 0
  const spotsLeft = Math.max(0, max - regCount)
  const fillPct = max > 0 ? Math.round((regCount / max) * 100) : 0
  const status = service.eventStatus ?? 'DRAFT'
  const published =
    status === 'PUBLISHED' ||
    (usesTicketBookingSidebar && (eventSlot != null || service.eventStatus === 'PUBLISHED'))
  const eventSlotRegistrationCartCheckout =
    !isPrivateEventJourney &&
    (isEventSlotCartCheckoutService(service, categoryById) || usesTicketBookingSidebar)
  const privateRoomPackages = useMemo(() => {
    if (isPrivateEventJourney && isPrivateEventHubService(service)) {
      return partyRoomPackagesFromCatalog(packages)
    }
    return activePackages.filter(
      (entry) => !entry.isWholeVenue && !isMeetingRoomCatalogPackage(entry),
    )
  }, [activePackages, isPrivateEventJourney, packages, service])
  const wholeVenuePackages = useMemo(() => {
    if (isPrivateEventJourney && isPrivateEventHubService(service)) {
      return wholeVenuePackagesFromCatalog(packages)
    }
    return activePackages.filter((entry) => entry.isWholeVenue === true)
  }, [activePackages, isPrivateEventJourney, packages, service])
  const meetingRoomPackages = useMemo(() => {
    if (isPrivateEventJourney && isPrivateEventHubService(service)) {
      return meetingRoomPackagesFromCatalog(packages)
    }
    return []
  }, [isPrivateEventJourney, packages, service])
  const privateSelectedPackage =
    activePackages.find((entry) => entry.id === privateSelectedPackageId) ?? null
  const isPreselectedPackageFlow = useMemo(
    () =>
      Boolean(
        packageFromUrl &&
          privateSelectedPackage &&
          isEventsPagePreselectedPackage(privateSelectedPackage),
      ),
    [packageFromUrl, privateSelectedPackage],
  )
  const privateBookingPackages = useMemo(() => {
    if (isPreselectedPackageFlow && privateSelectedPackage) {
      return [privateSelectedPackage]
    }
    return activePackages
  }, [activePackages, isPreselectedPackageFlow, privateSelectedPackage])
  const agendaItems = service.agenda ?? []
  const tags = service.tags ?? []
  const useCampCheckoutLayout = usePlayEventCheckoutLayoutFlag && !isPrivateEventJourney
  const campCheckoutDateIso =
    scheduleDate ||
    (eventSlot?.startAt ? eventSlot.startAt.split('T')[0] : '') ||
    ''
  const campCheckoutTimeIso = scheduleWindow?.startAt ?? eventSlot?.startAt ?? null

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

  function handleRegister() {
    if (showCustomerEventSchedule && !useCampCheckoutLayout) {
      if (!scheduleWindow) {
        return
      }
    } else if (!eventSlot) {
      return
    }
    if (spotsLeft === 0) return
    if (!published) return
    if (!bookingForm.canSubmitDetails) return
    if (eventSlotRegistrationCartCheckout) {
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
      setAddedEventToCart(true)
      return
    }
    bookingForm.submitBooking()
    setRegistered(true)
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
                <Badge className="bg-accent text-accent-foreground">
                  {service.sport ?? 'EVENT'}
                </Badge>
                <Badge
                  variant={published ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {published ? 'Registration Open' : String(status)}
                </Badge>
              </div>
              <h1
                className="text-3xl sm:text-4xl font-black text-white text-balance"
                style={{ fontFamily: 'var(--font-barlow)' }}
              >
                {isPreselectedPackageFlow && privateSelectedPackage
                  ? privateSelectedPackage.name
                  : service.name}
              </h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              aria-label="Share"
              type="button"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div
        className={
          useCampCheckoutLayout
            ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 gap-8 lg:grid-cols-3'
            : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8'
        }
      >
        <div
          className={
            useCampCheckoutLayout ? 'space-y-8 lg:col-span-2' : 'lg:col-span-2 space-y-8'
          }
        >
          {showEventDetailMetaGrid ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: Calendar,
                  label: 'Date',
                  value: eventDisplayMeta.dateLabel,
                },
                {
                  icon: Clock,
                  label: 'Time',
                  value: eventDisplayMeta.timeLabel,
                },
                {
                  icon: MapPin,
                  label: 'Location',
                  value: eventDisplayMeta.locationLabel,
                },
                {
                  icon: Users,
                  label: 'Organiser',
                  value: eventDisplayMeta.organiserLabel,
                },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 p-4 rounded-xl bg-secondary border border-border"
                >
                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {label}
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!isPreselectedPackageFlow ? (
            <>
              <section>
                <h2 className="text-xl font-bold mb-3">About this Event</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {service.description ?? '—'}
                </p>
              </section>

              <Separator />
            </>
          ) : null}

          <BookingAmenitiesSection
            serviceAmenities={service.amenities}
            freeCategoryAddOns={bookingForm.categoryIncludedAddOns}
          />

          {showCustomerEventSchedule ? (
            <>
              <Separator />
              <EventBookingScheduleSection
                service={service}
                slots={slots}
                durationMinutes={service.durationMinutes}
                selectedDate={scheduleDate}
                onSelectedDateChange={(date) => {
                  setScheduleDate(date)
                  setScheduleWindow(null)
                  setScheduleSlotId(null)
                }}
                selectedToDate={scheduleToDate}
                onSelectedToDateChange={setScheduleToDate}
                selectedWindow={scheduleWindow}
                onSelectedWindowChange={(window) => {
                  if (!window) {
                    setScheduleWindow(null)
                    setScheduleSlotId(null)
                    return
                  }
                  const matchedSlot = findSchedulingSlotContainingWindow(
                    slots,
                    service.id,
                    window,
                  )
                  setScheduleWindow(window)
                  setScheduleSlotId(matchedSlot?.id ?? null)
                }}
              />
            </>
          ) : null}

          {isPrivateEventJourney ? (
            <section className="space-y-5">
              {isPreselectedPackageFlow && privateSelectedPackage ? (
                <>
                  <PrivatePlayPackageDetail
                    package={privateSelectedPackage}
                    defaultDurationMinutes={service.durationMinutes}
                  />
                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                    <p className="font-semibold text-foreground">Booking progress</p>
                    <p className="mt-1 text-muted-foreground">
                      Occasion: {privateFlowSummary?.occasion?.replace(/_/g, ' ') ?? 'Not set'}
                    </p>
                    <p className="text-muted-foreground">
                      Date & time: {privateFlowSummary?.date ?? 'Not set'}{' '}
                      {privateFlowSummary?.timeRange ? `· ${privateFlowSummary.timeRange}` : ''}
                    </p>
                    <p className="text-muted-foreground">
                      Guests: {privateFlowSummary?.children ?? 0} children ·{' '}
                      {privateFlowSummary?.adults ?? 0} adults
                    </p>
                    <p className="text-muted-foreground">
                      Add-ons: {privateFlowSummary?.selectedAddOnCount ?? 0} selected
                    </p>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
                  <h2 className="mb-3 text-xl font-bold">Choose your package</h2>
                  <div className="space-y-5">
                    {privateRoomPackages.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">
                          {isPrivatePlayService(service)
                            ? privatePlayPackageSectionTitle(service.id)
                            : 'Private room booking'}
                        </p>
                        <PackageSelector
                          packages={privateRoomPackages}
                          selectedId={privateSelectedPackageId}
                          onSelect={setPrivateSelectedPackageId}
                          variant="full"
                        />
                      </div>
                    ) : null}
                    {wholeVenuePackages.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">Whole venue</p>
                        <PackageSelector
                          packages={wholeVenuePackages}
                          selectedId={privateSelectedPackageId}
                          onSelect={setPrivateSelectedPackageId}
                          variant="full"
                        />
                      </div>
                    ) : null}
                    {meetingRoomPackages.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">
                          Meeting room packages
                        </p>
                        <PackageSelector
                          packages={meetingRoomPackages}
                          selectedId={privateSelectedPackageId}
                          onSelect={setPrivateSelectedPackageId}
                          variant="full"
                        />
                      </div>
                    ) : null}
                    <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                      <p className="font-semibold text-foreground">
                        Selected package: {privateSelectedPackage?.name ?? 'Not selected'}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        Occasion: {privateFlowSummary?.occasion?.replace(/_/g, ' ') ?? 'Not set'}
                      </p>
                      <p className="text-muted-foreground">
                        Date & time: {privateFlowSummary?.date ?? 'Not set'}{' '}
                        {privateFlowSummary?.timeRange ? `· ${privateFlowSummary.timeRange}` : ''}
                      </p>
                      <p className="text-muted-foreground">
                        Guests: {privateFlowSummary?.children ?? 0} children ·{' '}
                        {privateFlowSummary?.adults ?? 0} adults
                      </p>
                      <p className="text-muted-foreground">
                        Add-ons: {privateFlowSummary?.selectedAddOnCount ?? 0} selected
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          ) : null}

          {agendaItems.length > 0 ? (
            <>
              <Separator />
              <section>
                <h2 className="text-xl font-bold mb-5">Schedule / Agenda</h2>
                <div className="space-y-1 relative">
                  <div
                    className="absolute left-[52px] top-5 bottom-5 w-px bg-border"
                    aria-hidden
                  />
                  {agendaItems.map((item, idx) => (
                    <div key={`${item.time}-${idx}`} className="flex items-start gap-4">
                      <span className="text-xs font-bold text-accent bg-accent/10 rounded-md px-2.5 py-1.5 w-14 text-center shrink-0">
                        {item.time}
                      </span>
                      <div className="relative flex items-start gap-3 pb-4">
                        <div
                          className="w-2.5 h-2.5 rounded-full bg-accent border-2 border-background mt-1.5 shrink-0"
                          aria-hidden
                        />
                        <div>
                          <p className="font-semibold text-foreground text-sm">
                            {item.title ?? item.description}
                          </p>
                          {item.title ? (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : null}

          {tags.length > 0 ? (
            <>
              <Separator />
              <div className="flex items-center flex-wrap gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </>
          ) : null}
        </div>

        {useCampCheckoutLayout ? (
          <aside className="space-y-4 lg:col-span-1 lg:row-span-2 lg:self-start lg:sticky lg:top-24">
            <Card className="border-border shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Add to cart</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {registered || addedEventToCart ? (
                  <div className="text-center py-6 space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                    {addedEventToCart ? (
                      <>
                        <p className="font-bold text-lg">Added to cart</p>
                        <p className="text-sm text-muted-foreground">
                          {bookingForm.guestCount} ticket
                          {bookingForm.guestCount > 1 ? 's' : ''} for {service.name} — open Event
                          bookings in your cart to complete checkout.
                        </p>
                        <Link href="/cart">
                          <Button variant="outline" className="w-full mt-2">
                            View cart
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-lg">You&apos;re Registered!</p>
                        <p className="text-sm text-muted-foreground">
                          {bookingForm.guestCount} ticket
                          {bookingForm.guestCount > 1 ? 's' : ''} for {service.name}
                        </p>
                        <Link href="/account">
                          <Button variant="outline" className="w-full mt-2">
                            View My Events
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date</span>
                        <span className="font-semibold">
                          {campCheckoutDateIso
                            ? formatCampDateDisplay(campCheckoutDateIso)
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Start time</span>
                        <span className="font-semibold">
                          {campCheckoutTimeIso
                            ? formatSlotTime(campCheckoutTimeIso)
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{bookingForm.guestCountLabel}</span>
                        <span className="font-semibold">{bookingForm.guestCount}</span>
                      </div>
                      {selectedPackage ? (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Package</span>
                          <span className="font-semibold">{selectedPackage.name}</span>
                        </div>
                      ) : null}
                    </div>

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
                        <p className="text-sm text-muted-foreground">No options selected yet.</p>
                      )}
                    </div>

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
                            spotsLeft === 0 ||
                            !published ||
                            !bookingForm.canSubmitDetails ||
                            !waiversOk
                          }
                          onClick={handleRegister}
                        >
                          {getPlayBookingConfirmCartLabel()}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </aside>
        ) : null}

        {useCampCheckoutLayout && !registered && !addedEventToCart ? (
          <aside className="lg:col-span-2">
            <Card className="border-border shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Register for this Event</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {regCount}/{max} registered
                    </span>
                    <span className={spotsLeft <= 5 ? 'text-destructive font-bold' : ''}>
                      {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                    </span>
                  </div>
                  <Progress value={fillPct} className="h-2" />
                </div>

                <div>
                  <span className="text-sm font-semibold mb-2 block">Number of tickets</span>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        bookingForm.setGuestCount(Math.max(1, bookingForm.guestCount - 1))
                      }
                      disabled={bookingForm.guestCount <= 1}
                      aria-label="Decrease ticket count"
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
                      onClick={() =>
                        bookingForm.setGuestCount(
                          Math.min(Math.min(20, spotsLeft), bookingForm.guestCount + 1),
                        )
                      }
                      disabled={
                        bookingForm.guestCount >= Math.min(20, Math.max(0, spotsLeft))
                      }
                      aria-label="Increase ticket count"
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

                {bookingForm.needsHouseholdChildren ? (
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
                    idPrefix="event-household"
                    maxChildSelections={bookingForm.maxChildSelections}
                    passCount={bookingForm.guestCount}
                    additionalSiblingCount={bookingForm.additionalSiblingCount}
                  />
                ) : !usesTicketBookingSidebar ? (
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
                    idPrefix="event-camp"
                  />
                ) : null}

                {service.requiresWaiver ? (
                  showGenericWaiverCheckbox ? (
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="waiver-camp"
                        checked={bookingForm.waiverAccepted}
                        onCheckedChange={(v) => bookingForm.setWaiverAccepted(Boolean(v))}
                      />
                      <Label htmlFor="waiver-camp" className="text-sm leading-relaxed">
                        I confirm I have read and accept the waiver.
                      </Label>
                    </div>
                  ) : requiredWaiverDocs.length > 0 ? (
                    <div className="space-y-2 rounded-lg border border-border bg-card p-3">
                      <p className="text-sm font-semibold text-foreground">Required waivers</p>
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
                          before booking.
                        </p>
                      )}
                    </div>
                  ) : null
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="notes-camp">Notes (optional)</Label>
                  <Textarea
                    id="notes-camp"
                    value={bookingForm.notes}
                    onChange={(e) => bookingForm.setNotes(e.target.value)}
                    placeholder="Dietary requirements, accessibility, etc."
                    rows={3}
                  />
                </div>

                {service.category.specialInstructionsEnabled ? (
                  <div className="space-y-2">
                    <Label htmlFor="special-camp">Special instructions (optional)</Label>
                    <Textarea
                      id="special-camp"
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

                <p className="text-xs text-center text-muted-foreground">
                  Complete your selections, then use the Add to cart panel.
                </p>
              </CardContent>
            </Card>
          </aside>
        ) : null}

        {!useCampCheckoutLayout ? (
        <aside>
          <Card className="sticky top-24 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold">
                {isPrivateEventJourney ? 'Plan your private event' : 'Register for this Event'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {isPrivateEventJourney ? (
                <EventBookingWidget
                  key={privateSelectedPackageId ?? 'private-flow'}
                  serviceId={
                    privateSelectedPackageId != null &&
                    meetingRoomPackages.some((pkg) => pkg.id === privateSelectedPackageId)
                      ? PRIVATE_PLAY_MEETING_ROOMS_SERVICE_ID
                      : service.id
                  }
                  bookingPackages={privateBookingPackages}
                  embedded
                  showOccasionStep
                  showPackageStep={false}
                  externalSelectedPackageId={privateSelectedPackageId}
                  canStart={Boolean(privateSelectedPackageId)}
                  onProgressChange={setPrivateFlowSummary}
                />
              ) : registered || addedEventToCart ? (
                <div className="text-center py-6 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                  {addedEventToCart ? (
                    <>
                      <p className="font-bold text-lg">Added to cart</p>
                      <p className="text-sm text-muted-foreground">
                        {bookingForm.guestCount} ticket{bookingForm.guestCount > 1 ? 's' : ''} for{' '}
                        {service.name} — open Event bookings in your cart to complete checkout.
                      </p>
                      <Link href="/cart">
                        <Button variant="outline" className="w-full mt-2">
                          View cart
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-lg">You&apos;re Registered!</p>
                      <p className="text-sm text-muted-foreground">
                        {bookingForm.guestCount} ticket{bookingForm.guestCount > 1 ? 's' : ''} for{' '}
                        {service.name}
                      </p>
                      <Link href="/account">
                        <Button variant="outline" className="w-full mt-2">
                          View My Events
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {regCount}/{max} registered
                      </span>
                      <span className={spotsLeft <= 5 ? 'text-destructive font-bold' : ''}>
                        {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                      </span>
                    </div>
                    <Progress value={fillPct} className="h-2" />
                  </div>

                  <Separator />

                  <div>
                    <span className="text-sm font-semibold mb-2 block">Number of tickets</span>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          bookingForm.setGuestCount(Math.max(1, bookingForm.guestCount - 1))
                        }
                        disabled={bookingForm.guestCount <= 1}
                        aria-label="Decrease ticket count"
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
                        onClick={() =>
                          bookingForm.setGuestCount(
                            Math.min(Math.min(20, spotsLeft), bookingForm.guestCount + 1),
                          )
                        }
                        disabled={
                          bookingForm.guestCount >= Math.min(20, Math.max(0, spotsLeft))
                        }
                        aria-label="Increase ticket count"
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {activePackages.length > 0 ? (
                    <div className="space-y-2">
                      <span className="text-sm font-semibold">Packages</span>
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

                  {bookingForm.needsHouseholdChildren ? (
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
                      idPrefix="event-household"
                      maxChildSelections={bookingForm.maxChildSelections}
                      passCount={bookingForm.guestCount}
                      additionalSiblingCount={bookingForm.additionalSiblingCount}
                    />
                  ) : !usesTicketBookingSidebar ? (
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
                      idPrefix="event"
                    />
                  ) : null}

                  {service.requiresWaiver ? (
                    showGenericWaiverCheckbox ? (
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="waiver-e"
                          checked={bookingForm.waiverAccepted}
                          onCheckedChange={(v) => bookingForm.setWaiverAccepted(Boolean(v))}
                        />
                        <Label htmlFor="waiver-e" className="text-sm leading-relaxed">
                          I confirm I have read and accept the waiver.
                        </Label>
                      </div>
                    ) : requiredWaiverDocs.length > 0 ? (
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
                            before booking.
                          </p>
                        )}
                      </div>
                    ) : null
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="notes-e">Notes (optional)</Label>
                    <Textarea
                      id="notes-e"
                      value={bookingForm.notes}
                      onChange={(e) => bookingForm.setNotes(e.target.value)}
                      placeholder="Dietary requirements, accessibility, etc."
                      rows={3}
                    />
                  </div>

                  {service.category.specialInstructionsEnabled ? (
                    <div className="space-y-2">
                      <Label htmlFor="special-e">Special instructions (optional)</Label>
                      <Textarea
                        id="special-e"
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
                    totalLabel={
                      <span className="flex items-center gap-1">
                        <Ticket className="w-3.5 h-3.5" />
                        Total
                      </span>
                    }
                  />

                  {membersOnlyBlocked ? (
                    <div className="space-y-2">
                      <Button
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
                    <Button
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold h-11"
                      disabled={
                        (showCustomerEventSchedule && !scheduleWindow) ||
                        spotsLeft === 0 ||
                        !published ||
                        !bookingForm.canSubmitDetails ||
                        !waiversOk
                      }
                      type="button"
                      onClick={handleRegister}
                    >
                      {getEventRegisterButtonLabel(
                        spotsLeft,
                        published,
                        eventSlotRegistrationCartCheckout,
                      )}
                    </Button>
                  )}

                  {spotsLeft === 0 && eventSlot ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setWaitlistOpen(true)}
                    >
                      Join waitlist
                    </Button>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </aside>
        ) : null}
      </div>

      <Dialog open={waitlistOpen} onOpenChange={setWaitlistOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join waitlist</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            We will notify you if places become available.
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

export default function EventDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { services, slots, categories, packages } = useScheduling()

  const categoryById = useMemo(() => buildSchedulingCategoryById(categories), [categories])

  const service = useMemo(() => {
    const found = services.find((s) => s.id === id)
    if (!found) {
      return undefined
    }
    return isConsumerVisibleSchedulingService(found, categoryById) ? found : undefined
  }, [categoryById, id, services])

  const eventSlot = useMemo(() => {
    if (!service) {
      return undefined
    }
    return findUpcomingSlotForService(slots, service.id)
  }, [service, slots])
  const redirectsToPassDetail = service?.bookingOfferingKind === 'PASS'
  const redirectsToPackageDetail =
    service != null && shouldUsePrivatePlayDetailLayout(service, packages)

  useEffect(() => {
    if (!redirectsToPassDetail || !service) {
      return
    }
    const query = searchParams.toString()
    const suffix = query.length > 0 ? `?${query}` : ''
    router.replace(`/facilities/${service.id}${suffix}`)
  }, [redirectsToPassDetail, router, searchParams, service])

  useEffect(() => {
    if (!redirectsToPackageDetail || !service) {
      return
    }
    const query = searchParams.toString()
    const suffix = query.length > 0 ? `?${query}` : ''
    router.replace(`/facilities/${service.id}${suffix}`)
  }, [redirectsToPackageDetail, router, searchParams, service])

  if (!service) {
    return (
      <>
        <CustomerNavbar />
        <main className="py-16 text-center">
          <p className="text-2xl font-bold text-muted-foreground">Event not found</p>
          <Link href="/events" className="text-accent font-semibold">
            Back to Events
          </Link>
        </main>
        <CustomerFooter />
      </>
    )
  }

  if (redirectsToPassDetail || redirectsToPackageDetail) {
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
        <Suspense>
          <EventDetailContent service={service} eventSlotBase={eventSlot} />
        </Suspense>
      </main>
      <CustomerFooter />
    </>
  )
}
