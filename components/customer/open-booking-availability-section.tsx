/** Open booking, private hire, and rental availability — shared entry; rental variants delegate. */
'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  RentalPerDayCalendarSection,
  type RentalPerDayCalendarSectionProps,
} from '@/components/customer/rental-per-day-calendar-section'
import { RentalWeekSlotPicker } from '@/components/customer/rental-week-slot-picker'
import {
  OpenBookingTimeWindowGrid,
} from '@/components/customer/open-booking-time-window-grid'
import {
  formatOpenBookingDateDisplay,
  getOpenBookingTodayIsoDate,
  getOpenBookingWeekDatesFromOffset,
  OpenBookingWeekDayButtonGrid,
  OpenBookingWeekToolbar,
} from '@/components/customer/open-booking-week-ui'
import {
  generateMockRentalHalfDayWindows,
  generateMockRentalHourlyWindows,
} from '@/lib/rental-calendar-helpers'
import { generateOpenAvailability, generateOpenAvailabilityForDuration } from '@/lib/mock-data'
import { cn, formatDurationLabel } from '@/lib/utils'
import type { AvailableWindow, SchedulingService } from '@/lib/types'

export type OpenBookingAvailabilityMode = 'facility' | 'private_hire'

export interface OpenBookingServiceAvailabilitySectionProps {
  readonly title?: string
  readonly service: SchedulingService
  readonly weekOffset: number
  readonly onWeekOffsetChange: (offset: number) => void
  readonly selectedDate: string
  readonly onSelectedDateChange: (dateStr: string) => void
  readonly selectedWindow: AvailableWindow | null
  readonly onSelectedWindowChange: (window: AvailableWindow | null) => void
  readonly durationMinutes: number
  readonly onDurationMinutesChange: (minutes: number) => void
  readonly durationOptions: readonly number[]
  readonly mode: OpenBookingAvailabilityMode
  /** Private hire: user must confirm before slots load (duration-sized windows). */
  readonly availabilityChecked?: boolean
  readonly onCheckAvailability?: () => void
  readonly onResetAvailabilityCheck?: () => void
  readonly maxAdvanceDate?: Date | null
  /** When set, uses catalog slot windows instead of generated open-booking mock times. */
  readonly availabilityWindows?: readonly AvailableWindow[] | null
}

export type OpenBookingRentalPerDayVariantProps = Readonly<
  { readonly variant: 'rental_per_day' } & RentalPerDayCalendarSectionProps
>

export type OpenBookingRentalSlotsVariantProps = Readonly<{
  readonly variant: 'rental_slots'
  readonly slotBilling: 'PER_HOUR' | 'PER_HALF_DAY'
  readonly availabilityMap: ReadonlyMap<string, number>
  readonly stockQuantity: number
  readonly slotIncrementMinutes?: number | null
  readonly selectedSlotStartAt: string
  readonly selectedSlotEndAt: string
  readonly onRentalSlotChange: (startIso: string, endIso: string) => void
}>

export type OpenBookingAvailabilitySectionProps =
  | OpenBookingServiceAvailabilitySectionProps
  | OpenBookingRentalPerDayVariantProps
  | OpenBookingRentalSlotsVariantProps

function OpenBookingServiceAvailabilitySection({
  title = 'Availability',
  service,
  weekOffset,
  onWeekOffsetChange,
  selectedDate,
  onSelectedDateChange,
  selectedWindow,
  onSelectedWindowChange,
  durationMinutes,
  onDurationMinutesChange,
  durationOptions,
  mode,
  availabilityChecked = false,
  onCheckAvailability,
  onResetAvailabilityCheck,
  maxAdvanceDate = null,
  availabilityWindows,
}: Readonly<OpenBookingServiceAvailabilitySectionProps>) {
  const todayStr = getOpenBookingTodayIsoDate()
  const weekDates = getOpenBookingWeekDatesFromOffset(weekOffset)

  const availability = (() => {
    if (mode === 'private_hire' && !availabilityChecked) return null
    if (availabilityWindows != null) {
      return {
        date: selectedDate,
        serviceId: service.id,
        windows: [...availabilityWindows],
        operatingHours: { open: '08:00', close: '21:00' },
      }
    }
    if (mode === 'private_hire') {
      return generateOpenAvailabilityForDuration(service, selectedDate, durationMinutes)
    }
    return generateOpenAvailability(service, selectedDate)
  })()

  const showTimeRange = mode === 'private_hire' && availabilityChecked

  function isDateOutOfRange(dateStr: string): boolean {
    if (dateStr < todayStr) return true
    if (maxAdvanceDate) {
      const cap = new Date(maxAdvanceDate)
      cap.setHours(23, 59, 59, 999)
      const d = new Date(`${dateStr}T12:00:00`)
      if (d > cap) return true
    }
    return false
  }

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">{title}</h2>

      {mode === 'private_hire' && durationOptions.length > 0 ? (
        <div className="mb-6 space-y-2">
          <Label>Duration</Label>
          <div className="flex flex-wrap gap-2">
            {durationOptions.map((m) => {
              const active = durationMinutes === m
              return (
                <Button
                  key={m}
                  type="button"
                  size="sm"
                  variant={active ? 'default' : 'outline'}
                  className={cn(active && 'bg-accent text-accent-foreground hover:bg-accent/90')}
                  onClick={() => {
                    onDurationMinutesChange(m)
                    onResetAvailabilityCheck?.()
                  }}
                >
                  {formatDurationLabel(m)}
                </Button>
              )
            })}
          </div>
        </div>
      ) : null}

      <OpenBookingWeekToolbar
        weekOffset={weekOffset}
        onWeekOffsetChange={onWeekOffsetChange}
        weekDates={weekDates}
      />

      <OpenBookingWeekDayButtonGrid
        weekDates={weekDates}
        isDateDisabled={isDateOutOfRange}
        selectedDate={selectedDate}
        onDayClick={(date) => {
          onSelectedDateChange(date)
          onSelectedWindowChange(null)
          if (mode === 'private_hire') {
            onResetAvailabilityCheck?.()
          }
        }}
      />

      {mode === 'private_hire' ? (
        <div className="mb-4">
          <Button
            type="button"
            variant="secondary"
            disabled={!selectedDate}
            onClick={onCheckAvailability}
          >
            Check availability
          </Button>
        </div>
      ) : null}

      {availability && (mode === 'facility' || availabilityChecked) ? (
        availability.windows.length > 0 ? (
          <OpenBookingTimeWindowGrid
            headline={`Available times for ${formatOpenBookingDateDisplay(selectedDate)}`}
            windows={availability.windows}
            selectedWindow={selectedWindow}
            onSelectedWindowChange={onSelectedWindowChange}
            showTimeRange={showTimeRange}
            resetSlot={
              mode === 'private_hire' && availabilityChecked && onResetAvailabilityCheck ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-muted-foreground"
                  onClick={onResetAvailabilityCheck}
                >
                  Reset
                </Button>
              ) : null
            }
          />
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No times available on this day. Choose another date in the week above.
          </p>
        )
      ) : null}

      {mode === 'facility' && durationOptions.length > 0 && selectedWindow ? (
        <div className="mt-6 space-y-2">
          <Label>Duration</Label>
          <div className="flex flex-wrap gap-2">
            {durationOptions.map((m) => (
              <Button
                key={m}
                type="button"
                size="sm"
                variant={durationMinutes === m ? 'default' : 'outline'}
                onClick={() => onDurationMinutesChange(m)}
                className={cn(
                  durationMinutes === m && 'bg-accent text-accent-foreground hover:bg-accent/90',
                )}
              >
                {formatDurationLabel(m)}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export function OpenBookingAvailabilitySection(
  props: Readonly<OpenBookingAvailabilitySectionProps>,
) {
  if ('variant' in props && props.variant === 'rental_per_day') {
    return (
      <RentalPerDayCalendarSection
        availabilityMap={props.availabilityMap}
        maxRentalDays={props.maxRentalDays}
        onDateRangeChange={props.onDateRangeChange}
        selectedFromDate={props.selectedFromDate}
        selectedToDate={props.selectedToDate}
        stockQuantity={props.stockQuantity}
      />
    )
  }
  if ('variant' in props && props.variant === 'rental_slots') {
    const {
      slotBilling,
      availabilityMap,
      stockQuantity,
      slotIncrementMinutes,
      selectedSlotStartAt,
      selectedSlotEndAt,
      onRentalSlotChange,
    } = props
    const isHourly = slotBilling === 'PER_HOUR'
    return (
      <RentalWeekSlotPicker
        availabilityMap={availabilityMap}
        generateWindows={(dateStr) =>
          isHourly
            ? generateMockRentalHourlyWindows(dateStr, {
                slotIncrementMinutes,
              })
            : generateMockRentalHalfDayWindows(dateStr)
        }
        legendMode={isHourly ? 'hourly' : 'half-day'}
        onRentalSlotChange={onRentalSlotChange}
        selectedSlotEndAt={selectedSlotEndAt}
        selectedSlotStartAt={selectedSlotStartAt}
        stockQuantity={stockQuantity}
        subtitle={
          isHourly
            ? 'Choose a day, then pick a start time window.'
            : 'Choose a day, then pick morning or afternoon.'
        }
        title="Availability"
      />
    )
  }
  return <OpenBookingServiceAvailabilitySection {...props} />
}
