/** Customer event date/time picker — delegates to shared Availability with mode-specific behaviour. */
'use client'

import { useMemo } from 'react'

import { OpenBookingAvailabilitySection } from '@/components/customer/open-booking-availability-section'
import type { CompactAvailabilityDateStripDensity } from '@/components/customer/compact-availability-date-strip'
import {
  isGymSchedulingClassService,
  resolveEventBookingScheduleMode,
  resolveFixedEventSchedule,
  resolveHourlyWindowsForEventDate,
  shouldUseMockOpenAvailabilityForEventSchedule,
} from '@/lib/event-booking-schedule'
import { resolveGymClassHourlyWindowsForEventDate } from '@/lib/gym-class-schedule-availability'
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
  readonly dateStripDensity?: CompactAvailabilityDateStripDensity
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
  dateStripDensity = 'default',
}: Readonly<EventBookingScheduleSectionProps>) {
  const scheduleMode = resolveEventBookingScheduleMode(service)
  const fixedSchedule = useMemo(
    () => resolveFixedEventSchedule(service, slots),
    [service, slots],
  )
  const hourlyWindows = useMemo(() => {
    if (scheduleMode !== EventBookingScheduleModeEnum.PER_HOUR) {
      return null
    }
    if (isGymSchedulingClassService(service)) {
      return resolveGymClassHourlyWindowsForEventDate(service, slots, selectedDate)
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
    if (shouldUseMockOpenAvailabilityForEventSchedule(service, scheduleMode, slots)) {
      return generateOpenAvailabilityForDuration(service, selectedDate, durationMinutes).windows
    }
    return []
  }, [durationMinutes, scheduleMode, selectedDate, service, slots])

  return (
    <OpenBookingAvailabilitySection
      variant="event_schedule"
      scheduleMode={scheduleMode}
      service={service}
      slots={slots}
      selectedDate={selectedDate}
      onSelectedDateChange={onSelectedDateChange}
      selectedToDate={selectedToDate}
      onSelectedToDateChange={onSelectedToDateChange}
      selectedWindow={selectedWindow}
      onSelectedWindowChange={onSelectedWindowChange}
      durationMinutes={durationMinutes}
      fixedSchedule={fixedSchedule}
      hourlyWindows={hourlyWindows}
      dateStripDensity={dateStripDensity}
    />
  )
}
