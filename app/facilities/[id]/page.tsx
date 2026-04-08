'use client'

import { useMemo, useState, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
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
import { useBookingForm } from '@/hooks/use-booking-form'
import { OpenBookingAvailabilitySection } from '@/components/customer/open-booking-availability-section'
import { PackageSelector } from '@/components/customer/package-selector'
import { useClients } from '@/lib/client-store'
import { useScheduling } from '@/lib/scheduling-store'
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

function FacilityDetailContent({ service }: Readonly<{ service: SchedulingService }>) {
  const { contacts, subscriptions, documents } = useClients()
  const { packages } = useScheduling()
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
  const membersOnlyBlocked = service.category.membersOnly === true && !hasActiveMembership

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [selectedWindow, setSelectedWindow] = useState<AvailableWindow | null>(null)
  const [durationMinutes, setDurationMinutes] = useState<number>(
    service.minDurationMinutes ?? service.durationMinutes ?? 60,
  )
  const [bookedOk, setBookedOk] = useState(false)

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
  })

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

  const participantOptions = useMemo(
    () => contacts.filter((c) => c.contactType === 'CUSTOMER' || c.contactType === 'CHILD'),
    [contacts],
  )
  const [participantId, setParticipantId] = useState<string>('')

  const amenities = service.amenities ?? []
  const rating = service.rating ?? 0
  const reviewCount = service.reviewCount ?? 0
  const floorLabel = service.floor ?? 1
  const sportLabel = service.sport ?? service.serviceType

  function handleConfirmBooking() {
    if (!selectedWindow) return
    if (!bookingForm.canSubmitDetails) return
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
                £{service.basePrice}
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
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-bold mb-4">Amenities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {amenities.map((a) => (
                <div key={a} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                  {a}
                </div>
              ))}
            </div>
          </section>

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
              {bookedOk ? (
                <div className="text-center py-6 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                  <p className="font-bold text-lg">Booking Confirmed!</p>
                  <p className="text-sm text-muted-foreground">
                    {service.name} — thank you for your booking.
                  </p>
                  <Link href="/account/bookings">
                    <Button variant="outline" className="w-full mt-2">
                      View My Bookings
                    </Button>
                  </Link>
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

                  <div>
                    <Label className="text-sm font-semibold">Guests</Label>
                    <div className="flex items-center gap-3 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        type="button"
                        onClick={() =>
                          bookingForm.setGuestCount(Math.max(1, bookingForm.guestCount - 1))
                        }
                        disabled={bookingForm.guestCount <= 1}
                        aria-label="Decrease guests"
                      >
                        –
                      </Button>
                      <span className="font-bold text-base w-14 text-center">
                        {bookingForm.guestCount}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        type="button"
                        onClick={() => bookingForm.setGuestCount(bookingForm.guestCount + 1)}
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
                              This event requires you to select a participant.
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

                  <Separator />

                  <div className="space-y-1.5 text-sm">
                    {bookingForm.isFreeInfant && bookingForm.freeInfantMonths != null ? (
                      <p className="text-sm font-semibold text-foreground">
                        Infant (under {bookingForm.freeInfantMonths} months): FREE
                      </p>
                    ) : null}

                    {bookingForm.depositPercent != null &&
                    bookingForm.depositDueToday != null &&
                    bookingForm.depositDueOnArrival != null ? (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Due today (deposit)</span>
                          <span className="font-semibold text-foreground">
                            {formatPrice(bookingForm.depositDueToday)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Due on arrival (balance)</span>
                          <span className="font-semibold text-foreground">
                            {formatPrice(bookingForm.depositDueOnArrival)}
                          </span>
                        </div>
                      </div>
                    ) : null}
                    <div className="flex justify-between font-bold text-base">
                      <span>Total</span>
                      <span className="text-accent">{formatPrice(bookingForm.grandTotal)}</span>
                    </div>
                  </div>

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
                      {!selectedWindow ? 'Select a time slot' : 'Confirm booking'}
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
  const { services } = useScheduling()

  const service = useMemo(
    () => services.find((s) => s.id === id),
    [services, id],
  )

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

  return (
    <>
      <CustomerNavbar />
      <main>
        <FacilityDetailContent service={service} />
      </main>
      <CustomerFooter />
    </>
  )
}
