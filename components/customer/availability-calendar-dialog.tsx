/** Full-month availability calendar dialog — session markers and status legend. */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { getOpenBookingTodayIsoDate } from '@/components/customer/open-booking-week-ui'
import type { AvailabilityCalendarDayStatus } from '@/lib/availability-calendar-status'
import { getDateRangeVisualRole } from '@/lib/availability-date-range'
import { cn } from '@/lib/utils'

export type AvailabilityCalendarSelectionMode = 'single' | 'range'

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const

const STATUS_MARKER_CLASS: Record<AvailabilityCalendarDayStatus, string> = {
  'lots-of-space': 'bg-emerald-500',
  'filling-up': 'bg-amber-400',
  'sold-out': 'bg-destructive',
  'online-closed': 'bg-primary',
  unavailable: 'bg-muted-foreground/40',
}

export interface AvailabilityCalendarDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly selectedDate: string
  readonly onSelectDate: (dateStr: string) => void
  readonly isDateDisabled: (dateStr: string) => boolean
  readonly getDateStatus?: (dateStr: string) => AvailabilityCalendarDayStatus
  readonly initialMonth?: string
  readonly selectionMode?: AvailabilityCalendarSelectionMode
  readonly selectedToDate?: string
}

interface CalendarCell {
  readonly dateStr: string
  readonly day: number
  readonly inMonth: boolean
}

function ymdToDate(ymd: string): Date {
  return new Date(`${ymd}T12:00:00`)
}

function dateToYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatMonthYearTitle(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })
}

function buildMonthGrid(monthAnchor: Date): CalendarCell[] {
  const year = monthAnchor.getFullYear()
  const month = monthAnchor.getMonth()
  const firstOfMonth = new Date(year, month, 1, 12, 0, 0, 0)
  const startOffset = firstOfMonth.getDay()
  const gridStart = new Date(year, month, 1 - startOffset, 12, 0, 0, 0)
  const cells: CalendarCell[] = []

  for (let index = 0; index < 42; index += 1) {
    const cellDate = new Date(gridStart)
    cellDate.setDate(gridStart.getDate() + index)
    const dateStr = dateToYmd(cellDate)
    cells.push({
      dateStr,
      day: cellDate.getDate(),
      inMonth: cellDate.getMonth() === month,
    })
  }

  return cells
}

function AvailabilityCalendarLegend() {
  const items: ReadonlyArray<{ readonly status: AvailabilityCalendarDayStatus; readonly label: string }> = [
    { status: 'online-closed', label: 'Online sales closed' },
    { status: 'filling-up', label: 'Filling up fast' },
    { status: 'sold-out', label: 'Sold out' },
    { status: 'lots-of-space', label: 'Lots of space' },
    { status: 'unavailable', label: 'Unavailable' },
  ]

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 border-t border-border px-6 py-5 text-sm text-muted-foreground">
      {items.map((item) => (
        <span key={item.status} className="flex items-center gap-2.5">
          {item.status === 'unavailable' ? (
            <span
              className="inline-block h-3.5 w-3.5 shrink-0 rounded-sm border border-border bg-muted"
              aria-hidden
            />
          ) : (
            <span
              className={cn(
                'inline-block h-1 w-6 shrink-0 rounded-full',
                STATUS_MARKER_CLASS[item.status],
              )}
              aria-hidden
            />
          )}
          {item.label}
        </span>
      ))}
    </div>
  )
}

export function AvailabilityCalendarDialog({
  open,
  onOpenChange,
  selectedDate,
  onSelectDate,
  isDateDisabled,
  getDateStatus,
  initialMonth,
  selectionMode = 'single',
  selectedToDate = '',
}: Readonly<AvailabilityCalendarDialogProps>) {
  const todayStr = getOpenBookingTodayIsoDate()
  const [visibleMonth, setVisibleMonth] = useState<Date>(() =>
    ymdToDate(initialMonth ?? (selectedDate || todayStr)),
  )

  useEffect(() => {
    if (open) {
      setVisibleMonth(ymdToDate(initialMonth ?? (selectedDate || todayStr)))
    }
  }, [initialMonth, open, selectedDate, todayStr])

  const monthTitle = formatMonthYearTitle(dateToYmd(visibleMonth))
  const cells = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth])

  function shiftMonth(delta: number): void {
    setVisibleMonth((current) => {
      const next = new Date(current)
      next.setMonth(current.getMonth() + delta, 1)
      return next
    })
  }

  function handleOpenChange(nextOpen: boolean): void {
    if (nextOpen) {
      setVisibleMonth(ymdToDate(selectedDate || todayStr))
    }
    onOpenChange(nextOpen)
  }

  function handlePick(dateStr: string): void {
    if (isDateDisabled(dateStr)) {
      return
    }
    onSelectDate(dateStr)
    if (selectionMode === 'single') {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[min(100vw-2rem,30rem)] gap-0 overflow-hidden p-0 sm:max-w-[30rem]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
          <DialogTitle className="text-lg font-bold text-foreground">{monthTitle}</DialogTitle>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => onOpenChange(false)}
              aria-label="Close calendar"
            >
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>

        <div className="px-6 pt-5 pb-4">
          <div className="mb-3 grid grid-cols-7 gap-1.5">
            {WEEKDAY_LABELS.map((label, index) => (
              <span
                key={`${label}-${index}`}
                className="text-center text-xs font-semibold text-muted-foreground"
              >
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((cell) => {
              const disabled = isDateDisabled(cell.dateStr)
              const isToday = cell.dateStr === todayStr
              const rangeRole =
                selectionMode === 'range'
                  ? getDateRangeVisualRole(cell.dateStr, selectedDate, selectedToDate || selectedDate)
                  : 'none'
              const isRangeEndpoint = rangeRole === 'endpoint'
              const isRangeMiddle = rangeRole === 'middle'
              const isSelected =
                selectionMode === 'single'
                  ? selectedDate === cell.dateStr && !disabled
                  : isRangeEndpoint && !disabled
              const status = getDateStatus?.(cell.dateStr) ?? (disabled ? 'unavailable' : 'lots-of-space')
              const isUnavailable = cell.inMonth && (disabled || status === 'unavailable')
              const showMarker = cell.inMonth

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  disabled={disabled}
                  onClick={() => handlePick(cell.dateStr)}
                  className={cn(
                    'relative flex min-h-[3.25rem] flex-col items-center justify-center rounded-lg border px-1 py-2 text-base transition-colors',
                    !cell.inMonth &&
                      'cursor-default border-transparent bg-transparent text-muted-foreground/30',
                    isUnavailable &&
                      'cursor-not-allowed border-border bg-muted text-muted-foreground line-through decoration-muted-foreground/70',
                    cell.inMonth &&
                      !isUnavailable &&
                      !isRangeEndpoint &&
                      !isRangeMiddle &&
                      'border-transparent text-foreground hover:border-border hover:bg-secondary',
                    isRangeMiddle && !isUnavailable && 'border-accent/40 bg-accent/15 text-foreground',
                    isToday && !isSelected && !isUnavailable && !isRangeMiddle && 'ring-2 ring-foreground',
                    isSelected && 'border-primary bg-primary/5 ring-2 ring-primary',
                  )}
                  aria-pressed={isSelected || isRangeMiddle}
                  aria-disabled={isUnavailable}
                  aria-label={cell.dateStr}
                >
                  <span
                    className={cn(
                      'font-semibold leading-none',
                      isUnavailable && 'opacity-60',
                      isSelected && 'text-primary',
                    )}
                  >
                    {cell.day}
                  </span>
                  {showMarker ? (
                    <span
                      className={cn(
                        'mt-1.5 h-1 w-5 rounded-full',
                        isUnavailable
                          ? 'bg-muted-foreground/50'
                          : STATUS_MARKER_CLASS[status],
                      )}
                      aria-hidden
                    />
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>

        <AvailabilityCalendarLegend />
      </DialogContent>
    </Dialog>
  )
}
