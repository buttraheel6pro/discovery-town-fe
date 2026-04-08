/** Slot status badge — consistent label + color for admin scheduling slots. */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SchedulingSlotStatus } from '@/lib/types'

const statusStyles: Record<SchedulingSlotStatus, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  FULL: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-slate-100 text-slate-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export function SlotStatusBadge({
  status,
  className,
}: Readonly<{ status: SchedulingSlotStatus; className?: string }>) {
  return (
    <Badge className={cn('text-xs font-semibold', statusStyles[status], className)}>
      {status}
    </Badge>
  )
}

