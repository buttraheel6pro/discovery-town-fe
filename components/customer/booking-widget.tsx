/** Booking widget — scheduled and open scheduling checkout (uses shared booking form hook). */
'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

import { AvailabilityBadge } from '@/components/customer/availability-badge'
import { ServiceTypeBadge } from '@/components/customer/service-type-badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useBookingForm } from '@/hooks/use-booking-form'
import { useClients } from '@/lib/client-store'
import { generateOpenAvailability } from '@/lib/mock-data'
import {
  calculateOpenPrice,
  cn,
  formatDurationLabel,
  formatPrice,
  formatSlotDate,
  formatSlotTimeRange,
  generateDurationOptions,
  getAgeRangeLabel,
  isDocumentSignedAndValid,
} from '@/lib/utils'
import type {
  AvailableWindow,
  SchedulingBooking,
  SchedulingService,
  SchedulingSlot,
} from '@/lib/types'

type Step = 'details' | 'date' | 'time' | 'duration' | 'confirm' | 'success'

export interface BookingWidgetProps {
  service: SchedulingService
  slot?: SchedulingSlot
  onBooked: (booking: SchedulingBooking) => void
}

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function BookingWidget({
  service,
  slot,
  onBooked,
}: Readonly<BookingWidgetProps>) {
  const isScheduled = Boolean(slot)
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

  const [step, setStep] = useState<Step>(isScheduled ? 'details' : 'date')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedWindow, setSelectedWindow] = useState<AvailableWindow | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number>(
    service.minDurationMinutes ?? service.durationMinutes,
  )
  const [showWaitlistDialog, setShowWaitlistDialog] = useState<boolean>(false)

  const durationOptions = useMemo(() => {
    const min = service.minDurationMinutes
    const max = service.maxDurationMinutes
    const inc = service.slotIncrementMinutes
    if (!min || !max || !inc) return []
    if (max <= min) return []
    return generateDurationOptions(min, max, inc)
  }, [service.maxDurationMinutes, service.minDurationMinutes, service.slotIncrementMinutes])

  const bookingForm = useBookingForm({
    service,
    slot,
    selectedWindow,
    selectedDurationMinutes:
      durationOptions.length > 0 ? selectedDuration : undefined,
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
    if (requiredWaiverDocs.length === 0) {
      // Back-compat: if event doesn't specify explicit waivers, keep legacy checkbox.
      return bookingForm.waiverAccepted
    }
    return missingRequiredWaivers.length === 0
  }, [
    bookingForm.waiverAccepted,
    missingRequiredWaivers.length,
    requiredWaiverDocs.length,
    service.requiresWaiver,
  ])

  const openDate = selectedDate ? new Date(`${selectedDate}T00:00:00`) : null

  const availability = useMemo(() => {
    if (!selectedDate) return null
    return generateOpenAvailability(service, selectedDate)
  }, [service, selectedDate])

  const openTotalPreview = useMemo(() => {
    if (!selectedWindow) return null
    const endAt =
      service.pricingModel === 'per_hour'
        ? new Date(
            new Date(selectedWindow.startAt).getTime() + selectedDuration * 60_000,
          ).toISOString()
        : selectedWindow.endAt

    return calculateOpenPrice(
      service.basePrice,
      service.pricingModel,
      selectedWindow.startAt,
      endAt,
      bookingForm.guestCount,
    )
  }, [
    bookingForm.guestCount,
    selectedDuration,
    selectedWindow,
    service.basePrice,
    service.pricingModel,
  ])

  const maxAdvanceHours = service.maxAdvanceHours ?? 0
  const maxAdvanceDate = useMemo(() => {
    if (maxAdvanceHours <= 0) return null
    return new Date(Date.now() + maxAdvanceHours * 3_600_000)
  }, [maxAdvanceHours])

  const isPastDisabled = (date: Date): boolean => {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (startOfDay < today) return true
    if (maxAdvanceDate && startOfDay > maxAdvanceDate) return true
    return false
  }

  function addonSection() {
    if (!service.addOns?.filter((a) => a.isActive).length) return null
    return (
      <div className="space-y-2">
        <Label>Add-ons</Label>
        <ul className="space-y-2">
          {service.addOns
            .filter((a) => a.isActive)
            .map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
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
    )
  }

  function guestSection() {
    return (
      <div className="space-y-2">
        <Label>Guests</Label>
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
            aria-label="Decrease guests"
          >
            –
          </Button>
          <span className="font-bold text-base w-14 text-center">{bookingForm.guestCount}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => bookingForm.setGuestCount(bookingForm.guestCount + 1)}
            disabled={
              slot !== undefined &&
              bookingForm.guestCount >=
                Math.max(1, slot.effectiveCapacity - slot.bookedCount)
            }
            aria-label="Increase guests"
          >
            +
          </Button>
        </div>
      </div>
    )
  }

  function handleConfirm() {
    const booking = bookingForm.submitBooking()
    onBooked(booking)
    setStep('success')
  }

  return (
    <>
      <Card className="border-border shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Book</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold text-sm text-foreground truncate">{service.name}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <ServiceTypeBadge serviceType={service.serviceType} />
                {slot ? <AvailabilityBadge slot={slot} /> : <AvailabilityBadge mode="open" />}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">From</p>
              <p className="font-black text-foreground">
                {formatPrice(slot ? slot.effectivePrice : service.basePrice)}
              </p>
            </div>
          </div>

          {slot ? (
            <>
              <Separator />
              <div className="text-sm space-y-1">
                <p className="text-muted-foreground">
                  {formatSlotDate(slot.startAt)} · {formatSlotTimeRange(slot.startAt, slot.endAt)}
                </p>
                <p className="text-muted-foreground">{slot.staffName ?? 'Self-directed'}</p>
                <p className="text-muted-foreground">
                  {getAgeRangeLabel(service.ageMin, service.ageMax)}
                </p>
              </div>
            </>
          ) : null}

          {step === 'details' && (
            <>
              {guestSection()}
              {addonSection()}
              {bookingForm.needsParticipant ? (
                <div className="space-y-2">
                  <Label htmlFor="participant">Participant</Label>
                  <Input
                    id="participant"
                    value={bookingForm.participantName}
                    onChange={(e) => bookingForm.setParticipantName(e.target.value)}
                    placeholder="Full name"
                  />
                </div>
              ) : null}

              {service.requiresWaiver ? (
                requiredWaiverDocs.length === 0 ? (
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="waiver"
                      checked={bookingForm.waiverAccepted}
                      onCheckedChange={(v) => bookingForm.setWaiverAccepted(Boolean(v))}
                    />
                    <Label htmlFor="waiver" className="text-sm leading-relaxed">
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
                        before continuing.
                      </p>
                    )}
                  </div>
                )
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={bookingForm.notes}
                  onChange={(e) => bookingForm.setNotes(e.target.value)}
                  placeholder="Anything we should know?"
                />
              </div>

              {service.category.specialInstructionsEnabled ? (
                <div className="space-y-2">
                  <Label htmlFor="special">Special instructions (optional)</Label>
                  <Textarea
                    id="special"
                    value={bookingForm.specialInstructions}
                    onChange={(e) => {
                      const next = e.target.value
                      bookingForm.setSpecialInstructions(next.slice(0, 2000))
                    }}
                    placeholder="Dietary requirements, accessibility needs, preferences..."
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {bookingForm.specialInstructions.length}/2000
                  </p>
                </div>
              ) : null}

              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold h-11"
                disabled={!bookingForm.canSubmitDetails || !waiversOk}
                type="button"
                onClick={() => setStep('confirm')}
              >
                Continue
              </Button>

              {slot?.status === 'FULL' ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowWaitlistDialog(true)}
                >
                  Join Waitlist
                </Button>
              ) : null}
            </>
          )}

          {step === 'date' && (
            <>
              <div className="space-y-2">
                <Label>Select a date</Label>
                <Calendar
                  mode="single"
                  selected={openDate ?? undefined}
                  onSelect={(d) => {
                    if (!d) return
                    setSelectedDate(toDateString(d))
                    setSelectedWindow(null)
                    setStep('time')
                  }}
                  disabled={isPastDisabled}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                You can book up to {maxAdvanceHours} hours in advance.
              </p>
            </>
          )}

          {step === 'time' && availability && selectedDate && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>Choose a time</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => setStep('date')}
                  >
                    Change date
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availability.windows.map((w) => {
                    const disabled = w.spotsRemaining <= 0
                    const limited = w.spotsRemaining === 1
                    const selected =
                      selectedWindow?.startAt === w.startAt &&
                      selectedWindow?.endAt === w.endAt

                    return (
                      <button
                        key={`${w.startAt}-${w.endAt}`}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          setSelectedWindow(w)
                          if (durationOptions.length > 0) {
                            setStep('duration')
                          } else {
                            setStep('confirm')
                          }
                        }}
                        className={cn(
                          'px-3 py-2 rounded-lg border text-xs font-semibold transition-colors',
                          disabled &&
                            'bg-muted text-muted-foreground border-border opacity-50 cursor-not-allowed',
                          !disabled &&
                            !selected &&
                            'bg-card text-foreground border-border hover:bg-secondary',
                          selected && 'bg-accent text-accent-foreground border-accent',
                        )}
                        aria-pressed={selected}
                      >
                        <div>{formatSlotTimeRange(w.startAt, w.endAt)}</div>
                        <div className="mt-0.5 text-[10px] font-bold">
                          {disabled ? 'Unavailable' : limited ? 'Limited' : `${w.spotsRemaining} spots`}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {step === 'duration' && selectedWindow && (
            <>
              <div className="space-y-2">
                <Label>Duration</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {durationOptions.map((m) => {
                    const endAt = new Date(
                      new Date(selectedWindow.startAt).getTime() + m * 60_000,
                    ).toISOString()

                    const price = calculateOpenPrice(
                      service.basePrice,
                      service.pricingModel,
                      selectedWindow.startAt,
                      endAt,
                      bookingForm.guestCount,
                    )

                    const selected = selectedDuration === m
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSelectedDuration(m)}
                        className={cn(
                          'px-3 py-2 rounded-lg border text-left text-xs font-semibold transition-colors',
                          selected
                            ? 'bg-accent text-accent-foreground border-accent'
                            : 'bg-card text-foreground border-border hover:bg-secondary',
                        )}
                        aria-pressed={selected}
                      >
                        <div>{formatDurationLabel(m)}</div>
                        <div className="text-[10px] mt-0.5 font-bold">{formatPrice(price)}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {guestSection()}
              {addonSection()}

              {bookingForm.needsParticipant ? (
                <div className="space-y-2">
                  <Label htmlFor="participant-open">Participant</Label>
                  <Input
                    id="participant-open"
                    value={bookingForm.participantName}
                    onChange={(e) => bookingForm.setParticipantName(e.target.value)}
                    placeholder="Full name"
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="notes-open">Notes (optional)</Label>
                <Textarea
                  id="notes-open"
                  value={bookingForm.notes}
                  onChange={(e) => bookingForm.setNotes(e.target.value)}
                  placeholder="Anything we should know?"
                />
              </div>

              {service.category.specialInstructionsEnabled ? (
                <div className="space-y-2">
                  <Label htmlFor="special-open">Special instructions (optional)</Label>
                  <Textarea
                    id="special-open"
                    value={bookingForm.specialInstructions}
                    onChange={(e) => {
                      const next = e.target.value
                      bookingForm.setSpecialInstructions(next.slice(0, 2000))
                    }}
                    placeholder="Dietary requirements, accessibility needs, preferences..."
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {bookingForm.specialInstructions.length}/2000
                  </p>
                </div>
              ) : null}

              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold h-11"
                type="button"
                onClick={() => setStep('confirm')}
              >
                Continue
              </Button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <div className="space-y-2 text-sm">
                <p className="font-bold">Summary</p>
                <p className="text-muted-foreground">{service.name}</p>

                {slot ? (
                  <p className="text-muted-foreground">
                    {formatSlotDate(slot.startAt)} · {formatSlotTimeRange(slot.startAt, slot.endAt)}
                  </p>
                ) : selectedWindow ? (
                  <p className="text-muted-foreground">
                    {formatSlotDate(selectedWindow.startAt)} ·{' '}
                    {formatSlotTimeRange(selectedWindow.startAt, selectedWindow.endAt)}
                  </p>
                ) : null}
              </div>

              <Separator />

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Total</span>
                  <span className="font-bold text-foreground">
                    {formatPrice(
                      slot
                        ? bookingForm.grandTotal
                        : bookingForm.grandTotal ??
                            openTotalPreview ??
                            service.basePrice,
                    )}
                  </span>
                </div>
                {bookingForm.isFreeInfant && bookingForm.freeInfantMonths != null ? (
                  <p className="text-sm font-semibold text-foreground">
                    Infant (under {bookingForm.freeInfantMonths} months): FREE
                  </p>
                ) : null}

                {bookingForm.depositPercent != null &&
                bookingForm.depositDueToday != null &&
                bookingForm.depositDueOnArrival != null ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Due today (deposit)</span>
                      <span className="font-bold text-foreground">
                        {formatPrice(bookingForm.depositDueToday)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Due on arrival (balance)</span>
                      <span className="font-bold text-foreground">
                        {formatPrice(bookingForm.depositDueOnArrival)}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              {!slot && service.requiresWaiver ? (
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="waiver-open"
                    checked={bookingForm.waiverAccepted}
                    onCheckedChange={(v) => bookingForm.setWaiverAccepted(Boolean(v))}
                  />
                  <Label htmlFor="waiver-open" className="text-sm leading-relaxed">
                    I confirm I have read and accept the waiver.
                  </Label>
                </div>
              ) : null}

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
                  disabled={!waiversOk}
                  type="button"
                  onClick={handleConfirm}
                >
                  Confirm Booking
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep(isScheduled ? 'details' : 'date')}
              >
                Back
              </Button>
            </>
          )}

          {step === 'success' && (
            <div className="text-center py-6 space-y-3">
              <p className="font-bold text-lg">Booking Confirmed!</p>
              <p className="text-sm text-muted-foreground">
                Your booking has been created successfully.
              </p>
              <Link href="/account">
                <Button variant="outline" className="w-full mt-2">
                  View My Bookings
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showWaitlistDialog} onOpenChange={setShowWaitlistDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Waitlist</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This session is currently full. Join the waitlist and we&apos;ll notify you if a spot
            becomes available.
          </p>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setShowWaitlistDialog(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => {
                bookingForm.submitWaitlist()
                setShowWaitlistDialog(false)
              }}
            >
              Join Waitlist
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
