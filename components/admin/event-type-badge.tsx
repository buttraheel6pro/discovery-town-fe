/** Event type badge — indicates private/host-only events. */
'use client'

import { Lock, User } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { EventVisibility } from '@/lib/types'

export interface EventTypeBadgeProps {
  readonly eventType: EventVisibility | undefined
  readonly className?: string
}

export function EventTypeBadge({ eventType, className }: Readonly<EventTypeBadgeProps>) {
  if (!eventType || eventType === 'PUBLIC') return null

  if (eventType === 'PRIVATE') {
    return (
      <Badge
        className={cn('gap-1 text-xs font-semibold bg-red-100 text-red-700', className)}
      >
        <Lock className="h-3 w-3" aria-hidden />
        Private
      </Badge>
    )
  }

  return (
    <Badge
      className={cn('gap-1 text-xs font-semibold bg-purple-100 text-purple-700', className)}
    >
      <User className="h-3 w-3" aria-hidden />
      Host Only
    </Badge>
  )
}

