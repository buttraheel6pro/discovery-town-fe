/** SubscriptionStatusBadge — badge for membership subscription status. */

import { Badge } from '@/components/ui/badge'
import { cn, getSubscriptionStatusColor } from '@/lib/utils'
import type { SubscriptionStatus } from '@/lib/types'

const statusLabelMap: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Active',
  TRIALING: 'Trial',
  PAUSED: 'Paused',
  CANCELLED: 'Cancelled',
  PAST_DUE: 'Past due',
  EXPIRED: 'Expired',
}

const statusBgMap: Record<
  'green' | 'amber' | 'red' | 'slate',
  string
> = {
  green: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  slate: 'bg-slate-100 text-slate-700',
}

export function SubscriptionStatusBadge({
  status,
  className,
}: Readonly<{ status: SubscriptionStatus; className?: string }>) {
  const tone = getSubscriptionStatusColor(status)

  return (
    <Badge
      className={cn(
        'text-xs font-semibold',
        statusBgMap[tone],
        className,
      )}
    >
      {statusLabelMap[status]}
    </Badge>
  )
}

