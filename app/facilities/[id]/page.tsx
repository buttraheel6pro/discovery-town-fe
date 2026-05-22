'use client'

import { useEffect, useMemo, useState, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Star, Users, MapPin, CheckCircle2 } from 'lucide-react'
import { CustomerNavbar } from '@/components/customer/navbar'
import { CustomerFooter } from '@/components/customer/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BookingAdditionalAdultField } from '@/components/customer/booking-additional-adult-field'
import { BookingAdditionalSiblingField } from '@/components/customer/booking-additional-sibling-field'
import { BookingAmenitiesSection } from '@/components/customer/booking-amenities-section'
import { BookingCategoryAddons } from '@/components/customer/booking-category-addons'
import { BookingPassCountField } from '@/components/customer/booking-pass-count-field'
import { BookingFamilyMemberFields } from '@/components/customer/booking-family-member-fields'
import { BookingHouseholdFields } from '@/components/customer/booking-household-fields'
import { BookingFlowCouponSection } from '@/components/customer/booking-flow-coupon-section'
import { OpenPlayPassDetail } from '@/components/customer/open-play-pass-detail'
import { PrivatePlayDetail } from '@/components/customer/private-play-detail'
import { OpenBookingAvailabilitySection } from '@/components/customer/open-booking-availability-section'
import { PackageSelector } from '@/components/customer/package-selector'
import { useBookingForm } from '@/hooks/use-booking-form'
import { resolveServiceChildAgeRules } from '@/lib/booking-child-age'
import { getBookingPrimaryGuardianId } from '@/lib/booking-household'
import { useClients } from '@/lib/client-store'
import { useInventory } from '@/lib/inventory-store'
import {
  buildPassCatalogSchedulingService,
  getOpenPlayMembershipOffer,
  resolveOfferDisplayPrice,
} from '@/lib/open-play-membership-offers'
import { isOpenPlayPassCatalogService } from '@/lib/open-play-pass-catalog'
import { isPrivatePlayService } from '@/lib/private-play-packages'
import {
  buildGymCartBookingDescription,
  buildPlayCartBookingDescription,
  GYM_CART_BOOKING_META_KEY,
  isGymFacilityCartCheckoutService,
  isPlayCartCheckoutService,
  PLAY_CART_BOOKING_META_KEY,
} from '@/lib/play-cart'
import { usesBuyNowListingCta } from '@/lib/play-cart'
import { useScheduling } from '@/lib/scheduling-store'
import { usesEventTicketBookingSidebar } from '@/lib/scheduling-slot-availability'
import {
  formatPrice,
  formatSlotTime,
  generateDurationOptions,
  isDocumentSignedAndValid,
} from '@/lib/utils'
import type { AvailableWindow, SchedulingService } from '@/lib/types'

function formatDateDisplay(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function getWeekDates(baseDate: Date) {
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate)
    d.setDate(baseDate.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

function getFacilityCartCheckoutKind(
  service: SchedulingService,
): 'play' | 'gym' | null {
  if (isPlayCartCheckoutService(service)) {
    return 'play'
  }
  if (isGymFacilityCartCheckoutService(service)) {
    return 'gym'
  }
  return null
}

function getFacilityConfirmButtonLabel(
  hasSelectedWindow: boolean,
  cartCheckoutKind: 'play' | 'gym' | null,
  buyNowListing: boolean,
): string {
  if (!hasSelectedWindow) {
    return buyNowListing ? 'Buy now' : 'Select a time slot'
  }
  if (buyNowListing) {
    return 'Buy now'
  }
  if (cartCheckoutKind !== null) {
    return 'Confirm and add to cart'
  }
  return 'Confirm booking'
}

function FacilityDetailContent({ service }: Readonly<{ service: SchedulingService }>) {
  const { contacts, subscriptions, documents, addContact, addRelationship } = useClients()
  const { packages } = useScheduling()
  const { addCustomCartItem } = useInventory()
  const primaryGuardianId = useMemo(
    () => getBookingPrimaryGuardianId(contacts),
    [contacts],
  )
  const primaryContact = useMemo(
    () => contacts.find((c) => c.id === primaryGuardianId) ?? contacts[0] ?? null,
    [contacts, primaryGuardianId],
  )
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
  const facilityCartCheckoutKind = getFacilityCartCheckoutKind(service)
  const childAgeRules = useMemo(() => resolveServiceChildAgeRules(service), [service])

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const [weekOffset, setWeekOffset] = useState(0)
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
    const inc = service.slotIncrementMinutes
    if (!min || !max || !inc || max <= min) return []
    return generateDurationOptions(min, max, inc)
  }, [service])

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

  const bookingForm = useBookingForm({
    service: serviceForBooking,
    selectedWindow,
    selectedDurationMinutes:
      durationOptions.length > 0 ? durationMinutes : undefined,
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

  const bookingPricingResetKey = useMemo(
    () =>
      [
        selectedDate,
        selectedWindow?.startAt ?? '',
        String(durationMinutes),
        selectedPackageId ?? '',
        String(bookingForm.totalBeforeCoupon),
      ].join('|'),
    [
      bookingForm.totalBeforeCoupon,
      durationMinutes,
      selectedDate,
      selectedPackageId,
      selectedWindow?.startAt,
    ],
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

  const rating = service.rating ?? 0
  const reviewCount = service.reviewCount ?? 0
  const floorLabel = service.floor ?? 1
  const sportLabel = service.sport ?? service.serviceType

  function handleConfirmBooking() {
    if (!selectedWindow) return
    if (!bookingForm.canSubmitDetails) return
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
      return
    }
    bookingForm.submitBooking()
    setBookedOk(true)
  }

  const openMode = service.bookingMode === 'OPEN'

  return (
    <>
      <div className="relative h-72 sm:h-96">
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
        <div className="absolute inset-0 bg-primary/60" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
          <Link
            href="/facilities"
            className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-4 w-fit"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Facilities
          </Link>
          <div className="flex flex-wrap items-end gap-4 justify-between">
            <div>
              <Badge className="bg-accent text-accent-foreground mb-2">{sportLabel}</Badge>
              <h1
                className="text-3xl sm:text-4xl font-black text-white text-balance"
                style={{ fontFamily: 'var(--font-barlow)' }}
              >
                {service.name}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-white/80 text-sm flex-wrap">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  {rating} ({reviewCount} reviews)
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> Floor {floorLabel}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" /> Capacity: {service.capacity}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs uppercase tracking-wider">From</p>
              <p className="text-3xl font-black text-accent">
                ${service.basePrice}
                <span className="text-base font-normal text-white/80">
                  {service.pricingModel === 'per_hour'
                    ? '/hr'
                    : service.pricingModel === 'per_person'
                      ? '/person'
                      : ''}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-3">About this facility</h2>
            <p className="text-muted-foreground leading-relaxed">
              {service.description ?? '—'}
            </p>
            {childAgeRules ? (
              <p className="mt-2 text-sm font-medium text-foreground">
                {childAgeRules.label}
              </p>
            ) : null}
          </section>

          <Separator />

          <BookingAmenitiesSection
            serviceAmenities={service.amenities}
            freeCategoryAddOns={bookingForm.categoryIncludedAddOns}
          />

          {openMode ? (
            <>
              <Separator />
              <OpenBookingAvailabilitySection
                service={service}
                weekOffset={weekOffset}
                onWeekOffsetChange={setWeekOffset}
                selectedDate={selectedDate}
                onSelectedDateChange={setSelectedDate}
                selectedWindow={selectedWindow}
                onSelectedWindowChange={setSelectedWindow}
                durationMinutes={durationMinutes}
                onDurationMinutesChange={setDurationMinutes}
                durationOptions={durationOptions}
                mode="facility"
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              This listing is not open-booking on this view. Try another facility or contact
              reception.
            </p>
          )}
        </div>

        <aside>
          <Card className="sticky top-24 shadow-xl border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold">Book this facility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {bookedOk || addedToCartKind !== null ? (
                <div className="text-center py-6 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                  {addedToCartKind !== null ? (
                    <>
                      <p className="font-bold text-lg">Added to cart</p>
                      <p className="text-sm text-muted-foreground">
                        {service.name} — open{' '}
                        {addedToCartKind === 'play' ? 'Play bookings' : 'Gym bookings'} in your cart
                        to complete checkout.
                      </p>
                      <Link href="/cart">
                        <Button variant="outline" className="w-full mt-2">
                          View cart
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-lg">Booking Confirmed!</p>
                      <p className="text-sm text-muted-foreground">
                        {service.name} — thank you for your booking.
                      </p>
                      <Link href="/account/bookings">
                        <Button variant="outline" className="w-full mt-2">
                          View My Bookings
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
                      <span className="font-semibold">{formatDateDisplay(selectedDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start time</span>
                      <span className="font-semibold">
                        {selectedWindow ? formatSlotTime(selectedWindow.startAt) : '—'}
                      </span>
                    </div>
                  </div>

                  <BookingPassCountField
                    label={bookingForm.guestCountLabel}
                    count={bookingForm.guestCount}
                    min={1}
                    max={bookingForm.maxPassCount}
                    onChange={bookingForm.setGuestCount}
                    helperText={passCountHelperText}
                  />

                  {bookingForm.showAdditionalSiblingPicker &&
                  bookingForm.additionalSiblingUnitPrice != null ? (
                    <BookingAdditionalSiblingField
                      count={bookingForm.additionalSiblingCount}
                      unitPrice={bookingForm.additionalSiblingUnitPrice}
                      passCount={bookingForm.guestCount}
                      onChange={bookingForm.setAdditionalSiblingCount}
                    />
                  ) : null}

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

                  {bookingForm.usesOpenPlayHouseholdBooking ? (
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
                      idPrefix="facility-household"
                      maxChildSelections={bookingForm.maxChildSelections}
                      passCount={bookingForm.guestCount}
                      additionalSiblingCount={bookingForm.additionalSiblingCount}
                      isChildAgeEligible={childAgeRules?.isEligible}
                      ageRestrictionLabel={childAgeRules?.label}
                    />
                  ) : null}

                  <BookingCategoryAddons
                    optional={bookingForm.categoryOptionalAddOns}
                    selectedOptionalIds={bookingForm.selectedCategoryAddOnIds}
                    onOptionalToggle={bookingForm.setCategoryAddOnSelected}
                  />

                  {!bookingForm.usesOpenPlayHouseholdBooking ? (
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
                      idPrefix="facility"
                    />
                  ) : null}

                  {service.requiresWaiver ? (
                    requiredWaiverDocs.length === 0 ? (
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="waiver-f"
                          checked={bookingForm.waiverAccepted}
                          onCheckedChange={(v) => bookingForm.setWaiverAccepted(Boolean(v))}
                        />
                        <Label htmlFor="waiver-f" className="text-sm leading-relaxed">
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
                            before booking.
                          </p>
                        )}
                      </div>
                    )
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="notes-f">Notes (optional)</Label>
                    <Textarea
                      id="notes-f"
                      value={bookingForm.notes}
                      onChange={(e) => bookingForm.setNotes(e.target.value)}
                      placeholder="Anything we should know?"
                      rows={3}
                    />
                  </div>

                  {service.category.specialInstructionsEnabled ? (
                    <div className="space-y-2">
                      <Label htmlFor="special-f">Special instructions (optional)</Label>
                      <Textarea
                        id="special-f"
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
                      disabled={!selectedWindow || !bookingForm.canSubmitDetails || !waiversOk}
                      onClick={handleConfirmBooking}
                    >
                      {getFacilityConfirmButtonLabel(
                        Boolean(selectedWindow),
                        facilityCartCheckoutKind,
                        usesBuyNowListingCta(service),
                      )}
                    </Button>
                  )}
                  <p className="text-xs text-center text-muted-foreground">
                    Free cancellation up to 24 hours before your booking
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  )
}

export default function FacilityDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { services, categories } = useScheduling()
  const { membershipPlans } = useClients()

  const passOffer = getOpenPlayMembershipOffer(id)

  const service = useMemo(() => {
    const fromStore = services.find((entry) => entry.id === id)
    if (fromStore?.isActive && isOpenPlayPassCatalogService(fromStore)) {
      return fromStore
    }
    if (!passOffer) {
      return fromStore
    }
    const category = categories.find((entry) => entry.id === passOffer.categoryId)
    if (!category) {
      return fromStore
    }
    const { price } = resolveOfferDisplayPrice(membershipPlans, passOffer.kind)
    return buildPassCatalogSchedulingService(passOffer, category, price)
  }, [categories, id, membershipPlans, passOffer, services])

  const isPassCatalog =
    passOffer != null || (service != null && isOpenPlayPassCatalogService(service))
  const isPrivatePlay =
    service != null && isPrivatePlayService(service)
  const redirectsToEventDetail =
    service != null && usesEventTicketBookingSidebar(service)

  useEffect(() => {
    if (!redirectsToEventDetail || !service) {
      return
    }
    const query = searchParams.toString()
    const suffix = query.length > 0 ? `?${query}` : ''
    router.replace(`/events/${service.id}${suffix}`)
  }, [redirectsToEventDetail, router, searchParams, service])

  if (!service) {
    return (
      <>
        <CustomerNavbar />
        <main className="py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">Facility not found</p>
            <Link href="/facilities" className="text-accent font-semibold">
              Back to Facilities
            </Link>
          </div>
        </main>
        <CustomerFooter />
      </>
    )
  }

  if (redirectsToEventDetail) {
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
        {isPassCatalog ? (
          <OpenPlayPassDetail service={service} />
        ) : isPrivatePlay ? (
          <PrivatePlayDetail service={service} />
        ) : (
          <FacilityDetailContent service={service} />
        )}
      </main>
      <CustomerFooter />
    </>
  )
}
