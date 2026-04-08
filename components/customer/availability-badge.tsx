/** Availability badge — shows remaining capacity or open booking action. */

import { Badge } from '@/components/ui/badge'
import { cn, getAvailabilityLabel } from '@/lib/utils'
import type { SchedulingSlot } from '@/lib/types'

const colorClasses: Record<
  ReturnType<typeof getAvailabilityLabel>['color'],
  string
> = {
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
}

export function AvailabilityBadge({
  slot,
  mode,
  className,
}: Readonly<{
  slot?: SchedulingSlot
  mode?: 'open'
  className?: string
}>) {
  if (mode === 'open') {
    return (
      <Badge className={cn('bg-green-100 text-green-700', className)}>
        Book Now
      </Badge>
    )
  }

  if (!slot) return null

  const { label, color } = getAvailabilityLabel(slot)

  return <Badge className={cn(colorClasses[color], className)}>{label}</Badge>
}

