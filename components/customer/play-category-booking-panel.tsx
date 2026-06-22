/** Play category booking panel — service list left, cart right, booking form below list. */
'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

import { BookingAdditionalAdultField } from '@/components/customer/booking-additional-adult-field'
import { BookingAdditionalSiblingField } from '@/components/customer/booking-additional-sibling-field'
import { BookingAmenitiesSection } from '@/components/customer/booking-amenities-section'
import { BookingCategoryAddons } from '@/components/customer/booking-category-addons'
import { BookingFamilyMemberFields } from '@/components/customer/booking-family-member-fields'
import { BookingHouseholdFields } from '@/components/customer/booking-household-fields'
import { BookingPassCountField } from '@/components/customer/booking-pass-count-field'
import { OpenBookingAvailabilitySection } from '@/components/customer/open-booking-availability-section'
import { PackageSelector } from '@/components/customer/package-selector'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  getPlayFacilityConfirmButtonLabel,
  type PlayFacilityBookingState,
} from '@/hooks/use-play-facility-booking'
import { usePlayFacilityBookingContext } from '@/components/customer/play-facility-booking-provider'
import { formatPrice, formatSlotTime, isDocumentSignedAndValid } from '@/lib/utils'

function formatDateDisplay(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function PlayFacilityBookingCart({
  booking,
}: Readonly<{ booking: PlayFacilityBookingState }>) {
  const {
    service,
    membersOnlyBlocked,
    selectedDate,
    selectedWindow,
    selectedPackage,
    bookingForm,
    selectedSiblingPassLabels,
    selectedAdditionalAdultLabel,
    selectedCategoryAddOnNames,
    showBookingDetailsForm,
    waiversOk,
    buyNowListing,
    isPassOffering,
    bookedOk,
    addedToCartKind,
    handleConfirmBooking,
  } = booking
  const cartActionComplete = bookedOk || addedToCartKind !== null

  return (
    <Card className="border-border shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold">Add to cart</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <Separator />

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Selected options</Label>
          {selectedSiblingPassLabels.length > 0 ||
          selectedAdditionalAdultLabel ||
          selectedCategoryAddOnNames.length > 0 ? (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {selectedSiblingPassLabels.map((label) => (
                <li key={label}>• {label}</li>
              ))}
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
              className="h-11 w-full bg-amber-500 font-bold text-white hover:bg-amber-500/90"
              disabled
            >
              Members only
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
              className="h-11 w-full bg-accent font-bold text-accent-foreground hover:bg-accent/90"
              disabled={
                !showBookingDetailsForm ||
                !bookingForm.canSubmitDetails ||
                !waiversOk ||
                cartActionComplete
              }
              onClick={handleConfirmBooking}
            >
              {getPlayFacilityConfirmButtonLabel(
                service,
                Boolean(selectedWindow),
                buyNowListing,
                isPassOffering,
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function PlayFacilityBookingEmptyCart() {
  return (
    <Card className="border-border shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold">Add to cart</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Select a pass or service from the list to begin booking.
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span className="font-semibold">—</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Start time</span>
            <span className="font-semibold">—</span>
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Selected options</Label>
          <p className="text-sm text-muted-foreground">No options selected yet.</p>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-lg font-bold text-foreground">{formatPrice(0)}</span>
        </div>
        <Button type="button" className="h-11 w-full font-bold" disabled>
          Confirm and add to cart
        </Button>
      </CardContent>
    </Card>
  )
}

function PlayFacilityBookingContent({
  booking,
}: Readonly<{ booking: PlayFacilityBookingState }>) {
  const {
    service,
    contacts,
    addContact,
    addRelationship,
    primaryContact,
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
    requiredWaiverDocs,
    waiversOk,
    openMode,
    isPassOffering,
    showBookingDetailsForm,
    bookedOk,
    addedToCartKind,
  } = booking

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-xl font-bold">About this facility</h2>
        <p className="leading-relaxed text-muted-foreground">
          {service.description ?? '—'}
        </p>
        {childAgeRules ? (
          <p className="mt-2 text-sm font-medium text-foreground">{childAgeRules.label}</p>
        ) : null}
      </section>

      <Separator />

      <BookingAmenitiesSection
        serviceAmenities={service.amenities}
        freeCategoryAddOns={bookingForm.categoryIncludedAddOns}
      />

      {openMode && !isPassOffering ? (
        <>
          <Separator />
          <OpenBookingAvailabilitySection
            service={service}
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
      ) : null}

      {(showBookingDetailsForm || bookedOk || addedToCartKind !== null) ? (
        <Card className="border-border shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold">
              {isPassOffering ? 'Book this pass' : 'Book this facility'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {bookedOk || addedToCartKind !== null ? (
              <div className="space-y-3 py-6 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                {addedToCartKind !== null ? (
                  <>
                    <p className="text-lg font-bold">Added to cart</p>
                    <p className="text-sm text-muted-foreground">
                      {service.name} — open{' '}
                      {addedToCartKind === 'play' ? 'Play bookings' : 'Gym bookings'} in your cart
                      to complete checkout.
                    </p>
                    <Link href="/cart">
                      <Button variant="outline" className="mt-2 w-full">
                        View cart
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold">Booking confirmed!</p>
                    <p className="text-sm text-muted-foreground">
                      {service.name} — thank you for your booking.
                    </p>
                    <Link href="/account/bookings">
                      <Button variant="outline" className="mt-2 w-full">
                        View my bookings
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <>
                {!isPassOffering ? (
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
                ) : null}

                <div className="space-y-5">
                  <BookingPassCountField
                    label={bookingForm.guestCountLabel}
                    count={bookingForm.guestCount}
                    min={bookingForm.minGuestCount}
                    max={bookingForm.maxPassCount}
                    onChange={bookingForm.setGuestCount}
                    helperText={passCountHelperText}
                  />

                  {bookingForm.showAdditionalSiblingPicker &&
                  (bookingForm.additionalSiblingUnitPrice != null ||
                    bookingForm.additionalSiblingPassOptions.length > 0) ? (
                    <BookingAdditionalSiblingField
                      count={bookingForm.additionalSiblingCount}
                      unitPrice={bookingForm.additionalSiblingUnitPrice ?? 0}
                      passCount={bookingForm.guestCount}
                      onChange={bookingForm.setAdditionalSiblingCount}
                      siblingPassOptions={bookingForm.additionalSiblingPassOptions}
                      siblingPassQuantities={bookingForm.additionalSiblingPassQuantities}
                      onSiblingPassQuantityChange={
                        bookingForm.setAdditionalSiblingPassQuantity
                      }
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
                      idPrefix="play-category-household"
                      maxChildSelections={bookingForm.maxChildSelections}
                      passCount={bookingForm.guestCount}
                      additionalSiblingCount={bookingForm.additionalSiblingCount}
                      isChildAgeEligible={childAgeRules?.isEligible}
                      ageRestrictionLabel={childAgeRules?.label}
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
                      idPrefix="play-category"
                    />
                  )}

                  {service.requiresWaiver ? (
                    requiredWaiverDocs.length === 0 ? (
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="play-category-waiver"
                          checked={bookingForm.waiverAccepted}
                          onCheckedChange={(value) =>
                            bookingForm.setWaiverAccepted(Boolean(value))
                          }
                        />
                        <Label htmlFor="play-category-waiver" className="text-sm leading-relaxed">
                          I confirm I have read and accept the waiver.
                        </Label>
                      </div>
                    ) : (
                      <div className="space-y-2 rounded-lg border border-border bg-card p-3">
                        <p className="text-sm font-semibold text-foreground">Required waivers</p>
                        <ul className="space-y-1">
                          {requiredWaiverDocs.map((document) => {
                            const signed = primaryContact
                              ? isDocumentSignedAndValid(primaryContact.documents, document.id)
                              : false
                            return (
                              <li
                                key={document.id}
                                className="flex items-center justify-between gap-3 text-sm"
                              >
                                <span className="text-muted-foreground">{document.title}</span>
                                <span
                                  className={
                                    signed
                                      ? 'font-medium text-emerald-700'
                                      : 'font-medium text-destructive'
                                  }
                                >
                                  {signed ? 'Signed' : 'Not signed'}
                                </span>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )
                  ) : null}

                  {!isPassOffering ? (
                    <div className="space-y-2">
                      <Label htmlFor="play-category-notes">Notes (optional)</Label>
                      <Textarea
                        id="play-category-notes"
                        value={bookingForm.notes}
                        onChange={(event) => bookingForm.setNotes(event.target.value)}
                        placeholder="Anything we should know?"
                        rows={3}
                      />
                    </div>
                  ) : null}
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  Complete your selections, then use the Add to cart panel.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : !isPassOffering && openMode ? (
        <p className="text-sm text-muted-foreground">
          Select a time slot above to continue booking.
        </p>
      ) : null}
    </div>
  )
}

function PlayFacilityBookingContentFromContext() {
  const booking = usePlayFacilityBookingContext()
  if (!booking) {
    return null
  }
  return <PlayFacilityBookingContent booking={booking} />
}

function PlayFacilityBookingCartFromContext() {
  const booking = usePlayFacilityBookingContext()
  if (!booking) {
    return <PlayFacilityBookingEmptyCart />
  }
  return <PlayFacilityBookingCart booking={booking} />
}

export { PlayFacilityBookingContentFromContext, PlayFacilityBookingCartFromContext }
