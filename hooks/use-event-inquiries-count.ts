/** Derive pending whole-venue inquiry count for admin navigation. */
'use client'

import { useMemo } from 'react'

import { useScheduling } from '@/lib/scheduling-store'

export function useEventInquiriesCount(): number {
  const { bookings, packages } = useScheduling()

  const count = useMemo(() => {
    const wholeVenuePackageIds = new Set(
      packages.filter((pkg) => pkg.isWholeVenue).map((pkg) => pkg.id),
    )
    return bookings.filter(
      (booking) =>
        booking.status === 'PENDING_APPROVAL' &&
        !!booking.eventPackageId &&
        wholeVenuePackageIds.has(booking.eventPackageId),
    ).length
  }, [bookings, packages])

  return count
}
