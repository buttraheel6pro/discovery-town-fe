/** Preset and custom date range — reads/writes ReportsProvider filters. */
'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn, formatDateRangeLabel } from '@/lib/utils'
import { useReports } from '@/lib/reports-store'
import type { DateRangePreset } from '@/lib/types'

const PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'this_week', label: 'This week' },
  { id: 'this_month', label: 'This month' },
  { id: 'last_30_days', label: 'Last 30 days' },
  { id: 'last_3_months', label: 'Last 3 months' },
]

export function GlobalDateRangePicker() {
  const { filters, setPreset, setCustomDateRange } = useReports()
  const [rangeMode, setRangeMode] = useState(false)
  const [fromInput, setFromInput] = useState(filters.dateRange.from)
  const [toInput, setToInput] = useState(filters.dateRange.to)

  function applyCustom() {
    if (!fromInput || !toInput) return
    setCustomDateRange({ from: fromInput, to: toInput })
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: 'var(--font-barlow)' }}
        >
          Date range
        </p>
        <p className="text-xs text-muted-foreground">{formatDateRangeLabel(filters.dateRange)}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.id}
            type="button"
            size="sm"
            variant={filters.preset === p.id ? 'default' : 'outline'}
            className={cn(filters.preset === p.id && 'bg-accent text-accent-foreground hover:bg-accent/90')}
            onClick={() => setPreset(p.id)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <Switch
            id="reports-custom-range"
            checked={rangeMode}
            onCheckedChange={setRangeMode}
            aria-label="Toggle custom date range"
          />
          <Label htmlFor="reports-custom-range" className="text-xs font-medium">
            Custom range
          </Label>
        </div>
        {rangeMode ? (
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="reports-from" className="text-xs">
                From
              </Label>
              <Input
                id="reports-from"
                type="date"
                value={fromInput}
                onChange={(e) => setFromInput(e.target.value)}
                className="h-9 w-[160px]"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="reports-to" className="text-xs">
                To
              </Label>
              <Input
                id="reports-to"
                type="date"
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                className="h-9 w-[160px]"
              />
            </div>
            <Button type="button" size="sm" className="bg-accent text-accent-foreground" onClick={applyCustom}>
              Apply
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
