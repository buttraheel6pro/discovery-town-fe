/** Event type selector — PUBLIC / PRIVATE / HOST-ONLY visibility. */
'use client'

import { Globe, Lock, User } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { EventVisibility } from '@/lib/types'

export interface EventTypeSelectorProps {
  readonly value: EventVisibility
  readonly onChange: (value: EventVisibility) => void
  readonly className?: string
}

type Option = {
  value: EventVisibility
  label: string
  description: string
  icon: typeof Globe
  accentClass: string
}

const OPTIONS: Option[] = [
  {
    value: 'PUBLIC',
    label: 'Public Event',
    description: 'Listed on the public booking page. Anyone can book.',
    icon: Globe,
    accentClass: 'border-border',
  },
  {
    value: 'PRIVATE',
    label: 'Private Event',
    description: 'Not listed publicly. Accessible via direct link only.',
    icon: Lock,
    accentClass: 'border-red-200',
  },
  {
    value: 'SINGLE_HOST',
    label: 'Host-Only Event',
    description: 'You host it. Invite specific participants.',
    icon: User,
    accentClass: 'border-purple-200',
  },
]

export function EventTypeSelector({
  value,
  onChange,
  className,
}: Readonly<EventTypeSelectorProps>) {
  return (
    <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-3', className)}>
      {OPTIONS.map((opt) => {
        const active = value === opt.value
        const Icon = opt.icon
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-xl border bg-card p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active ? 'border-accent ring-1 ring-accent/40' : opt.accentClass,
              !active && 'hover:bg-secondary',
            )}
            aria-pressed={active}
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5 rounded-md border border-border bg-muted/30 p-1.5">
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{opt.description}</p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

