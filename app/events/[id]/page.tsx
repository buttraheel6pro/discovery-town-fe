'use client'

import { useMemo, useState, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
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
import { CustomerNavbar } from '@/components/customer/navbar'
import { CustomerFooter } from '@/components/customer/footer'
import { PackageSelector } from '@/components/customer/package-selector'
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
import { useScheduling } from '@/lib/scheduling-store'
import { formatPrice, isDocumentSignedAndValid } from '@/lib/utils'
import type { SchedulingService, SchedulingSlot } from '@/lib/types'

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

function EventDetailContent({
  service,
  eventSlotBase,
}: Readonly<{ service: SchedulingService; eventSlotBase: SchedulingSlot | undefined }>) {
  const { slots, packages } = useScheduling()
  const { contacts, subscriptions, documents } = useClients()

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

  const eventSlot = useMemo(() => {
    const found = slots.find((s) => s.serviceId === service.id && s.id === eventSlotBase?.id)
    return found ?? eventSlotBase
  }, [slots, service.id, eventSlotBase])

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

  const slotForBooking = useMemo<SchedulingSlot | undefined>(() => {
    if (!eventSlot) return undefined
    if (!selectedPackage) return eventSlot
    return { ...eventSlot, effectivePrice: selectedPackage.basePrice }
  }, [eventSlot, selectedPackage])

  const [registered, setRegistered] = useState(false)
  const [waitlistOpen, setWaitlistOpen] = useState(false)

  const bookingForm = useBookingForm({
    service: serviceForBooking,
    slot: slotForBooking,
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

  const max = eventSlot?.effectiveCapacity ?? service.maxAttendees ?? service.capacity
  const regCount = eventSlot?.bookedCount ?? service.registeredCount ?? 0
  const spotsLeft = Math.max(0, max - regCount)
  const fillPct = max > 0 ? Math.round((regCount / max) * 100) : 0
  const status = service.eventStatus ?? 'DRAFT'
  const published = status === 'PUBLISHED'
  const agendaItems = service.agenda ?? []
  const tags = service.tags ?? []

  function handleRegister() {
    if (!eventSlot) return
    if (spotsLeft === 0) return
    if (!published) return
    if (!bookingForm.canSubmitDetails) return
    bookingForm.submitBooking()
    setRegistered(true)
  }

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
        <div className="absolute inset-0 bg-primary/65" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
          <Link
            href="/events"
            className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-4 w-fit"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Events
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
                {service.name}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: Calendar,
                label: 'Date',
                value:
                  formatLongDate(service.startDate) +
                  (service.endDate && service.endDate !== service.startDate
                    ? ` – ${formatLongDate(service.endDate)}`
                    : ''),
      },
              {
                icon: Clock,
                label: 'Time',
                value:
                  service.startTime && service.endTime
                    ? `${service.startTime} – ${service.endTime}`
                    : '—',
              },
              {
                icon: MapPin,
                label: 'Location',
                value: service.location ?? '—',
              },
              {
                icon: Users,
                label: 'Organiser',
                value: service.organizer ?? '—',
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

          <section>
            <h2 className="text-xl font-bold mb-3">About this Event</h2>
            <p className="text-muted-foreground leading-relaxed">
              {service.description ?? '—'}
            </p>
          </section>

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

        <aside>
          <Card className="sticky top-24 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold">Register for this Event</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {registered ? (
                <div className="text-center py-6 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
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

                  {service.addOns?.length ? (
                    <div className="space-y-2">
                      <span className="text-sm font-semibold">Add-ons</span>
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
                      <Label>Lead participant</Label>
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
                          id="waiver-e"
                          checked={bookingForm.waiverAccepted}
                          onCheckedChange={(v) => bookingForm.setWaiverAccepted(Boolean(v))}
                        />
                        <Label htmlFor="waiver-e" className="text-sm leading-relaxed">
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
                      <span className="flex items-center gap-1">
                        <Ticket className="w-3.5 h-3.5" />
                        Total
                      </span>
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
                      disabled={
                        spotsLeft === 0 || !published || !bookingForm.canSubmitDetails || !waiversOk
                      }
                      type="button"
                      onClick={handleRegister}
                    >
                      {spotsLeft === 0
                        ? 'Sold Out'
                        : !published
                          ? 'Coming Soon'
                          : 'Register Now'}
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
  const { services, slots } = useScheduling()

  const service = useMemo(() => services.find((s) => s.id === id), [services, id])

  const eventSlot = useMemo(() => {
    if (!service) return undefined
    return slots.find((s) => s.serviceId === service.id)
  }, [slots, service])

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

  return (
    <>
      <CustomerNavbar />
      <main>
        <EventDetailContent service={service} eventSlotBase={eventSlot} />
      </main>
      <CustomerFooter />
    </>
  )
}
