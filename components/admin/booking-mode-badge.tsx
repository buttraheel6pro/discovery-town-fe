/** Booking mode badge — indicates scheduled vs open services in admin UI. */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SchedulingBookingMode } from '@/lib/types'

const modeStyles: Record<SchedulingBookingMode, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  OPEN: 'bg-green-100 text-green-700',
}

export function BookingModeBadge({
  mode,
  className,
}: Readonly<{ mode: SchedulingBookingMode; className?: string }>) {
  return (
    <Badge className={cn('text-xs font-semibold', modeStyles[mode], className)}>
      {mode}
    </Badge>
  )
}

