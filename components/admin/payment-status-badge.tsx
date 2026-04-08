/** Payment status badge — consistent label + color for orders. */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PaymentStatus } from '@/lib/types'

const statusStyles: Record<PaymentStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PAID: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-slate-100 text-slate-700',
  PARTIAL: 'bg-amber-100 text-amber-700',
}

const statusLabels: Record<PaymentStatus, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
  PARTIAL: 'Partial',
}

export function PaymentStatusBadge({
  status,
  className,
}: Readonly<{ status: PaymentStatus; className?: string }>) {
  return (
    <Badge className={cn('text-xs font-semibold', statusStyles[status], className)}>
      {statusLabels[status]}
    </Badge>
  )
}

