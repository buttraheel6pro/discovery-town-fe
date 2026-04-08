/** Service type badge — consistent label + color for scheduling services. */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SchedulingServiceType } from '@/lib/types'

const serviceTypeStyles: Record<SchedulingServiceType, string> = {
  GYM_CLASS: 'bg-blue-100 text-blue-700',
  COURT_BOOKING: 'bg-green-100 text-green-700',
  SWIM_CLASS: 'bg-cyan-100 text-cyan-700',
  OPEN_PLAY: 'bg-orange-100 text-orange-700',
  COACHING_SESSION: 'bg-purple-100 text-purple-700',
  CAMP: 'bg-amber-100 text-amber-700',
  PARTY_PACKAGE: 'bg-pink-100 text-pink-700',
  PRIVATE_HIRE: 'bg-red-100 text-red-700',
  WORKSHOP: 'bg-slate-100 text-slate-700',
  FITNESS_ASSESSMENT: 'bg-indigo-100 text-indigo-700',
}

const serviceTypeLabels: Record<SchedulingServiceType, string> = {
  GYM_CLASS: 'Gym Class',
  COURT_BOOKING: 'Court Booking',
  SWIM_CLASS: 'Swim Class',
  OPEN_PLAY: 'Open Play',
  COACHING_SESSION: 'Coaching',
  CAMP: 'Camp',
  PARTY_PACKAGE: 'Party',
  PRIVATE_HIRE: 'Private Hire',
  WORKSHOP: 'Workshop',
  FITNESS_ASSESSMENT: 'Assessment',
}

export function ServiceTypeBadge({
  serviceType,
  className,
}: Readonly<{
  serviceType: SchedulingServiceType
  className?: string
}>) {
  return (
    <Badge
      className={cn(
        'text-xs font-semibold',
        serviceTypeStyles[serviceType],
        className,
      )}
    >
      {serviceTypeLabels[serviceType]}
    </Badge>
  )
}

