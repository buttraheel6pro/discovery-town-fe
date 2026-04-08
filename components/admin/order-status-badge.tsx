/** Order status badge — consistent label + color for order lifecycle. */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/lib/types'

const statusStyles: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-blue-100 text-blue-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-slate-100 text-slate-700',
}

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
}

export function OrderStatusBadge({
  status,
  className,
}: Readonly<{ status: OrderStatus; className?: string }>) {
  return (
    <Badge className={cn('text-xs font-semibold', statusStyles[status], className)}>
      {statusLabels[status]}
    </Badge>
  )
}

