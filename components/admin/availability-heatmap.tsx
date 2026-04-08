/** Availability heatmap — hour × day grid from mock slot aggregation. */
'use client'

import { useMemo, useState } from 'react'
import { format, setHours } from 'date-fns'

import { TimeSlotDetailPopover } from '@/components/admin/time-slot-detail-popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { AvailabilityCell } from '@/lib/types'
import {
  cn,
  formatHeatmapTooltip,
  getHeatmapColor,
  getHeatmapTextColor,
} from '@/lib/utils'

export interface AvailabilityHeatmapProps {
  readonly cells: AvailabilityCell[]
  readonly from: Date
  readonly to: Date
  readonly operatingHoursStart?: number
  readonly operatingHoursEnd?: number
}

export function AvailabilityHeatmap({
  cells,
  from: _from,
  to: _to,
  operatingHoursStart = 6,
  operatingHoursEnd = 22,
}: Readonly<AvailabilityHeatmapProps>) {
  const [selectedCell, setSelectedCell] = useState<AvailabilityCell | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const dayKeys = useMemo(() => {
    const set = new Set<string>()
    for (const c of cells) {
      set.add(c.date)
    }
    return Array.from(set.values()).sort()
  }, [cells])

  const hours = useMemo(() => {
    const list: number[] = []
    for (let h = operatingHoursStart; h < operatingHoursEnd; h++) {
      list.push(h)
    }
    return list
  }, [operatingHoursEnd, operatingHoursStart])

  function cellAt(date: string, hour: number): AvailabilityCell | undefined {
    return cells.find((c) => c.date === date && c.hour === hour)
  }

  const gridTemplate = `minmax(4rem,auto) repeat(${dayKeys.length}, minmax(3rem,1fr))`

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <div
          className="inline-grid min-w-full gap-px bg-border p-px"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          <div className="bg-muted/50 min-h-10" aria-hidden />
          {dayKeys.map((d) => {
            const parsed = new Date(`${d}T12:00:00`)
            return (
              <div
                key={d}
                className="bg-muted/50 text-center text-[10px] sm:text-xs font-semibold text-muted-foreground px-1 py-2"
              >
                {format(parsed, 'EEE d')}
              </div>
            )
          })}

          {hours.map((hour) => (
            <div key={hour} className="contents">
              <div className="bg-card text-[10px] sm:text-xs text-muted-foreground flex items-center justify-end pr-2 py-1 border-t border-border">
                {format(setHours(new Date(), hour), 'ha')}
              </div>
              {dayKeys.map((dateStr) => {
                const cell = cellAt(dateStr, hour)
                const utilization = cell?.utilizationPct ?? 0
                const total = cell?.totalSessions ?? 0
                const bg = getHeatmapColor(utilization)
                const fg = getHeatmapTextColor(utilization)
                const tooltip = cell
                  ? formatHeatmapTooltip(cell)
                  : 'No data'

                return (
                  <Tooltip key={`${dateStr}-${hour}`}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          'min-h-10 sm:min-h-[40px] border-t border-l border-border flex items-center justify-center text-[10px] sm:text-xs font-semibold transition-opacity hover:opacity-90',
                          bg,
                          fg,
                          total === 0 && 'border-border',
                        )}
                        onClick={() => {
                          if (cell) {
                            setSelectedCell(cell)
                            setDetailOpen(true)
                          }
                        }}
                        aria-label={tooltip}
                      >
                        {total > 0 ? `${utilization}%` : ''}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      {tooltip}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">Legend</span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-muted/40 border border-border" />
          No sessions
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-green-500/25 border border-border" />
          1–30%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-green-500/45 border border-border" />
          31–60%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-amber-500/40 border border-border" />
          61–90%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-destructive/50 border border-border" />
          91–100%
        </span>
      </div>

      <TimeSlotDetailPopover
        cell={selectedCell}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false)
          setSelectedCell(null)
        }}
      />
    </div>
  )
}
