/** Open booking, private hire, rental, and event-schedule availability — shared entry. */
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { LearnProgramEnrollmentSummaryCard } from '@/components/customer/learn-program-enrollment-summary-card'
import {
  RentalPerDayCalendarSection,
  type RentalPerDayCalendarSectionProps,
} from '@/components/customer/rental-per-day-calendar-section'
import { RentalWeekSlotPicker } from '@/components/customer/rental-week-slot-picker'
import {
  CompactAvailabilityDateStrip,
  type CompactAvailabilityDateStripDensity,
} from '@/components/customer/compact-availability-date-strip'
import {
  OpenBookingAvailabilitySlotLegend,
  OpenBookingTimeWindowGrid,
} from '@/components/customer/open-booking-time-window-grid'
import {
  formatOpenBookingDateDisplay,
  getOpenBookingTodayIsoDate,
} from '@/components/customer/open-booking-week-ui'
import {
  resolveAvailabilityCalendarDayStatus,
  type AvailabilityCalendarDayStatus,
} from '@/lib/availability-calendar-status'
import {
  buildEventDayAvailabilityMap,
  countEventPerDaySessionDaysInRange,
  eventAvailabilityRequiresAdminSessions,
  eventBookingScheduleRequiresTimeSelection,
  findFirstBookableSlotOnEventDate,
  getDistinctSessionDatesForService,
  getFirstUpcomingSessionYmdForService,
  getEventBookingScheduleAvailabilitySubtitle,
  isEventPerDayDateSelectable,
  isGymSchedulingClassService,
  isLearnSchedulingClassService,
  isScheduledAdminSessionService,
  resolveDistinctEventPerEventSessionTimes,
  resolvePerDayBookingWindow,
  shouldShowEventDayRangePicker,
  type FixedEventScheduleDisplay,
} from '@/lib/event-booking-schedule'
import {
  buildLearnProgramEnrollmentWindow,
  resolveLearnProgramBounds,
  resolveLearnProgramStartDayWindows,
  usesLearnFullProgramEnrollment,
} from '@/lib/learn-enrollment'
import { getGymClassSessionDatesFromSchedule } from '@/lib/gym-class-schedule-availability'
import { isSpecialPlayEventCatalogService } from '@/lib/scheduling-slot-availability'
import {
  generateMockRentalHalfDayWindows,
  generateMockRentalHourlyWindows,
} from '@/lib/rental-calendar-helpers'
import { generateOpenAvailabilityForDuration } from '@/lib/mock-data'
import {
  resolveSlotIncrementMinutes,
} from '@/lib/open-booking-slot-windows'
import { formatRentalLongDate } from '@/lib/rental-calendar-helpers'
import { cn, formatAvailabilityWindowLabel, formatDurationLabel, areAvailableWindowsEqual } from '@/lib/utils'
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
  readonly selectedDate: string
  readonly onSelectedDateChange: (dateStr: string) => void
  readonly selectedToDate: string
  readonly onSelectedToDateChange: (dateStr: string) => void
  readonly selectedWindow: AvailableWindow | null
  readonly onSelectedWindowChange: (window: AvailableWindow | null) => void
  readonly durationMinutes: number
  readonly fixedSchedule: FixedEventScheduleDisplay | null
  readonly hourlyWindows: readonly AvailableWindow[] | null
  readonly dateStripDensity?: CompactAvailabilityDateStripDensity
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
  selectedDate,
  onSelectedDateChange,
  selectedToDate,
  onSelectedToDateChange,
  selectedWindow,
  onSelectedWindowChange,
  fixedSchedule,
  hourlyWindows,
  dateStripDensity = 'default',
}: Readonly<OpenBookingEventScheduleVariantProps>) {
  const todayStr = getOpenBookingTodayIsoDate()
  const slotIncrementMinutes = resolveSlotIncrementMinutes(service)
  const isPerEvent = scheduleMode === EventBookingScheduleModeEnum.PER_EVENT
  const isPerDay = scheduleMode === EventBookingScheduleModeEnum.PER_DAY
  const isPerHour = scheduleMode === EventBookingScheduleModeEnum.PER_HOUR
  const learnFullProgramEnrollment = usesLearnFullProgramEnrollment(service)
  const learnProgramBounds = useMemo(
    () => (learnFullProgramEnrollment ? resolveLearnProgramBounds(service, slots) : null),
    [learnFullProgramEnrollment, service, slots],
  )
  const learnProgramStartDayWindows = useMemo(
    () =>
      learnFullProgramEnrollment
        ? resolveLearnProgramStartDayWindows(service, slots)
        : [],
    [learnFullProgramEnrollment, service, slots],
  )
  const [learnStartDayWindow, setLearnStartDayWindow] = useState<AvailableWindow | null>(null)

  const sessionDates = useMemo(() => {
    if (isGymSchedulingClassService(service)) {
      return new Set(getGymClassSessionDatesFromSchedule(service, todayStr))
    }
    return new Set(getDistinctSessionDatesForService(slots, service))
  }, [service, slots, todayStr])
  const sessionInitRef = useRef<string | null>(null)
  const adminSessionsRequired = eventAvailabilityRequiresAdminSessions(service, scheduleMode)
  const firstUpcomingSessionDate = useMemo(
    () => getFirstUpcomingSessionYmdForService(slots, service, todayStr),
    [service, slots, todayStr],
  )

  useEffect(() => {
    sessionInitRef.current = null
    setLearnStartDayWindow(null)
  }, [service.id])

  useEffect(() => {
    if (!learnFullProgramEnrollment) {
      return
    }
    if (selectedWindow == null) {
      setLearnStartDayWindow(null)
    }
  }, [learnFullProgramEnrollment, selectedWindow])

  useEffect(() => {
    if (!learnFullProgramEnrollment) {
      return
    }
    const bounds = resolveLearnProgramBounds(service, slots)
    if (!bounds) {
      return
    }
    if (sessionInitRef.current === service.id) {
      return
    }
    onSelectedDateChange(bounds.startYmd)
    onSelectedToDateChange(bounds.endYmd)

    const startDayWindows = resolveLearnProgramStartDayWindows(service, slots)
    if (startDayWindows.length === 1) {
      setLearnStartDayWindow(startDayWindows[0])
      onSelectedWindowChange(buildLearnProgramEnrollmentWindow(service, slots))
    } else {
      onSelectedWindowChange(null)
      setLearnStartDayWindow(null)
    }
    sessionInitRef.current = service.id
  }, [
    learnFullProgramEnrollment,
    onSelectedDateChange,
    onSelectedToDateChange,
    onSelectedWindowChange,
    service,
    slots,
  ])

  useEffect(() => {
    const shouldSnapToFirstSession =
      !learnFullProgramEnrollment &&
      (isPerHour ||
        isPerEvent ||
        (isPerDay && adminSessionsRequired))
    if (!shouldSnapToFirstSession || sessionDates.size === 0 || !firstUpcomingSessionDate) {
      return
    }
    if (sessionInitRef.current === service.id) {
      return
    }
    if (!selectedDate || !sessionDates.has(selectedDate) || selectedDate < todayStr) {
      onSelectedDateChange(firstUpcomingSessionDate)
      if (isPerDay) {
        const window = resolvePerDayBookingWindow(
          slots,
          service,
          firstUpcomingSessionDate,
          firstUpcomingSessionDate,
        )
        onSelectedToDateChange(firstUpcomingSessionDate)
        onSelectedWindowChange(window)
      } else if (isPerEvent) {
        const slot = findFirstBookableSlotOnEventDate(slots, service, firstUpcomingSessionDate)
        if (slot) {
          const capacity = slot.effectiveCapacity ?? service.capacity
          onSelectedWindowChange({
            startAt: slot.startAt,
            endAt: slot.endAt,
            spotsRemaining: Math.max(0, capacity - (slot.bookedCount ?? 0)),
          })
        } else {
          onSelectedWindowChange(null)
        }
      } else {
        onSelectedWindowChange(null)
      }
    }
    sessionInitRef.current = service.id
  }, [
    adminSessionsRequired,
    firstUpcomingSessionDate,
    isPerDay,
    isPerEvent,
    isPerHour,
    learnFullProgramEnrollment,
    onSelectedDateChange,
    onSelectedToDateChange,
    onSelectedWindowChange,
    selectedDate,
    service,
    sessionDates,
    slots,
    todayStr,
  ])

  useEffect(() => {
    if (!learnFullProgramEnrollment || learnProgramStartDayWindows.length !== 1) {
      return
    }
    const onlyWindow = learnProgramStartDayWindows[0]
    if (areAvailableWindowsEqual(learnStartDayWindow, onlyWindow)) {
      return
    }
    setLearnStartDayWindow(onlyWindow)
    onSelectedWindowChange(buildLearnProgramEnrollmentWindow(service, slots))
  }, [
    learnFullProgramEnrollment,
    learnProgramStartDayWindows,
    learnStartDayWindow,
    onSelectedWindowChange,
    service,
    slots,
  ])

  const availabilityMap = useMemo(
    () => buildEventDayAvailabilityMap(slots, service.id, service.capacity),
    [service.capacity, service.id, slots],
  )
  const showDayRangePicker = shouldShowEventDayRangePicker(scheduleMode, slots, service)
  const sessionTimeBlocks = useMemo(() => {
    if (!isPerEvent) {
      return []
    }
    const dateFilter =
      selectedDate.trim().length > 0 && sessionDates.has(selectedDate.trim())
        ? selectedDate.trim()
        : undefined
    const fromSlots = resolveDistinctEventPerEventSessionTimes(service, slots, dateFilter)
    if (fromSlots.length > 0) {
      return fromSlots
    }
    if (!isScheduledAdminSessionService(service) && fixedSchedule != null) {
      return [
        {
          timeLabel: fixedSchedule.timeLabel,
          window: fixedSchedule.window,
        },
      ]
    }
    return []
  }, [fixedSchedule, isPerEvent, selectedDate, service, sessionDates, slots])

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
    if (dateStr < todayStr) {
      return true
    }
    if (adminSessionsRequired) {
      return !sessionDates.has(dateStr)
    }
    if (sessionDates.size > 0 && !sessionDates.has(dateStr)) {
      return true
    }
    return false
  }

  function applyPerDaySelection(fromDate: string, toDate: string): void {
    onSelectedDateChange(fromDate)
    onSelectedToDateChange(toDate)
    const window =
      resolvePerDayBookingWindow(slots, service, fromDate, toDate) ??
      null
    onSelectedWindowChange(window)
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
    if (learnFullProgramEnrollment) {
      return
    }
    if (isPerEvent) {
      if (isPerEventDateWithoutSession(date)) {
        return
      }
      onSelectedDateChange(date)
      const slot = findFirstBookableSlotOnEventDate(slots, service, date)
      if (slot) {
        const capacity = slot.effectiveCapacity ?? service.capacity
        onSelectedWindowChange({
          startAt: slot.startAt,
          endAt: slot.endAt,
          spotsRemaining: Math.max(0, capacity - (slot.bookedCount ?? 0)),
        })
      } else {
        onSelectedWindowChange(null)
      }
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

  const showTimeSelection = eventBookingScheduleRequiresTimeSelection(scheduleMode)
  const hourAvailability =
    showTimeSelection && isPerHour && hourlyWindows != null
      ? {
          date: selectedDate,
          serviceId: service.id,
          windows: [...hourlyWindows],
          operatingHours: { open: '08:00', close: '21:00' },
        }
      : null

  useEffect(() => {
    if (!showTimeSelection || !isPerHour || hourAvailability == null) {
      return
    }

    const windows = hourAvailability.windows
    if (windows.length === 0) {
      return
    }

    if (windows.length === 1) {
      const onlyWindow = windows[0]
      if (!areAvailableWindowsEqual(selectedWindow, onlyWindow)) {
        onSelectedWindowChange(onlyWindow)
      }
      return
    }

    if (selectedWindow != null) {
      const stillValid = windows.some((window) =>
        areAvailableWindowsEqual(window, selectedWindow),
      )
      if (!stillValid) {
        onSelectedWindowChange(null)
      }
    }
  }, [
    hourAvailability,
    isPerHour,
    onSelectedWindowChange,
    selectedWindow,
    showTimeSelection,
  ])

  const showSubtitle =
    !isGymSchedulingClassService(service) &&
    !isLearnSchedulingClassService(service) &&
    !isSpecialPlayEventCatalogService(service)

  const getCompactDateStatus = useCallback(
    (dateStr: string): AvailabilityCalendarDayStatus => {
      if (learnFullProgramEnrollment && learnProgramBounds) {
        const isStartDay = dateStr === learnProgramBounds.startYmd
        return resolveAvailabilityCalendarDayStatus(
          dateStr,
          todayStr,
          isStartDay,
          isStartDay ? service.capacity : undefined,
        )
      }
      const hasSession = adminSessionsRequired
        ? sessionDates.has(dateStr) && dateStr >= todayStr
        : sessionDates.size === 0
          ? dateStr >= todayStr
          : sessionDates.has(dateStr) && dateStr >= todayStr
      const remaining = availabilityMap.get(dateStr)
      return resolveAvailabilityCalendarDayStatus(
        dateStr,
        todayStr,
        hasSession,
        remaining,
      )
    },
    [adminSessionsRequired, availabilityMap, learnFullProgramEnrollment, learnProgramBounds, service.capacity, sessionDates, todayStr],
  )

  useEffect(() => {
    if (learnFullProgramEnrollment || showTimeSelection || !isPerEvent) {
      return
    }
    if (sessionTimeBlocks.length !== 1) {
      if (selectedWindow != null && sessionTimeBlocks.length > 1) {
        const stillValid = sessionTimeBlocks.some((block) =>
          areAvailableWindowsEqual(block.window, selectedWindow),
        )
        if (!stillValid) {
          onSelectedWindowChange(null)
        }
      }
      return
    }
    const onlyWindow = sessionTimeBlocks[0].window
    if (!areAvailableWindowsEqual(selectedWindow, onlyWindow)) {
      onSelectedWindowChange(onlyWindow)
    }
  }, [
    isPerEvent,
    learnFullProgramEnrollment,
    onSelectedWindowChange,
    selectedWindow,
    sessionTimeBlocks,
    showTimeSelection,
  ])

  function handleLearnStartDayWindowChange(window: AvailableWindow | null): void {
    if (!window) {
      setLearnStartDayWindow(null)
      onSelectedWindowChange(null)
      return
    }
    const matchedWindow =
      learnProgramStartDayWindows.find((entry) => areAvailableWindowsEqual(entry, window)) ??
      window
    setLearnStartDayWindow(matchedWindow)
    const programWindow = buildLearnProgramEnrollmentWindow(service, slots)
    onSelectedWindowChange(programWindow)
  }

  function isLearnDateDisabled(dateStr: string): boolean {
    if (!learnProgramBounds) {
      return true
    }
    return dateStr !== learnProgramBounds.startYmd
  }

  return (
    <section>
      {learnFullProgramEnrollment ? (
        learnProgramBounds ? (
        <>
          <LearnProgramEnrollmentSummaryCard service={service} slots={slots} />
          <CompactAvailabilityDateStrip
            title={AVAILABILITY_TITLE}
            selectedDate={learnProgramBounds.startYmd}
            isDateDisabled={isLearnDateDisabled}
            onDayClick={() => undefined}
            getDateStatus={getCompactDateStatus}
            density={dateStripDensity}
          />
          {learnProgramStartDayWindows.length > 0 ? (
            <OpenBookingTimeWindowGrid
              headline={`Select a time on ${formatOpenBookingDateDisplay(learnProgramBounds.startYmd)}`}
              windows={learnProgramStartDayWindows}
              selectedWindow={learnStartDayWindow}
              onSelectedWindowChange={handleLearnStartDayWindowChange}
              isWindowSelected={(window) => areAvailableWindowsEqual(learnStartDayWindow, window)}
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
              No sessions on the program start date. Contact reception for assistance.
            </p>
          )}
        </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No upcoming sessions are scheduled for this program yet.
          </p>
        )
      ) : (
        <>
      {showSubtitle ? (
        <p className="mb-2 text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
      <CompactAvailabilityDateStrip
        title={AVAILABILITY_TITLE}
        selectedDate={selectedDate}
        selectedToDate={selectedToDate}
        selectionMode={showDayRangePicker ? 'range' : 'single'}
        isDateDisabled={dayGridIsDateDisabled}
        onDayClick={handleDayClick}
        getDateStatus={getCompactDateStatus}
        density={dateStripDensity}
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

      {showTimeSelection && isPerHour && hourAvailability ? (
        hourAvailability.windows.length > 0 ? (
          <OpenBookingTimeWindowGrid
            headline={`Available times for ${formatOpenBookingDateDisplay(selectedDate)}`}
            windows={hourAvailability.windows}
            selectedWindow={selectedWindow}
            onSelectedWindowChange={(window) => {
              if (!window) {
                onSelectedWindowChange(null)
                return
              }
              const matched =
                hourAvailability.windows.find((entry) => areAvailableWindowsEqual(entry, window)) ??
                window
              onSelectedWindowChange(matched)
            }}
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
            No times available on this day. Choose another date above.
          </p>
        )
      ) : null}

      {!showTimeSelection && isPerEvent && sessionTimeBlocks.length > 0 ? (
        <OpenBookingTimeWindowGrid
          headline="Session time"
          windows={sessionTimeBlocks.map((block) => block.window)}
          selectedWindow={selectedWindow}
          onSelectedWindowChange={onSelectedWindowChange}
          formatWindowLabel={(window) => {
            const block = sessionTimeBlocks.find((entry) =>
              areAvailableWindowsEqual(entry.window, window),
            )
            return block?.timeLabel ?? formatAvailabilityWindowLabel(window, slotIncrementMinutes)
          }}
          slotGridClassName={cn(
            'grid grid-cols-1 gap-2',
            sessionTimeBlocks.length > 1 && 'sm:grid-cols-2',
          )}
        />
      ) : null}

      {isPerEvent && sessionDates.size === 0 ? (
        <p className="text-sm text-muted-foreground">
          No scheduled sessions available. Open the calendar to browse other dates.
        </p>
      ) : null}
        </>
      )}
    </section>
  )
}

function OpenBookingServiceAvailabilitySection({
  title = AVAILABILITY_TITLE,
  service,
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

  const getCompactDateStatus = useCallback(
    (dateStr: string): AvailabilityCalendarDayStatus =>
      resolveAvailabilityCalendarDayStatus(dateStr, todayStr, !isDateOutOfRange(dateStr), undefined),
    [maxAdvanceDate, todayStr],
  )

  return (
    <section>
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

      <CompactAvailabilityDateStrip
        title={title}
        selectedDate={selectedDate}
        isDateDisabled={isDateOutOfRange}
        getDateStatus={getCompactDateStatus}
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
            No times available on this day. Choose another date above.
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
