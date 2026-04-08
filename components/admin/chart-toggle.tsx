/** Daily / weekly / monthly aggregation toggle for charts. */
'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

export type ChartGranularity = 'daily' | 'weekly' | 'monthly'

export interface ChartToggleProps {
  readonly value: ChartGranularity
  readonly onChange: (v: ChartGranularity) => void
  readonly className?: string
}

export function ChartToggle({ value, onChange, className }: Readonly<ChartToggleProps>) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v === 'daily' || v === 'weekly' || v === 'monthly') onChange(v)
      }}
      className={cn('justify-start', className)}
      aria-label="Chart period"
    >
      <ToggleGroupItem value="daily" className="text-xs">
        Daily
      </ToggleGroupItem>
      <ToggleGroupItem value="weekly" className="text-xs">
        Weekly
      </ToggleGroupItem>
      <ToggleGroupItem value="monthly" className="text-xs">
        Monthly
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
