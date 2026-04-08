/** Private hire inquiry status badge — matches BookingStatusBadge pattern. */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PrivateHireStatus } from '@/lib/types'

const statusStyles: Record<PrivateHireStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
}

const labels: Record<PrivateHireStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

export function PrivateHireStatusBadge({
  status,
  className,
}: Readonly<{ status: PrivateHireStatus; className?: string }>) {
  return (
    <Badge className={cn('text-xs font-semibold', statusStyles[status], className)}>
      {labels[status]}
    </Badge>
  )
}
