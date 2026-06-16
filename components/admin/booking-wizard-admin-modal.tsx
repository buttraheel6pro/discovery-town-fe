/** Admin booking modal for creating bookings on behalf of contacts. */
'use client'

import { useMemo, useState } from 'react'

import { CouponPanel } from '@/components/customer/coupon-panel'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useBookingForm } from '@/hooks/use-booking-form'
import { useScheduling } from '@/lib/scheduling-store'
import type { CmContact, Coupon } from '@/lib/types'

interface BookingWizardAdminModalProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly contact: CmContact
}

type AdminBookingPayment = 'CARD' | 'CASH' | 'INVOICE' | 'COMPLIMENTARY'

const MOCK_STAFF_ID = 'staff-1'

export function BookingWizardAdminModal({
  open,
  onOpenChange,
  contact,
}: BookingWizardAdminModalProps) {
  const { services } = useScheduling()
  const { toast } = useToast()

  const selectableServices = useMemo(
    () => services.filter((service) => service.isActive),
    [services],
  )
  const [serviceId, setServiceId] = useState<string>(selectableServices[0]?.id ?? '')
  const [paymentMethod, setPaymentMethod] = useState<AdminBookingPayment>('CARD')
  const [complimentaryReason, setComplimentaryReason] = useState('')

  const selectedService =
    selectableServices.find((service) => service.id === serviceId) ??
    selectableServices[0] ??
    null

  const bookingForm = useBookingForm({
    service: selectedService ?? services[0],
    contactId: contact.id,
    contactName: `${contact.firstName} ${contact.lastName}`.trim(),
    actedByStaffId: MOCK_STAFF_ID,
    source: 'ADMIN',
  })

  function resetState() {
    setPaymentMethod('CARD')
    setComplimentaryReason('')
  }

  function submitBooking() {
    if (!selectedService) return
    if (paymentMethod === 'COMPLIMENTARY' && complimentaryReason.trim().length === 0) {
      toast({
        title: 'Complimentary reason required',
        description: 'Enter a note when marking a booking as complimentary.',
        variant: 'destructive',
      })
      return
    }
    const booking = bookingForm.submitBooking()
    toast({
      title: 'Booking created',
      description: `${booking.service.name} was booked for ${contact.firstName} ${contact.lastName}.`,
    })
    resetState()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetState()
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create booking</DialogTitle>
          <DialogDescription>
            Booking on behalf of {contact.firstName} {contact.lastName}.
          </DialogDescription>
        </DialogHeader>

        {!selectedService ? (
          <p className="text-sm text-muted-foreground">
            No active services available for admin booking.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Contact</Label>
              <Input
                value={`${contact.firstName} ${contact.lastName}`.trim()}
                readOnly
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label>Service</Label>
              <Select value={selectedService.id} onValueChange={setServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {selectableServices.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin-booking-guests">Guests</Label>
                <Input
                  id="admin-booking-guests"
                  type="number"
                  min={0}
                  value={bookingForm.guestCount}
                  onChange={(event) =>
                    bookingForm.setGuestCount(
                      Math.max(0, Number.parseInt(event.target.value || '0', 10) || 0),
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-booking-participant">Participant name</Label>
                <Input
                  id="admin-booking-participant"
                  value={bookingForm.participantName}
                  onChange={(event) => bookingForm.setParticipantName(event.target.value)}
                  placeholder="Optional unless required"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-booking-notes">Booking notes</Label>
              <Textarea
                id="admin-booking-notes"
                rows={3}
                value={bookingForm.notes}
                onChange={(event) => bookingForm.setNotes(event.target.value)}
              />
            </div>

            <CouponPanel
              context="BOOKING"
              subtotal={bookingForm.totalBeforeCoupon}
              onCouponApplied={(coupon: Coupon | null, discountAmount: number) =>
                bookingForm.setCoupon(coupon, discountAmount)
              }
              contactId={contact.id}
            />

            <div className="space-y-2">
              <Label>Payment method</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as AdminBookingPayment)}
              >
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="CARD" />
                  Charge card on file
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="CASH" />
                  Cash or POS payment
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="INVOICE" />
                  Record as invoice
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="COMPLIMENTARY" />
                  Complimentary
                </label>
              </RadioGroup>
            </div>

            {paymentMethod === 'COMPLIMENTARY' ? (
              <div className="space-y-2">
                <Label htmlFor="admin-booking-complimentary-reason">Complimentary reason</Label>
                <Textarea
                  id="admin-booking-complimentary-reason"
                  rows={2}
                  value={complimentaryReason}
                  onChange={(event) => setComplimentaryReason(event.target.value)}
                />
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!selectedService} onClick={submitBooking}>
            Create booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
