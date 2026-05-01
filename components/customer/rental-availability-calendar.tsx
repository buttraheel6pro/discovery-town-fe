/** Mock availability calendar for rental products with optional date-range selection. */
'use client'

import { rentalBookedDates } from '@/lib/mock-data'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface RentalAvailabilityCalendarProps {
  readonly productId: string
  readonly stockQuantity: number
  readonly rentalBillingType?: string | null
  readonly maxRentalDays?: number | null
  readonly selectedFromDate?: string
  readonly selectedToDate?: string
  readonly onDateRangeChange?: (fromDate: string, toDate: string) => void
}

function getUpcomingDates(): string[] {
  const now = new Date()
  const dates: string[] = []
  for (let index = 0; index < 28; index += 1) {
    const next = new Date(now)
    next.setDate(now.getDate() + index)
    dates.push(next.toISOString().slice(0, 10))
  }
  return dates
}

export function RentalAvailabilityCalendar({
  productId,
  stockQuantity,
  rentalBillingType,
  maxRentalDays = null,
  selectedFromDate = '',
  selectedToDate = '',
  onDateRangeChange,
}: Readonly<RentalAvailabilityCalendarProps>) {
  const { toast } = useToast()
  const days = getUpcomingDates()
  const availabilityMap = new Map(
    (rentalBookedDates[productId] ?? []).map((entry) => [entry.date, entry.bookedUnits]),
  )
  const isPerDaySelection = rentalBillingType === 'PER_DAY' && Boolean(onDateRangeChange)
  const hasFrom = selectedFromDate.length > 0
  const hasTo = selectedToDate.length > 0
  const rangeComplete = hasFrom && hasTo

  function getInclusiveDays(fromDate: string, toDate: string): number {
    const from = new Date(`${fromDate}T00:00:00`)
    const to = new Date(`${toDate}T00:00:00`)
    const fromDay = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
    const toDay = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate())
    return Math.floor((toDay - fromDay) / 86400000) + 1
  }

  function onSelectDate(day: string, isFullyBooked: boolean): void {
    if (!isPerDaySelection) return
    if (isFullyBooked) return

    if (!selectedFromDate || selectedToDate) {
      onDateRangeChange?.(day, '')
      return
    }

    if (day === selectedFromDate) {
      onDateRangeChange?.(day, day)
      return
    }

    const nextFrom = day < selectedFromDate ? day : selectedFromDate
    const nextTo = day < selectedFromDate ? selectedFromDate : day
    const selectedDays = getInclusiveDays(nextFrom, nextTo)
    if (maxRentalDays != null && selectedDays > maxRentalDays) {
      toast({
        title: 'To date exceeds max rental days',
        description: `This product allows up to ${maxRentalDays} day(s). Please select an earlier To date.`,
        variant: 'destructive',
      })
      return
    }
    onDateRangeChange?.(nextFrom, nextTo)
  }

  return (
    <section id="rental-dates" className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h2 className="text-lg font-bold text-foreground">Availability (next 4 weeks)</h2>
      {isPerDaySelection ? (
        <div className="space-y-2 text-xs text-muted-foreground">
          {rangeComplete ? (
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
              <p className="font-semibold text-foreground">Selected rental period</p>
              <p className="mt-1">
                <span className="font-medium text-foreground">From:</span>{' '}
                {selectedFromDate}
              </p>
              <p>
                <span className="font-medium text-foreground">To:</span>{' '}
                {selectedToDate}
              </p>
            </div>
          ) : (
            <>
              <p className="font-medium text-foreground">
                Select rental period from this calendar (first click = From, second click = To).
              </p>
              <p>
                Selected: {hasFrom ? selectedFromDate : 'From not selected'} {'->'}{' '}
                {hasTo ? selectedToDate : 'To not selected'}
              </p>
            </>
          )}
          {maxRentalDays != null ? (
            <p>Maximum {maxRentalDays} day(s), inclusive of from and to dates.</p>
          ) : null}
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
        {days.map((day) => {
          const bookedUnits = availabilityMap.get(day) ?? 0
          const isFullyBooked = bookedUnits >= stockQuantity && stockQuantity > 0
          const isPartial = bookedUnits > 0 && !isFullyBooked
          const isSelectedEdge = day === selectedFromDate || day === selectedToDate
          const isWithinRange =
            Boolean(selectedFromDate) &&
            Boolean(selectedToDate) &&
            day >= selectedFromDate &&
            day <= selectedToDate
          const isFromOnly = day === selectedFromDate
          const isToOnly = day === selectedToDate
          const isSingleDayRange = isFromOnly && isToOnly
          return (
            <button
              type="button"
              key={day}
              onClick={() => onSelectDate(day, isFullyBooked)}
              disabled={isPerDaySelection ? isFullyBooked : true}
              className={cn(
                'rounded-md border px-2 py-2 text-left text-xs',
                isFullyBooked && 'border-red-200 bg-red-100 text-red-700',
                isPartial && 'border-amber-200 bg-amber-100 text-amber-700',
                !isFullyBooked && !isPartial && 'border-green-200 bg-green-100 text-green-700',
                isPerDaySelection && !isFullyBooked && 'cursor-pointer',
                isWithinRange && 'ring-1 ring-accent',
                isSelectedEdge && 'ring-2 ring-accent',
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <p className="font-semibold">{day.slice(5)}</p>
                {isSingleDayRange ? (
                  <span className="rounded bg-accent/20 px-1 py-0.5 text-[10px] font-semibold text-accent">
                    From/To
                  </span>
                ) : isFromOnly ? (
                  <span className="rounded bg-accent/20 px-1 py-0.5 text-[10px] font-semibold text-accent">
                    From
                  </span>
                ) : isToOnly ? (
                  <span className="rounded bg-accent/20 px-1 py-0.5 text-[10px] font-semibold text-accent">
                    To
                  </span>
                ) : null}
              </div>
              <p>{isFullyBooked ? 'Fully booked' : isPartial ? 'Partially booked' : 'Available'}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
