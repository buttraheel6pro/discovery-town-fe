/** Shared week strip, time grid, duration pills, and legend for open booking & private hire. */
'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { generateOpenAvailability, generateOpenAvailabilityForDuration } from '@/lib/mock-data'
import { cn, formatDurationLabel, formatSlotTime, formatSlotTimeRange } from '@/lib/utils'
import type { AvailableWindow, SchedulingService } from '@/lib/types'

function formatDateDisplay(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function getWeekDates(baseDate: Date) {
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate)
    d.setDate(baseDate.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

export type OpenBookingAvailabilityMode = 'facility' | 'private_hire'

export interface OpenBookingAvailabilitySectionProps {
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
}

export function OpenBookingAvailabilitySection({
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
}: Readonly<OpenBookingAvailabilitySectionProps>) {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const baseDate = new Date(today)
  baseDate.setDate(today.getDate() + weekOffset * 7)
  const weekDates = getWeekDates(baseDate)

  const availability = (() => {
    if (mode === 'private_hire' && !availabilityChecked) return null
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
      <h2 className="text-xl font-bold mb-4">{title}</h2>

      {mode === 'private_hire' && durationOptions.length > 0 ? (
        <div className="space-y-2 mb-6">
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

      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          type="button"
          onClick={() => onWeekOffsetChange(Math.max(0, weekOffset - 1))}
          disabled={weekOffset === 0}
          aria-label="Previous week"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-semibold text-muted-foreground">
          {formatDateDisplay(weekDates[0])} – {formatDateDisplay(weekDates[6])}
        </span>
        <Button
          variant="outline"
          size="icon"
          type="button"
          onClick={() => onWeekOffsetChange(weekOffset + 1)}
          aria-label="Next week"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-6">
        {weekDates.map((date) => {
          const d = new Date(`${date}T12:00:00`)
          const isSelected = date === selectedDate
          const disabled = isDateOutOfRange(date)
          return (
            <button
              key={date}
              type="button"
              onClick={() => {
                if (disabled) return
                onSelectedDateChange(date)
                onSelectedWindowChange(null)
                if (mode === 'private_hire') {
                  onResetAvailabilityCheck?.()
                }
              }}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center py-3 px-1 rounded-lg text-xs font-semibold transition-colors border',
                isSelected && 'bg-accent text-accent-foreground border-accent',
                !isSelected &&
                  !disabled &&
                  'bg-card text-muted-foreground border-border hover:bg-secondary hover:text-foreground',
                disabled && 'bg-muted text-muted-foreground border-border opacity-40 cursor-not-allowed',
              )}
              aria-pressed={isSelected}
            >
              <span className="text-[10px] uppercase tracking-wider">
                {d.toLocaleDateString('en-GB', { weekday: 'short' })}
              </span>
              <span className="text-base mt-0.5">{d.getDate()}</span>
            </button>
          )
        })}
      </div>

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
        <>
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-sm font-semibold text-muted-foreground">
              Available times for {formatDateDisplay(selectedDate)}
            </p>
            {mode === 'private_hire' && availabilityChecked && onResetAvailabilityCheck ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground shrink-0"
                onClick={onResetAvailabilityCheck}
              >
                Reset
              </Button>
            ) : null}
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {availability.windows.map((w) => {
              const disabled = w.spotsRemaining <= 0
              const isSelected =
                selectedWindow?.startAt === w.startAt && selectedWindow?.endAt === w.endAt
              return (
                <button
                  key={`${w.startAt}-${w.endAt}`}
                  type="button"
                  onClick={() => {
                    if (disabled) return
                    onSelectedWindowChange(isSelected ? null : w)
                  }}
                  disabled={disabled}
                  className={cn(
                    'py-2.5 text-xs font-semibold rounded-lg border transition-colors',
                    disabled &&
                      'bg-muted text-muted-foreground border-border cursor-not-allowed line-through opacity-50',
                    !disabled &&
                      !isSelected &&
                      'bg-card text-foreground border-border hover:bg-secondary',
                    !disabled && isSelected && 'bg-accent text-accent-foreground border-accent',
                  )}
                  aria-pressed={isSelected}
                  aria-disabled={disabled}
                >
                  {showTimeRange
                    ? formatSlotTimeRange(w.startAt, w.endAt)
                    : formatSlotTime(w.startAt)}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-accent inline-block" aria-hidden />
              Selected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-muted inline-block opacity-50" aria-hidden />
              Unavailable
            </span>
          </div>
        </>
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
