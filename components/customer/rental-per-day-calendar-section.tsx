/** PER_DAY rental — reuses play week UI; two-click from/to range (no time slots). */
'use client'

import { useMemo, useState } from 'react'

import {
  getOpenBookingTodayIsoDate,
  getOpenBookingWeekDatesFromOffset,
  OpenBookingWeekDayButtonGrid,
  OpenBookingWeekToolbar,
} from '@/components/customer/open-booking-week-ui'
import { useToast } from '@/hooks/use-toast'
import { formatRentalLongDate, getInclusiveYmdDayCount } from '@/lib/rental-calendar-helpers'
import { cn } from '@/lib/utils'

export interface RentalPerDayCalendarSectionProps {
  readonly stockQuantity: number
  readonly availabilityMap: ReadonlyMap<string, number>
  readonly maxRentalDays: number | null
  readonly selectedFromDate: string
  readonly selectedToDate: string
  readonly onDateRangeChange: (fromDate: string, toDate: string) => void
}

export function RentalPerDayCalendarSection({
  stockQuantity,
  availabilityMap,
  maxRentalDays,
  selectedFromDate,
  selectedToDate,
  onDateRangeChange,
}: Readonly<RentalPerDayCalendarSectionProps>) {
  const { toast } = useToast()
  const [weekOffset, setWeekOffset] = useState(0)
  const weekDates = useMemo(() => getOpenBookingWeekDatesFromOffset(weekOffset), [weekOffset])
  const todayStr = getOpenBookingTodayIsoDate()

  const from = selectedFromDate.trim()
  const to = selectedToDate.trim()
  const rangeComplete = from.length > 0 && to.length > 0

  function isDateDisabled(dateStr: string): boolean {
    if (dateStr < todayStr) return true
    const booked = availabilityMap.get(dateStr) ?? 0
    if (booked >= stockQuantity && stockQuantity > 0) return true
    return false
  }

  function onPickDay(day: string): void {
    if (isDateDisabled(day)) return

    if (!from) {
      onDateRangeChange(day, day)
      return
    }

    if (from && to && from !== to) {
      onDateRangeChange(day, day)
      return
    }

    if (day === from) {
      onDateRangeChange(day, day)
      return
    }

    const nextFrom = day < from ? day : from
    const nextTo = day < from ? from : day
    const days = getInclusiveYmdDayCount(nextFrom, nextTo)
    if (maxRentalDays != null && days > maxRentalDays) {
      toast({
        title: 'Range exceeds max rental days',
        description: `This product allows up to ${maxRentalDays} day(s). Choose a shorter range.`,
        variant: 'destructive',
      })
      return
    }
    onDateRangeChange(nextFrom, nextTo)
  }

  return (
    <section id="rental-dates" className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">Availability</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Pick a start date, then an end date on the week below (use arrows to change weeks). No
          time slots — full days only.
        </p>
      </div>

      <OpenBookingWeekToolbar
        weekOffset={weekOffset}
        onWeekOffsetChange={setWeekOffset}
        weekDates={weekDates}
      />

      <OpenBookingWeekDayButtonGrid
        weekDates={weekDates}
        isDateDisabled={isDateDisabled}
        onDayClick={onPickDay}
        getDayVisual={(dateStr) => {
          const disabled = isDateDisabled(dateStr)
          const hasFrom = from.length > 0
          const hasTo = to.length > 0
          const isEndpoint =
            !disabled &&
            hasFrom &&
            ((!hasTo && dateStr === from) ||
              (hasTo && from === to && dateStr === from) ||
              (hasTo && from !== to && (dateStr === from || dateStr === to)))
          const isMiddle =
            !disabled && hasFrom && hasTo && from !== to && dateStr > from && dateStr < to
          return {
            className: cn(
              'flex flex-col items-center rounded-lg border px-1 py-3 text-xs font-semibold transition-colors',
              disabled && 'cursor-not-allowed border-border bg-muted opacity-40',
              isEndpoint && 'border-accent bg-accent text-accent-foreground',
              isMiddle && 'border-accent/40 bg-accent/15 text-foreground',
              !disabled &&
                !isEndpoint &&
                !isMiddle &&
                'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground',
            ),
            'aria-pressed': isEndpoint || isMiddle,
          }
        }}
      />

      {rangeComplete ? (
        <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs">
          <p className="font-semibold text-foreground">Selected rental period</p>
          <p className="mt-1 text-muted-foreground">
            <span className="font-medium text-foreground">From:</span>{' '}
            {formatRentalLongDate(from)}
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">To:</span> {formatRentalLongDate(to)}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {from
            ? `Start: ${formatRentalLongDate(from)} — select end date on the week above.`
            : 'Select your start date, then your end date.'}
        </p>
      )}

      {maxRentalDays != null ? (
        <p className="text-xs text-muted-foreground">
          Maximum {maxRentalDays} day(s), inclusive of start and end.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-accent" aria-hidden />
          From / to day
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-accent/40" aria-hidden />
          Included days
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-muted opacity-50" aria-hidden />
          Unavailable
        </span>
      </div>
    </section>
  )
}
