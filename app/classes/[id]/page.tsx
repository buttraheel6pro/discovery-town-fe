'use client'

import { useEffect, useMemo, useState, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  Clock,
  Users,
  Calendar,
  CheckCircle2,
  Star,
  MapPin,
} from 'lucide-react'
import { BookingFlowCouponSection } from '@/components/customer/booking-flow-coupon-section'
import { CustomerNavbar } from '@/components/customer/navbar'
import { CustomerFooter } from '@/components/customer/footer'
import { PackageSelector } from '@/components/customer/package-selector'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useToast } from '@/hooks/use-toast'
import { useClients } from '@/lib/client-store'
import { useInventory } from '@/lib/inventory-store'
import { instructors } from '@/lib/mock-data'
import {
  buildEventCartBookingDescription,
  buildGymCartBookingDescription,
  EVENT_CART_BOOKING_META_KEY,
  GYM_CART_BOOKING_META_KEY,
  isEventSlotCartCheckoutService,
  isGymClassCartCheckoutService,
} from '@/lib/play-cart'
import { useScheduling } from '@/lib/scheduling-store'
import {
  formatPrice,
  formatSlotDate,
  formatSlotTimeRange,
  isDocumentSignedAndValid,
} from '@/lib/utils'
import type { Instructors, SchedulingService, SchedulingSlot } from '@/lib/types'

const levelColors: Record<string, string> = {
  Beginner: 'bg-green-100 text-green-700',
  Intermediate: 'bg-yellow-100 text-yellow-700',
  Advanced: 'bg-red-100 text-red-700',
  'All Levels': 'bg-blue-100 text-blue-700',
}

function getClassEnrolButtonLabel(
  selectedSlot: SchedulingSlot | undefined,
  gymClassCartCheckout: boolean,
  eventClassCartCheckout: boolean,
): string {
  if (!selectedSlot) {
    return 'Select a session'
  }
  if (selectedSlot.status === 'FULL') {
    return 'Class full'
  }
  if (gymClassCartCheckout || eventClassCartCheckout) {
    return 'Confirm and add to cart'
  }
  return 'Enrol now'
}

function ClassDetailContent({ service }: Readonly<{ service: SchedulingService }>) {
  const { slots, packages } = useScheduling()
  const { contacts, subscriptions, documents } = useClients()
  const { addCustomCartItem } = useInventory()
  const { toast } = useToast()

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
  const gymClassCartCheckout = isGymClassCartCheckoutService(service)
  const eventClassCartCheckout =
    isEventSlotCartCheckoutService(service) && !gymClassCartCheckout
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
  const selectedSlot: SchedulingSlot | undefined = useMemo(
    () => upcomingSlots.find((s) => s.id === selectedSlotId),
    [upcomingSlots, selectedSlotId],
  )

  useEffect(() => {
    if (selectedSlotId === null && upcomingSlots[0]) {
      setSelectedSlotId(upcomingSlots[0].id)
    }
  }, [upcomingSlots, selectedSlotId])

  const participantOptions = useMemo(
    () => contacts.filter((c) => c.contactType === 'CUSTOMER' || c.contactType === 'CHILD'),
    [contacts],
  )
  const [participantId, setParticipantId] = useState<string>('')

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
  const [classCartSuccessKind, setClassCartSuccessKind] = useState<null | 'gym' | 'event'>(null)
  const [waitlistOpen, setWaitlistOpen] = useState(false)

  const capacity = selectedSlot?.effectiveCapacity ?? service.capacity
  const booked = selectedSlot?.bookedCount ?? 0
  const spotsLeft = Math.max(0, capacity - booked)
  const fillPct = capacity > 0 ? Math.round((booked / capacity) * 100) : 0
  const level = service.level ?? 'All Levels'
  const levelClass = levelColors[level] ?? levelColors['All Levels']

  function handleEnrol() {
    if (!selectedSlot) return
    if (selectedSlot.status === 'FULL') return
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
      toast({
        title: 'Added to cart',
        description:
          'Your class is in the cart. Open Gym bookings to review or checkout.',
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
      toast({
        title: 'Added to cart',
        description:
          'Your session is in the cart. Open Event bookings to review or checkout.',
      })
      return
    }
    bookingForm.submitBooking()
    setEnrolled(true)
  }

  return (
    <>
      <div className="relative h-72 sm:h-80">
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
            href="/classes"
            className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-4 w-fit"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Classes
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-accent text-accent-foreground">
                  {service.sport ?? 'CLASS'}
                </Badge>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${levelClass}`}>
                  {level}
                </span>
              </div>
              <h1
                className="text-3xl sm:text-4xl font-black text-white text-balance"
                style={{ fontFamily: 'var(--font-barlow)' }}
              >
                {service.name}
              </h1>
            </div>
            <p className="text-3xl font-black text-accent">
              £{service.basePrice}
              <span className="text-base font-normal text-white/80">/session</span>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-3">About this Class</h2>
            <p className="text-muted-foreground leading-relaxed">
              {service.description ?? '—'}
            </p>
          </section>

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

          {upcomingSlots.length > 0 ? (
            <>
              <Separator />
              <section>
                <h2 className="text-xl font-bold mb-3">Book a session</h2>
                <ul className="space-y-2">
                  {upcomingSlots.slice(0, 8).map((slot) => {
                    const full = slot.status === 'FULL' || slot.bookedCount >= slot.effectiveCapacity
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

          {instructor ? (
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
          ) : null}
        </div>

        <aside>
          <Card className="sticky top-24 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold">Enrol in this Class</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
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
                    <Label className="text-sm font-semibold">Guests</Label>
                    <div className="flex items-center gap-3 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          bookingForm.setGuestCount(Math.max(1, bookingForm.guestCount - 1))
                        }
                        disabled={bookingForm.guestCount <= 1}
                        aria-label="Decrease guests"
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
                        aria-label="Increase guests"
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

                  {service.addOns?.length ? (
                    <div className="space-y-2">
                      <Label>Add-ons</Label>
                      <ul className="space-y-2">
                        {service.addOns.filter((a) => a.isActive).map((a) => (
                          <li
                            key={a.id}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <span className="text-muted-foreground">
                              {a.name} ({formatPrice(a.price)})
                            </span>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() =>
                                  bookingForm.setAddOnQuantity(
                                    a.id,
                                    (bookingForm.addOnQuantities[a.id] ?? 0) - 1,
                                  )
                                }
                                aria-label={`Decrease ${a.name}`}
                              >
                                –
                              </Button>
                              <span className="w-6 text-center text-xs font-bold">
                                {bookingForm.addOnQuantities[a.id] ?? 0}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() =>
                                  bookingForm.setAddOnQuantity(
                                    a.id,
                                    (bookingForm.addOnQuantities[a.id] ?? 0) + 1,
                                  )
                                }
                                aria-label={`Increase ${a.name}`}
                              >
                                +
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {bookingForm.categoryIncludedAddOns.length > 0 ||
                  bookingForm.categoryOptionalAddOns.length > 0 ? (
                    <div className="space-y-2 rounded-lg border border-border p-3">
                      <Label>Category add-ons</Label>
                      {bookingForm.categoryIncludedAddOns.length > 0 ? (
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Included
                          </p>
                          {bookingForm.categoryIncludedAddOns.map((addOn) => (
                            <div
                              key={addOn.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <span>{addOn.name}</span>
                              <span className="font-semibold text-emerald-700">Included</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {bookingForm.categoryOptionalAddOns.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Optional
                          </p>
                          {bookingForm.categoryOptionalAddOns.map((addOn) => (
                            <label
                              key={addOn.id}
                              className="flex items-center justify-between gap-3 text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={bookingForm.selectedCategoryAddOnIds.includes(
                                    addOn.id,
                                  )}
                                  onCheckedChange={(checked) =>
                                    bookingForm.setCategoryAddOnSelected(
                                      addOn.id,
                                      Boolean(checked),
                                    )
                                  }
                                />
                                <span>{addOn.name}</span>
                              </div>
                              <span className="text-muted-foreground">
                                {formatPrice(addOn.price)}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {bookingForm.needsParticipant ? (
                    <div className="space-y-2">
                      <Label>Participant</Label>
                      {participantOptions.length > 0 ? (
                        <Select
                          value={participantId}
                          onValueChange={(v) => {
                            setParticipantId(v)
                            const p = participantOptions.find((c) => c.id === v) ?? null
                            const fullName = p ? `${p.firstName} ${p.lastName}`.trim() : ''
                            bookingForm.setParticipantName(fullName)
                            bookingForm.setParticipantDateOfBirth(p?.dateOfBirth ?? null)
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a family member" />
                          </SelectTrigger>
                          <SelectContent>
                            {participantOptions.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.firstName} {p.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <>
                          <Input
                            value={bookingForm.participantName}
                            onChange={(e) => bookingForm.setParticipantName(e.target.value)}
                            placeholder="Full name"
                          />
                          {service.category.requiresAttendee ? (
                            <p className="text-xs text-muted-foreground">
                              The booked child must attend with a responsible adult (you or another
                              adult on this booking).
                            </p>
                          ) : null}
                        </>
                      )}
                    </div>
                  ) : null}

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
                        !selectedSlot ||
                        selectedSlot.status === 'FULL' ||
                        !bookingForm.canSubmitDetails ||
                        !waiversOk
                      }
                      onClick={handleEnrol}
                    >
                      {getClassEnrolButtonLabel(
                        selectedSlot,
                        gymClassCartCheckout,
                        eventClassCartCheckout,
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
            </CardContent>
          </Card>
        </aside>
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
  const { services } = useScheduling()

  const service = useMemo(() => services.find((s) => s.id === id), [services, id])

  if (!service) {
    return (
      <>
        <CustomerNavbar />
        <main className="py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">Class not found</p>
            <Link href="/classes" className="text-accent font-semibold">
              Back to Classes
            </Link>
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
