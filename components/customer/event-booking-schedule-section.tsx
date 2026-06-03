/** Customer event date/time picker — delegates to shared Availability with mode-specific behaviour. */
'use client'

import { useEffect, useMemo, useState } from 'react'

import { OpenBookingAvailabilitySection } from '@/components/customer/open-booking-availability-section'
import {
  resolveEventBookingScheduleMode,
  resolveFixedEventSchedule,
  resolveHourlyWindowsForEventDate,
} from '@/lib/event-booking-schedule'
import { generateOpenAvailabilityForDuration } from '@/lib/mock-data'
import {
  EventBookingScheduleModeEnum,
  type AvailableWindow,
  type SchedulingService,
  type SchedulingSlot,
} from '@/lib/types'

export interface EventBookingScheduleSectionProps {
  readonly service: SchedulingService
  readonly slots: readonly SchedulingSlot[]
  readonly durationMinutes: number
  readonly selectedDate: string
  readonly onSelectedDateChange: (date: string) => void
  readonly selectedToDate: string
  readonly onSelectedToDateChange: (date: string) => void
  readonly selectedWindow: AvailableWindow | null
  readonly onSelectedWindowChange: (window: AvailableWindow | null) => void
}

export function EventBookingScheduleSection({
  service,
  slots,
  durationMinutes,
  selectedDate,
  onSelectedDateChange,
  selectedToDate,
  onSelectedToDateChange,
  selectedWindow,
  onSelectedWindowChange,
}: Readonly<EventBookingScheduleSectionProps>) {
  const scheduleMode = resolveEventBookingScheduleMode(service)
  const fixedSchedule = useMemo(
    () => resolveFixedEventSchedule(service, slots),
    [service, slots],
  )
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    if (scheduleMode !== EventBookingScheduleModeEnum.PER_EVENT || !fixedSchedule) {
      return
    }
    if (selectedDate !== fixedSchedule.dateIso) {
      onSelectedDateChange(fixedSchedule.dateIso)
    }
    if (
      !selectedWindow ||
      selectedWindow.startAt !== fixedSchedule.window.startAt ||
      selectedWindow.endAt !== fixedSchedule.window.endAt
    ) {
      onSelectedWindowChange(fixedSchedule.window)
    }
  }, [
    fixedSchedule,
    onSelectedDateChange,
    onSelectedWindowChange,
    scheduleMode,
    selectedDate,
    selectedWindow,
  ])

  const hourlyWindows = useMemo(() => {
    if (scheduleMode !== EventBookingScheduleModeEnum.PER_HOUR) {
      return null
    }
    const fromSlots = resolveHourlyWindowsForEventDate(
      service,
      slots,
      selectedDate,
      durationMinutes,
    )
    if (fromSlots.length > 0) {
      return fromSlots
    }
    return generateOpenAvailabilityForDuration(service, selectedDate, durationMinutes).windows
  }, [durationMinutes, scheduleMode, selectedDate, service, slots])

  return (
    <OpenBookingAvailabilitySection
      variant="event_schedule"
      scheduleMode={scheduleMode}
      service={service}
      slots={slots}
      weekOffset={weekOffset}
      onWeekOffsetChange={setWeekOffset}
      selectedDate={selectedDate}
      onSelectedDateChange={onSelectedDateChange}
      selectedToDate={selectedToDate}
      onSelectedToDateChange={onSelectedToDateChange}
      selectedWindow={selectedWindow}
      onSelectedWindowChange={onSelectedWindowChange}
      durationMinutes={durationMinutes}
      fixedSchedule={fixedSchedule}
      hourlyWindows={hourlyWindows}
    />
  )
}
