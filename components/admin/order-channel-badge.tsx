/** Order channel badge — indicates where an order originated. */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Order } from '@/lib/types'

type OrderChannel = Order['channel']

const channelStyles: Record<OrderChannel, string> = {
  ONLINE: 'bg-blue-100 text-blue-700',
  POS: 'bg-green-100 text-green-700',
}

const channelLabels: Record<OrderChannel, string> = {
  ONLINE: 'Online',
  POS: 'POS',
}

export function OrderChannelBadge({
  channel,
  className,
}: Readonly<{ channel: OrderChannel; className?: string }>) {
  return (
    <Badge className={cn('text-xs font-semibold', channelStyles[channel], className)}>
      {channelLabels[channel]}
    </Badge>
  )
}

