/** Multi-select service type chips for admin filters — click to toggle; no separate checkboxes. */

import { ServiceTypeBadge } from '@/components/customer/service-type-badge'
import { cn } from '@/lib/utils'
import type { SchedulingServiceType } from '@/lib/types'

export interface ServiceTypeFilterPillsProps {
  readonly types: readonly SchedulingServiceType[]
  readonly selected: readonly SchedulingServiceType[]
  readonly onToggle: (type: SchedulingServiceType) => void
  readonly className?: string
}

export function ServiceTypeFilterPills({
  types,
  selected,
  onToggle,
  className,
}: Readonly<ServiceTypeFilterPillsProps>) {
  const active = new Set(selected)

  return (
    <div
      className={cn('flex flex-wrap gap-2', className)}
      role="group"
      aria-label="Filter by service type"
    >
      {types.map((t) => {
        const isOn = active.has(t)
        return (
          <button
            key={t}
            type="button"
            aria-pressed={isOn}
            onClick={() => onToggle(t)}
            className={cn(
              'rounded-full border-2 border-transparent transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isOn
                ? 'border-primary shadow-sm ring-2 ring-primary/20'
                : 'opacity-65 hover:opacity-100',
            )}
          >
            <span className="pointer-events-none block">
              <ServiceTypeBadge serviceType={t} />
            </span>
          </button>
        )
      })}
    </div>
  )
}
