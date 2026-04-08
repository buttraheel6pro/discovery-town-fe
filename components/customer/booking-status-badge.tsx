/** Booking status badge — consistent label + color for scheduling bookings. */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SchedulingBookingStatus } from '@/lib/types'

const statusStyles: Record<SchedulingBookingStatus, string> = {
  CONFIRMED: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-slate-100 text-slate-700',
  NO_SHOW: 'bg-red-100 text-red-700',
  WAITLISTED: 'bg-purple-100 text-purple-700',
}

export function BookingStatusBadge({
  status,
  className,
}: Readonly<{ status: SchedulingBookingStatus; className?: string }>) {
  return (
    <Badge className={cn('text-xs font-semibold', statusStyles[status], className)}>
      {status}
    </Badge>
  )
}

