/** PER_HOUR / PER_HALF_DAY rentals — compact date strip + time slot grid. */
'use client'

import { useCallback, useState } from 'react'

import { CompactAvailabilityDateStrip } from '@/components/customer/compact-availability-date-strip'
import {
  formatOpenBookingDateDisplay,
  getOpenBookingTodayIsoDate,
} from '@/components/customer/open-booking-week-ui'
import { OpenBookingTimeWindowGrid } from '@/components/customer/open-booking-time-window-grid'
import {
  resolveRentalAvailabilityDayStatus,
  type AvailabilityCalendarDayStatus,
} from '@/lib/availability-calendar-status'
import type { RentalHalfDayWindow } from '@/lib/rental-calendar-helpers'
import { formatSlotTimeRange } from '@/lib/utils'
import type { AvailableWindow } from '@/lib/types'

type RentalWeekLegendMode = 'hourly' | 'half-day'

interface RentalHalfDayTimeGridProps {
  readonly pickedDay: string
  readonly windows: readonly RentalHalfDayWindow[]
  readonly selectedWindow: AvailableWindow | null
  readonly onRentalSlotChange: (startIso: string, endIso: string) => void
}

function RentalHalfDayTimeGrid({
  pickedDay,
  windows,
  selectedWindow,
  onRentalSlotChange,
}: Readonly<RentalHalfDayTimeGridProps>) {
  const asWindows: AvailableWindow[] = windows.map((h) => ({
    startAt: h.startAt,
    endAt: h.endAt,
    spotsRemaining: h.spotsRemaining,
  }))
  const labelByStart = new Map(windows.map((h) => [h.startAt, h.label]))
  return (
    <OpenBookingTimeWindowGrid
      title="Select a time"
      headline={`Half-day blocks for ${formatOpenBookingDateDisplay(pickedDay)}`}
      windows={asWindows}
      selectedWindow={selectedWindow}
      onSelectedWindowChange={(w) => {
        if (!w) {
          onRentalSlotChange('', '')
          return
        }
        onRentalSlotChange(w.startAt, w.endAt)
      }}
      formatWindowLabel={(w) =>
        labelByStart.get(w.startAt) ?? formatSlotTimeRange(w.startAt, w.endAt)
      }
      slotGridClassName="grid grid-cols-1 gap-2 sm:grid-cols-2"
      slotButtonClassName="text-left text-sm"
    />
  )
}

export interface RentalWeekSlotPickerProps {
  readonly availabilityMap: ReadonlyMap<string, number>
  readonly stockQuantity: number
  readonly title: string
  readonly subtitle: string
  readonly selectedSlotStartAt: string
  readonly selectedSlotEndAt: string
  readonly onRentalSlotChange: (startIso: string, endIso: string) => void
  readonly generateWindows: (
    dateStr: string,
  ) => readonly AvailableWindow[] | readonly RentalHalfDayWindow[]
  readonly legendMode: RentalWeekLegendMode
}

export function RentalWeekSlotPicker({
  availabilityMap,
  stockQuantity,
  title,
  subtitle,
  selectedSlotStartAt,
  selectedSlotEndAt,
  onRentalSlotChange,
  generateWindows,
  legendMode,
}: Readonly<RentalWeekSlotPickerProps>) {
  const [pickedDay, setPickedDay] = useState('')
  const [hourlyRangeAnchorStartAt, setHourlyRangeAnchorStartAt] = useState<string | null>(null)
  const [hourlyAwaitingRangeEnd, setHourlyAwaitingRangeEnd] = useState(false)

  const todayStr = getOpenBookingTodayIsoDate()

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

  const slotWindows = pickedDay ? generateWindows(pickedDay) : []
  const isHourly = legendMode === 'hourly'
  const hourlyWindows = isHourly ? (slotWindows as AvailableWindow[]) : []

  function handleHourlySlotSelection(nextWindow: AvailableWindow): void {
    const anchorWindow = hourlyRangeAnchorStartAt
      ? hourlyWindows.find((w) => w.startAt === hourlyRangeAnchorStartAt) ?? null
      : null
    const isSingleExistingSelection =
      selectedSlotStartAt === nextWindow.startAt && selectedSlotEndAt === nextWindow.endAt

    if (!hourlyAwaitingRangeEnd || !anchorWindow || isSingleExistingSelection) {
      setHourlyRangeAnchorStartAt(nextWindow.startAt)
      setHourlyAwaitingRangeEnd(true)
      onRentalSlotChange(nextWindow.startAt, nextWindow.endAt)
      return
    }

    const anchorIndex = hourlyWindows.findIndex((w) => w.startAt === anchorWindow.startAt)
    const nextIndex = hourlyWindows.findIndex((w) => w.startAt === nextWindow.startAt)

    if (anchorIndex < 0 || nextIndex < 0) {
      setHourlyRangeAnchorStartAt(nextWindow.startAt)
      setHourlyAwaitingRangeEnd(true)
      onRentalSlotChange(nextWindow.startAt, nextWindow.endAt)
      return
    }

    const fromIndex = Math.min(anchorIndex, nextIndex)
    const toIndex = Math.max(anchorIndex, nextIndex)
    const fromSlot = hourlyWindows[fromIndex]
    const toSlot = hourlyWindows[toIndex]

    setHourlyRangeAnchorStartAt(null)
    setHourlyAwaitingRangeEnd(false)
    onRentalSlotChange(fromSlot.startAt, toSlot.endAt)
  }

  const selectedWindow: AvailableWindow | null =
    selectedSlotStartAt && selectedSlotEndAt
      ? {
          startAt: selectedSlotStartAt,
          endAt: selectedSlotEndAt,
          spotsRemaining: 1,
        }
      : null
  const hasSelectedHourlyRange =
    isHourly && selectedSlotStartAt.length > 0 && selectedSlotEndAt.length > 0

  return (
    <section id="rental-dates" className="space-y-6 rounded-xl bg-nav-cream p-4 sm:p-5">
      <p className="text-sm text-muted-foreground">{subtitle}</p>

      <CompactAvailabilityDateStrip
        title={title}
        selectedDate={pickedDay}
        isDateDisabled={isDateDisabled}
        getDateStatus={getDateStatus}
        onDayClick={(date) => {
          setPickedDay(date)
          setHourlyRangeAnchorStartAt(null)
          setHourlyAwaitingRangeEnd(false)
          onRentalSlotChange('', '')
        }}
      />

      {pickedDay && isHourly ? (
        <OpenBookingTimeWindowGrid
          title="Select a time"
          headline={`Times for ${formatOpenBookingDateDisplay(pickedDay)}`}
          windows={hourlyWindows}
          selectedWindow={selectedWindow}
          showTimeRange
          isWindowSelected={(window) => {
            if (!hasSelectedHourlyRange) {
              return false
            }
            return window.startAt >= selectedSlotStartAt && window.endAt <= selectedSlotEndAt
          }}
          onSelectedWindowChange={(w) => {
            if (!w) {
              setHourlyRangeAnchorStartAt(null)
              setHourlyAwaitingRangeEnd(false)
              onRentalSlotChange('', '')
              return
            }
            handleHourlySlotSelection(w)
          }}
        />
      ) : null}
      {pickedDay && !isHourly ? (
        <RentalHalfDayTimeGrid
          pickedDay={pickedDay}
          windows={slotWindows as RentalHalfDayWindow[]}
          selectedWindow={selectedWindow}
          onRentalSlotChange={onRentalSlotChange}
        />
      ) : null}
      {!pickedDay ? (
        <p className="text-sm text-muted-foreground">Select a day above to see time options.</p>
      ) : null}
    </section>
  )
}
