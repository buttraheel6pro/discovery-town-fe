/** Booking history card — consistent rendering for scheduled and open bookings. */

'use client'

import Image from 'next/image'
import Link from 'next/link'

import { BookingStatusBadge } from '@/components/customer/booking-status-badge'
import { ServiceTypeBadge } from '@/components/customer/service-type-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatSlotDate, formatSlotTimeRange, formatPrice } from '@/lib/utils'
import type { SchedulingBooking } from '@/lib/types'

export function BookingHistoryCard({
  booking,
  onCancel,
}: Readonly<{ booking: SchedulingBooking; onCancel?: () => void }>) {
  const isOpen = booking.serviceSlotId === null
  const imageUrl = booking.service.imageUrl

  let dateLine = 'Scheduled booking'
  if (isOpen) {
    dateLine = 'Open booking'
    if (booking.startAt && booking.endAt) {
      dateLine = `${formatSlotDate(booking.startAt)} · ${formatSlotTimeRange(
        booking.startAt,
        booking.endAt,
      )}`
    }
  } else if (booking.serviceSlot) {
    dateLine = `${formatSlotDate(
      booking.serviceSlot.startAt,
    )} · ${formatSlotTimeRange(
      booking.serviceSlot.startAt,
      booking.serviceSlot.endAt,
    )}`
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 flex gap-4 items-start">
        <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-secondary shrink-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={booking.service.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : null}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold text-sm text-foreground truncate">
                  {booking.service.name}
                </p>
                <ServiceTypeBadge serviceType={booking.bookingType} />
                {booking.actedByStaffId ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        Staff-assisted
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      Created by {booking.actedByStaffName ?? 'staff member'} on behalf of this
                      contact.
                    </TooltipContent>
                  </Tooltip>
                ) : null}
              </div>

              <p className="text-xs text-muted-foreground mt-1">{dateLine}</p>
              {isOpen ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Open booking
                </p>
              ) : null}
            </div>

            <div className="text-right shrink-0">
              <BookingStatusBadge status={booking.status} />
              <p className="font-bold text-sm mt-1">
                {formatPrice(booking.totalAmount)}
              </p>
            </div>
          </div>

          <div className={cn('mt-3 flex items-center gap-2', !onCancel && 'hidden')}>
            {onCancel ? (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive hover:bg-destructive/5"
                onClick={onCancel}
              >
                Cancel
              </Button>
            ) : null}
            <Link href="/account">
              <Button variant="ghost" size="sm" className="text-accent">
                View
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

