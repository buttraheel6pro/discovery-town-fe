/** Open booking, private hire, rental, and event-schedule availability — shared entry. */
'use client'

import { useEffect, useMemo, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  RentalPerDayCalendarSection,
  type RentalPerDayCalendarSectionProps,
} from '@/components/customer/rental-per-day-calendar-section'
import { RentalWeekSlotPicker } from '@/components/customer/rental-week-slot-picker'
import {
  OpenBookingAvailabilitySlotLegend,
  OpenBookingTimeWindowGrid,
} from '@/components/customer/open-booking-time-window-grid'
import {
  formatOpenBookingDateDisplay,
  getOpenBookingTodayIsoDate,
  getOpenBookingWeekDatesFromOffset,
  OpenBookingWeekDayButtonGrid,
  OpenBookingWeekToolbar,
  type OpenBookingWeekDayVisual,
} from '@/components/customer/open-booking-week-ui'
import {
  buildDayRangeBookingWindow,
  buildEventDayAvailabilityMap,
  countEventPerDaySessionDaysInRange,
  getDistinctSessionDatesForService,
  getFirstUpcomingSessionYmdForService,
  getEventBookingScheduleAvailabilitySubtitle,
  isEventPerDayDateSelectable,
  resolveDistinctEventPerEventSessionTimes,
  shouldShowEventDayRangePicker,
  type FixedEventScheduleDisplay,
} from '@/lib/event-booking-schedule'
import {
  generateMockRentalHalfDayWindows,
  generateMockRentalHourlyWindows,
} from '@/lib/rental-calendar-helpers'
import { generateOpenAvailabilityForDuration } from '@/lib/mock-data'
import {
  resolveSlotIncrementMinutes,
} from '@/lib/open-booking-slot-windows'
import { formatRentalLongDate } from '@/lib/rental-calendar-helpers'
import { getWeekOffsetForYmd } from '@/lib/ymd-date'
import { cn, formatAvailabilityWindowLabel, formatDurationLabel } from '@/lib/utils'
import {
  EventBookingScheduleModeEnum,
  type AvailableWindow,
  type EventBookingScheduleMode,
  type SchedulingService,
  type SchedulingSlot,
} from '@/lib/types'

const AVAILABILITY_TITLE = 'Availability'

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

export type OpenBookingEventScheduleVariantProps = Readonly<{
  readonly variant: 'event_schedule'
  readonly scheduleMode: EventBookingScheduleMode
  readonly service: SchedulingService
  readonly slots: readonly SchedulingSlot[]
  readonly weekOffset: number
  readonly onWeekOffsetChange: (offset: number) => void
  readonly selectedDate: string
  readonly onSelectedDateChange: (dateStr: string) => void
  readonly selectedToDate: string
  readonly onSelectedToDateChange: (dateStr: string) => void
  readonly selectedWindow: AvailableWindow | null
  readonly onSelectedWindowChange: (window: AvailableWindow | null) => void
  readonly durationMinutes: number
  readonly fixedSchedule: FixedEventScheduleDisplay | null
  readonly hourlyWindows: readonly AvailableWindow[] | null
}>

export type OpenBookingAvailabilitySectionProps =
  | OpenBookingServiceAvailabilitySectionProps
  | OpenBookingRentalPerDayVariantProps
  | OpenBookingRentalSlotsVariantProps
  | OpenBookingEventScheduleVariantProps

function OpenBookingEventScheduleAvailabilitySection({
  scheduleMode,
  service,
  slots,
  weekOffset,
  onWeekOffsetChange,
  selectedDate,
  onSelectedDateChange,
  selectedToDate,
  onSelectedToDateChange,
  selectedWindow,
  onSelectedWindowChange,
  fixedSchedule,
  hourlyWindows,
}: Readonly<OpenBookingEventScheduleVariantProps>) {
  const todayStr = getOpenBookingTodayIsoDate()
  const weekDates = useMemo(
    () => getOpenBookingWeekDatesFromOffset(weekOffset),
    [weekOffset],
  )
  const slotIncrementMinutes = resolveSlotIncrementMinutes(service)
  const isPerEvent = scheduleMode === EventBookingScheduleModeEnum.PER_EVENT
  const isPerDay = scheduleMode === EventBookingScheduleModeEnum.PER_DAY
  const isPerHour = scheduleMode === EventBookingScheduleModeEnum.PER_HOUR

  const sessionDates = useMemo(
    () => new Set(getDistinctSessionDatesForService(slots, service)),
    [service, slots],
  )
  const perEventWeekInitRef = useRef<string | null>(null)
  const firstUpcomingSessionDate = useMemo(
    () => getFirstUpcomingSessionYmdForService(slots, service, todayStr),
    [service, slots, todayStr],
  )

  useEffect(() => {
    perEventWeekInitRef.current = null
  }, [service.id])

  useEffect(() => {
    if (!isPerEvent || !firstUpcomingSessionDate) {
      return
    }
    if (perEventWeekInitRef.current === service.id) {
      return
    }
    onWeekOffsetChange(getWeekOffsetForYmd(firstUpcomingSessionDate))
    perEventWeekInitRef.current = service.id
  }, [firstUpcomingSessionDate, isPerEvent, onWeekOffsetChange, service.id])
  const availabilityMap = useMemo(
    () => buildEventDayAvailabilityMap(slots, service.id, service.capacity),
    [service.capacity, service.id, slots],
  )
  const showDayRangePicker = shouldShowEventDayRangePicker(
    EventBookingScheduleModeEnum.PER_DAY,
    slots,
    service,
  )
  const weekSessionDates = useMemo(
    () => weekDates.filter((dateStr) => sessionDates.has(dateStr)),
    [sessionDates, weekDates],
  )
  const sessionTimeBlocks = useMemo(() => {
    if (!isPerEvent) {
      return []
    }
    const fromSlots = resolveDistinctEventPerEventSessionTimes(service, slots)
    if (fromSlots.length > 0) {
      return fromSlots
    }
    if (fixedSchedule != null) {
      return [
        {
          timeLabel: fixedSchedule.timeLabel,
          window: fixedSchedule.window,
        },
      ]
    }
    return []
  }, [fixedSchedule, isPerEvent, service, slots])

  const from = selectedDate.trim()
  const to = selectedToDate.trim()
  const rangeComplete = from.length > 0 && to.length > 0 && from <= to
  const sessionDayCount =
    isPerDay && rangeComplete && showDayRangePicker
      ? countEventPerDaySessionDaysInRange(availabilityMap, todayStr, from, to)
      : 0

  const subtitle = getEventBookingScheduleAvailabilitySubtitle(
    scheduleMode,
    showDayRangePicker,
  )

  function isPerDayDateDisabled(dateStr: string): boolean {
    return !isEventPerDayDateSelectable(availabilityMap, dateStr, todayStr)
  }

  function isPerEventDateWithoutSession(dateStr: string): boolean {
    return dateStr < todayStr || !sessionDates.has(dateStr)
  }

  function isPerHourDateDisabled(dateStr: string): boolean {
    return dateStr < todayStr
  }

  function applyPerDaySelection(fromDate: string, toDate: string): void {
    onSelectedDateChange(fromDate)
    onSelectedToDateChange(toDate)
    onSelectedWindowChange(buildDayRangeBookingWindow(fromDate, toDate, service.capacity))
  }

  function onPerDayPickSingle(day: string): void {
    if (isPerDayDateDisabled(day)) {
      return
    }
    applyPerDaySelection(day, day)
  }

  function onPerDayPickRange(day: string): void {
    if (isPerDayDateDisabled(day)) {
      return
    }

    const rangeDone = from.length > 0 && to.length > 0 && from !== to

    if (!from || rangeDone) {
      applyPerDaySelection(day, day)
      return
    }

    if (day === from) {
      applyPerDaySelection(day, day)
      return
    }

    const nextFrom = day < from ? day : from
    const nextTo = day < from ? from : day
    applyPerDaySelection(nextFrom, nextTo)
  }

  const dayGridIsDateDisabled = (dateStr: string): boolean => {
    if (isPerEvent) {
      return isPerEventDateWithoutSession(dateStr)
    }
    if (isPerDay) {
      return isPerDayDateDisabled(dateStr)
    }
    return isPerHourDateDisabled(dateStr)
  }

  function handleDayClick(date: string): void {
    if (isPerEvent) {
      return
    }
    if (isPerDay) {
      if (showDayRangePicker) {
        onPerDayPickRange(date)
      } else {
        onPerDayPickSingle(date)
      }
      return
    }
    onSelectedDateChange(date)
    onSelectedWindowChange(null)
  }

  const hourAvailability =
    isPerHour && hourlyWindows != null
      ? {
          date: selectedDate,
          serviceId: service.id,
          windows: [...hourlyWindows],
          operatingHours: { open: '08:00', close: '21:00' },
        }
      : null

  function getEventScheduleDayVisual(dateStr: string): OpenBookingWeekDayVisual | undefined {
    if (isPerEvent) {
      const withoutSession = isPerEventDateWithoutSession(dateStr)
      const hasSession = sessionDates.has(dateStr) && !withoutSession
      return {
        className: cn(
          'flex flex-col items-center rounded-lg border px-1 py-3 text-xs font-semibold transition-colors',
          withoutSession &&
            'cursor-not-allowed border-border bg-muted text-muted-foreground opacity-40',
          hasSession &&
            'cursor-default border-accent bg-accent/15 text-accent-foreground opacity-100',
        ),
        'aria-pressed': hasSession,
      }
    }
    if (isPerDay && showDayRangePicker) {
      const disabled = isPerDayDateDisabled(dateStr)
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
    }
    return undefined
  }

  const eventScheduleSelectedDate = ((): string | null => {
    if (isPerEvent) {
      return null
    }
    if (isPerDay && showDayRangePicker) {
      return null
    }
    return selectedDate
  })()

  const usesCustomDayVisual = isPerEvent || (isPerDay && showDayRangePicker)

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">{AVAILABILITY_TITLE}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{subtitle}</p>

      <OpenBookingWeekToolbar
        weekOffset={weekOffset}
        onWeekOffsetChange={onWeekOffsetChange}
        weekDates={weekDates}
        disablePrevPastCurrentWeek={isPerEvent ? false : undefined}
      />

      <OpenBookingWeekDayButtonGrid
        weekDates={weekDates}
        isDateDisabled={dayGridIsDateDisabled}
        onDayClick={handleDayClick}
        interactionDisabled={isPerEvent}
        selectedDate={eventScheduleSelectedDate}
        getDayVisual={usesCustomDayVisual ? getEventScheduleDayVisual : undefined}
      />

      {isPerDay && showDayRangePicker && rangeComplete ? (
        <p className="mb-4 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
          {formatRentalLongDate(from)} – {formatRentalLongDate(to)}
          {' · '}
          {sessionDayCount} session day
          {sessionDayCount !== 1 ? 's' : ''}
        </p>
      ) : null}

      {isPerDay && !showDayRangePicker && selectedDate ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Selected: {formatOpenBookingDateDisplay(selectedDate)}
        </p>
      ) : null}

      {isPerHour && hourAvailability ? (
        hourAvailability.windows.length > 0 ? (
          <OpenBookingTimeWindowGrid
            headline={`Available times for ${formatOpenBookingDateDisplay(selectedDate)}`}
            windows={hourAvailability.windows}
            selectedWindow={selectedWindow}
            onSelectedWindowChange={onSelectedWindowChange}
            formatWindowLabel={(window) =>
              formatAvailabilityWindowLabel(window, slotIncrementMinutes)
            }
            slotGridClassName={
              slotIncrementMinutes == null
                ? 'grid grid-cols-1 gap-2 sm:grid-cols-2'
                : undefined
            }
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            No times available on this day. Choose another date in the week above.
          </p>
        )
      ) : null}

      {isPerEvent && sessionTimeBlocks.length > 0 ? (
        <div>
          <p className="mb-3 text-sm font-semibold text-muted-foreground">Session time</p>
          <div
            className={cn(
              'grid gap-2',
              sessionTimeBlocks.length === 1
                ? 'max-w-xs grid-cols-1'
                : 'grid-cols-1 sm:grid-cols-2',
            )}
          >
            {sessionTimeBlocks.map((block) => (
              <button
                key={block.timeLabel}
                type="button"
                disabled
                className="cursor-not-allowed rounded-lg border border-accent/40 bg-accent/10 py-2.5 text-sm font-semibold text-foreground opacity-100"
                aria-label={`Session time: ${block.timeLabel}`}
              >
                {block.timeLabel}
              </button>
            ))}
          </div>
          <OpenBookingAvailabilitySlotLegend interactionDisabled />
        </div>
      ) : null}

      {isPerEvent && weekSessionDates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {sessionDates.size > 0
            ? 'No camp days in this week. Use the arrows to browse other weeks.'
            : 'No scheduled sessions this week. Use the arrows to view other weeks.'}
        </p>
      ) : null}
    </section>
  )
}

function OpenBookingServiceAvailabilitySection({
  title = AVAILABILITY_TITLE,
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
  const slotIncrementMinutes = resolveSlotIncrementMinutes(service)

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
    return generateOpenAvailabilityForDuration(service, selectedDate, durationMinutes)
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
            formatWindowLabel={(window) =>
              formatAvailabilityWindowLabel(window, slotIncrementMinutes)
            }
            slotGridClassName={
              slotIncrementMinutes == null
                ? 'grid grid-cols-1 gap-2 sm:grid-cols-2'
                : undefined
            }
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
  if ('variant' in props && props.variant === 'event_schedule') {
    return <OpenBookingEventScheduleAvailabilitySection {...props} />
  }
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
