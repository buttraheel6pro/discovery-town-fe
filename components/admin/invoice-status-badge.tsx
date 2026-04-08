/** Invoice lifecycle status badge. */
'use client'

import { Badge } from '@/components/ui/badge'
import { cn, getInvoiceStatusColor } from '@/lib/utils'
import type { Invoice } from '@/lib/types'

export interface InvoiceStatusBadgeProps {
  readonly status: Invoice['status']
  readonly className?: string
}

const variantClass: Record<
  ReturnType<typeof getInvoiceStatusColor>,
  string
> = {
  slate: 'bg-muted text-muted-foreground border-border',
  blue: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  green: 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30',
  red: 'bg-destructive/15 text-destructive border-destructive/30',
  amber: 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30',
}

const labels: Record<Invoice['status'], string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
  VOID: 'Void',
}

export function InvoiceStatusBadge({ status, className }: Readonly<InvoiceStatusBadgeProps>) {
  const tone = getInvoiceStatusColor(status)
  return (
    <Badge variant="outline" className={cn('font-semibold', variantClass[tone], className)}>
      {labels[status]}
    </Badge>
  )
}
