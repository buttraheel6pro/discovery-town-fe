/** Compact horizontal date strip — date row with full availability calendar dialog. */
'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, ChevronRight } from 'lucide-react'

import {
  AvailabilityCalendarDialog,
  type AvailabilityCalendarSelectionMode,
} from '@/components/customer/availability-calendar-dialog'
import { Button } from '@/components/ui/button'
import { getOpenBookingTodayIsoDate } from '@/components/customer/open-booking-week-ui'
import type { AvailabilityCalendarDayStatus } from '@/lib/availability-calendar-status'
import { getDateRangeVisualRole } from '@/lib/availability-date-range'
import { addDaysToYmd } from '@/lib/ymd-date'
import { cn } from '@/lib/utils'

const DAYS_PER_PAGE_DEFAULT = 5
const DAYS_PER_PAGE_COMPACT = 3

export type CompactAvailabilityDateStripDensity = 'default' | 'compact'

export interface CompactAvailabilityDateStripProps {
  readonly selectedDate: string
  readonly isDateDisabled: (dateStr: string) => boolean
  readonly onDayClick: (dateStr: string) => void
  readonly getDateStatus?: (dateStr: string) => AvailabilityCalendarDayStatus
  readonly title?: string
  readonly selectionMode?: AvailabilityCalendarSelectionMode
  readonly selectedToDate?: string
  /** Narrow layouts (e.g. embedded party booking sidebar). */
  readonly density?: CompactAvailabilityDateStripDensity
}

function formatMonthYearLabel(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`)
    .toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    .toUpperCase()
}

function ymdToDate(ymd: string): Date {
  return new Date(`${ymd}T12:00:00`)
}

function resolveDaysPerPage(density: CompactAvailabilityDateStripDensity): number {
  return density === 'compact' ? DAYS_PER_PAGE_COMPACT : DAYS_PER_PAGE_DEFAULT
}

function buildDefaultStrip(todayStr: string, daysPerPage: number): string[] {
  const dates = [todayStr]
  for (let index = 1; index <= daysPerPage; index += 1) {
    dates.push(addDaysToYmd(todayStr, index))
  }
  return dates
}

function buildVisibleDates(
  todayStr: string,
  selectedDate: string,
  daysPerPage: number,
): string[] {
  const defaultStrip = buildDefaultStrip(todayStr, daysPerPage)
  if (!selectedDate || defaultStrip.includes(selectedDate)) {
    return defaultStrip
  }
  if (selectedDate < todayStr) {
    return defaultStrip
  }
  const dates: string[] = []
  for (let index = 0; index <= daysPerPage; index += 1) {
    dates.push(addDaysToYmd(selectedDate, index))
  }
  return dates
}

const TODAY_CELL_WIDTH_CLASS = 'w-[8.505rem]'
const DATE_ROW_CELL_HEIGHT_CLASS = 'h-14'

export function CompactAvailabilityDateStrip({
  selectedDate,
  isDateDisabled,
  onDayClick,
  getDateStatus,
  title = 'Select a date',
  selectionMode = 'single',
  selectedToDate = '',
  density = 'default',
}: Readonly<CompactAvailabilityDateStripProps>) {
  const todayStr = getOpenBookingTodayIsoDate()
  const [calendarOpen, setCalendarOpen] = useState(false)
  const daysPerPage = resolveDaysPerPage(density)
  const isCompact = density === 'compact'

  const visibleDates = useMemo(
    () => buildVisibleDates(todayStr, selectedDate, daysPerPage),
    [daysPerPage, selectedDate, todayStr],
  )

  const monthLabel = formatMonthYearLabel(selectedDate || visibleDates[0] || todayStr)

  function handleSelectDate(dateStr: string): void {
    if (isDateDisabled(dateStr)) {
      return
    }
    onDayClick(dateStr)
  }

  function openCalendar(): void {
    setCalendarOpen(true)
  }

  return (
    <div className={cn('space-y-3', isCompact ? 'mb-4' : 'mb-0')}>
      <div className="flex items-center justify-between gap-2">
        <h3
          className={cn(
            'min-w-0 font-bold text-foreground',
            isCompact ? 'text-base' : 'text-lg',
          )}
        >
          {title}
        </h3>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            'shrink-0 border-border/70 bg-white text-foreground shadow-sm hover:bg-white/90',
            isCompact ? 'h-9 w-9' : 'h-10 w-10',
          )}
          onClick={openCalendar}
          aria-label="Open calendar"
        >
          <CalendarDays
            className={cn('shrink-0', isCompact ? 'h-4 w-4' : 'h-5 w-5')}
            aria-hidden
          />
        </Button>
      </div>

      <p className="text-xs font-bold tracking-widest text-foreground/70">{monthLabel}</p>

      <div className="mt-6 flex min-w-0 items-stretch gap-2">
        <div
          className={cn(
            'flex min-w-0 flex-1 items-stretch gap-2',
            isCompact && 'overflow-x-auto overscroll-x-contain',
          )}
        >
          {visibleDates.map((dateStr) => {
            const disabled = isDateDisabled(dateStr)
            const rangeRole =
              selectionMode === 'range'
                ? getDateRangeVisualRole(dateStr, selectedDate, selectedToDate || selectedDate)
                : 'none'
            const isRangeEndpoint = rangeRole === 'endpoint'
            const isRangeMiddle = rangeRole === 'middle'
            const isSelected =
              selectionMode === 'single'
                ? selectedDate === dateStr && !disabled
                : isRangeEndpoint && !disabled
            const isToday = dateStr === todayStr
            const date = ymdToDate(dateStr)

            if (isToday) {
              const todayInactive = !disabled && !isSelected && !isRangeMiddle

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelectDate(dateStr)}
                  className={cn(
                    'flex shrink-0 items-center justify-center rounded-[4px] border text-center transition-colors',
                    TODAY_CELL_WIDTH_CLASS,
                    DATE_ROW_CELL_HEIGHT_CLASS,
                    disabled &&
                      'cursor-not-allowed border-border bg-muted/50 text-muted-foreground opacity-60',
                    !disabled &&
                      isSelected &&
                      'border-brand-orange bg-brand-orange text-nav-cream shadow-sm',
                    !disabled &&
                      isRangeMiddle &&
                      'border-brand-orange/40 bg-brand-orange/15 text-foreground',
                    todayInactive &&
                      'cursor-pointer border-border bg-muted/35 text-muted-foreground',
                  )}
                  aria-pressed={isSelected || isRangeMiddle}
                  aria-disabled={disabled}
                >
                  <span className="text-sm font-bold">Today</span>
                </button>
              )
            }

            return (
              <button
                key={dateStr}
                type="button"
                disabled={disabled}
                onClick={() => handleSelectDate(dateStr)}
                className={cn(
                  'flex flex-col items-center justify-center rounded-[4px] border text-center transition-colors',
                  DATE_ROW_CELL_HEIGHT_CLASS,
                  isCompact
                    ? 'min-w-[3.25rem] shrink-0 px-2'
                    : 'min-w-[4.5rem] flex-1 px-2',
                  disabled &&
                    'cursor-not-allowed border-border bg-muted/60 text-muted-foreground line-through opacity-60',
                  !disabled &&
                    isSelected &&
                    'border-brand-orange bg-brand-orange text-nav-cream shadow-sm',
                  !disabled &&
                    isRangeMiddle &&
                    'border-brand-orange/40 bg-brand-orange/15 text-foreground',
                  !disabled &&
                    !isSelected &&
                    !isRangeMiddle &&
                    'border-border bg-white text-foreground hover:border-border/80',
                )}
                aria-pressed={isSelected || isRangeMiddle}
              >
                <span
                  className={cn(
                    'text-[10px] font-semibold uppercase tracking-wide',
                    isSelected ? 'text-nav-cream/90' : 'text-muted-foreground',
                  )}
                >
                  {date.toLocaleDateString('en-GB', { weekday: 'short' })}
                </span>
                <span
                  className={cn(
                    'mt-0.5 font-bold leading-none',
                    isCompact ? 'text-base' : 'text-lg',
                    isSelected && 'text-nav-cream',
                  )}
                >
                  {date.getDate()}
                </span>
              </button>
            )
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            'shrink-0 rounded-[4px] border-border bg-white text-foreground shadow-sm hover:bg-white/90',
            DATE_ROW_CELL_HEIGHT_CLASS,
            isCompact ? 'w-9' : 'w-10',
          )}
          onClick={openCalendar}
          aria-label="Choose another date"
        >
          <ChevronRight className={cn(isCompact ? 'h-4 w-4' : 'h-5 w-5')} aria-hidden />
        </Button>
      </div>

      <AvailabilityCalendarDialog
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        isDateDisabled={isDateDisabled}
        getDateStatus={getDateStatus}
        initialMonth={selectedDate || todayStr}
        selectionMode={selectionMode}
        selectedToDate={selectedToDate}
      />
    </div>
  )
}
