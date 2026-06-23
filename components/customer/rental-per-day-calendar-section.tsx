/** PER_DAY rental — compact date strip with from/to range selection. */
'use client'

import { useCallback } from 'react'

import { CompactAvailabilityDateStrip } from '@/components/customer/compact-availability-date-strip'
import { getOpenBookingTodayIsoDate } from '@/components/customer/open-booking-week-ui'
import { useToast } from '@/hooks/use-toast'
import {
  resolveRentalAvailabilityDayStatus,
  type AvailabilityCalendarDayStatus,
} from '@/lib/availability-calendar-status'
import { formatRentalLongDate, getInclusiveYmdDayCount } from '@/lib/rental-calendar-helpers'

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
  const todayStr = getOpenBookingTodayIsoDate()

  const from = selectedFromDate.trim()
  const to = selectedToDate.trim()
  const rangeComplete = from.length > 0 && to.length > 0

  function isDateDisabled(dateStr: string): boolean {
    if (dateStr < todayStr) {
      return true
    }
    const booked = availabilityMap.get(dateStr) ?? 0
    if (booked >= stockQuantity && stockQuantity > 0) {
      return true
    }
    return false
  }

  const getDateStatus = useCallback(
    (dateStr: string): AvailabilityCalendarDayStatus =>
      resolveRentalAvailabilityDayStatus(dateStr, todayStr, availabilityMap, stockQuantity),
    [availabilityMap, stockQuantity, todayStr],
  )

  function onPickDay(day: string): void {
    if (isDateDisabled(day)) {
      return
    }

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
    <section id="rental-dates" className="space-y-4 rounded-xl bg-nav-cream p-4 sm:p-5">
      <CompactAvailabilityDateStrip
        title="Select a date"
        selectedDate={from || todayStr}
        selectedToDate={to}
        selectionMode="range"
        isDateDisabled={isDateDisabled}
        getDateStatus={getDateStatus}
        onDayClick={onPickDay}
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
            ? `Start: ${formatRentalLongDate(from)} — select end date above or in the calendar.`
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
          <span className="inline-block h-3 w-3 rounded bg-primary" aria-hidden />
          From / to day
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-accent/40" aria-hidden />
          Included days
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-border bg-muted" aria-hidden />
          Unavailable
        </span>
      </div>
    </section>
  )
}
