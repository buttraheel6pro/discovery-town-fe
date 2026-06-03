/** Shared week strip + navigation used by play-style open booking and rental availability. */
'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatLocalYmd } from '@/lib/ymd-date'
import { cn } from '@/lib/utils'

export function getOpenBookingWeekDates(anchorDate: Date): string[] {
  const dates: string[] = []
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(anchorDate)
    d.setDate(anchorDate.getDate() + i)
    dates.push(formatLocalYmd(d))
  }
  return dates
}

export function getOpenBookingWeekDatesFromOffset(weekOffset: number): string[] {
  const today = new Date()
  const baseDate = new Date(today)
  baseDate.setDate(today.getDate() + weekOffset * 7)
  return getOpenBookingWeekDates(baseDate)
}

export function formatOpenBookingDateDisplay(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function formatOpenBookingWeekRangeLabel(weekDates: readonly string[]): string {
  if (weekDates.length < 7) return ''
  return `${formatOpenBookingDateDisplay(weekDates[0] ?? '')} – ${formatOpenBookingDateDisplay(weekDates[6] ?? '')}`
}

export function getOpenBookingTodayIsoDate(): string {
  return formatLocalYmd(new Date())
}

export interface OpenBookingWeekToolbarProps {
  readonly weekOffset: number
  readonly onWeekOffsetChange: (nextOffset: number) => void
  readonly weekDates: readonly string[]
  /** When true, previous-week control is disabled at `weekOffset === 0` (play / facility default). */
  readonly disablePrevPastCurrentWeek?: boolean
}

export function OpenBookingWeekToolbar({
  weekOffset,
  onWeekOffsetChange,
  weekDates,
  disablePrevPastCurrentWeek = true,
}: Readonly<OpenBookingWeekToolbarProps>) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <Button
        variant="outline"
        size="icon"
        type="button"
        onClick={() => onWeekOffsetChange(Math.max(0, weekOffset - 1))}
        disabled={disablePrevPastCurrentWeek && weekOffset === 0}
        aria-label="Previous week"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-semibold text-muted-foreground">
        {formatOpenBookingWeekRangeLabel(weekDates)}
      </span>
      <Button
        variant="outline"
        size="icon"
        type="button"
        onClick={() => onWeekOffsetChange(weekOffset + 1)}
        aria-label="Next week"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

export interface OpenBookingWeekDayVisual {
  readonly className: string
  readonly 'aria-pressed': boolean
}

export interface OpenBookingWeekDayButtonGridProps {
  readonly weekDates: readonly string[]
  readonly isDateDisabled: (dateStr: string) => boolean
  readonly onDayClick: (dateStr: string) => void
  /** When true, days are not clickable (view-only calendar). */
  readonly interactionDisabled?: boolean
  /**
   * When omitted, uses play-style single selection (`selectedDate === dateStr`).
   * Supply for rental per-day range or other custom highlighting.
   */
  readonly selectedDate?: string | null
  readonly getDayVisual?: (dateStr: string) => OpenBookingWeekDayVisual
}

export function OpenBookingWeekDayButtonGrid({
  weekDates,
  isDateDisabled,
  onDayClick,
  selectedDate = null,
  getDayVisual,
  interactionDisabled = false,
}: Readonly<OpenBookingWeekDayButtonGridProps>) {
  return (
    <div className="mb-6 grid grid-cols-7 gap-1">
      {weekDates.map((date) => {
        const d = new Date(`${date}T12:00:00`)
        const notSelectable = isDateDisabled(date)
        const visual =
          getDayVisual?.(date) ??
          ({
            className: cn(
              'flex flex-col items-center rounded-lg border px-1 py-3 text-xs font-semibold transition-colors',
              notSelectable &&
                'cursor-not-allowed border-border bg-muted text-muted-foreground opacity-40',
              !notSelectable && selectedDate === date && 'border-accent bg-accent text-accent-foreground',
              !notSelectable &&
                selectedDate !== date &&
                'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground',
            ),
            'aria-pressed': selectedDate === date,
          } satisfies OpenBookingWeekDayVisual)
        return (
          <button
            key={date}
            type="button"
            onClick={() => {
              if (interactionDisabled || notSelectable) return
              onDayClick(date)
            }}
            disabled={notSelectable}
            className={visual.className}
            aria-pressed={visual['aria-pressed']}
            aria-disabled={interactionDisabled || notSelectable}
          >
            <span className="text-[10px] uppercase tracking-wider">
              {d.toLocaleDateString('en-GB', { weekday: 'short' })}
            </span>
            <span className="mt-0.5 text-base">{d.getDate()}</span>
          </button>
        )
      })}
    </div>
  )
}
