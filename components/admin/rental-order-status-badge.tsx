/** Rental lifecycle status badge for admin orders. */
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { RentalOrderStatus } from '@/lib/types'

interface RentalOrderStatusBadgeProps {
  readonly status: RentalOrderStatus | undefined
}

const STATUS_META: Record<RentalOrderStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
  CONFIRMED: { label: 'Confirmed', className: 'bg-blue-100 text-blue-700' },
  OUT: { label: 'Out', className: 'bg-purple-100 text-purple-700' },
  RETURNED: { label: 'Returned', className: 'bg-green-100 text-green-700' },
  COMPLETED: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' },
}

export function RentalOrderStatusBadge({ status }: Readonly<RentalOrderStatusBadgeProps>) {
  if (!status) {
    return <Badge variant="outline">—</Badge>
  }

  const meta = STATUS_META[status]
  return <Badge className={cn('border-transparent', meta.className)}>{meta.label}</Badge>
}
