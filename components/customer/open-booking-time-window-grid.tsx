/** Time-slot grid + legend shared by open booking (play) and rental hourly flows. */
'use client'

import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn, formatSlotTime, formatSlotTimeRange } from '@/lib/utils'
import type { AvailableWindow } from '@/lib/types'

export interface OpenBookingTimeWindowGridProps {
  readonly headline: string
  readonly windows: readonly AvailableWindow[]
  readonly selectedWindow: AvailableWindow | null
  readonly onSelectedWindowChange: (window: AvailableWindow | null) => void
  readonly showTimeRange?: boolean
  readonly resetSlot?: ReactNode
  /** Override button label (e.g. rental half-day copy). */
  readonly formatWindowLabel?: (window: AvailableWindow) => string
  /** Tailwind grid classes for the slot row (default matches play / facility). */
  readonly slotGridClassName?: string
  /** Extra classes on each slot button (e.g. rental half-day layout). */
  readonly slotButtonClassName?: string
  /** Optional custom selected-state resolver (e.g. highlight a contiguous range). */
  readonly isWindowSelected?: (window: AvailableWindow) => boolean
  /** When true, all slots are shown disabled and cannot be selected. */
  readonly interactionDisabled?: boolean
}

export function OpenBookingTimeWindowGrid({
  headline,
  windows,
  selectedWindow,
  onSelectedWindowChange,
  showTimeRange = false,
  resetSlot,
  formatWindowLabel,
  slotGridClassName = 'grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8',
  slotButtonClassName,
  isWindowSelected,
  interactionDisabled = false,
}: Readonly<OpenBookingTimeWindowGridProps>) {
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted-foreground">{headline}</p>
        {resetSlot}
      </div>
      <div className={slotGridClassName}>
        {windows.map((w) => {
          const soldOut = w.spotsRemaining <= 0
          const disabled = interactionDisabled || soldOut
          const isSelected =
            !interactionDisabled &&
            (isWindowSelected
              ? isWindowSelected(w)
              : selectedWindow?.startAt === w.startAt && selectedWindow?.endAt === w.endAt)
          const label =
            formatWindowLabel?.(w) ??
            (showTimeRange ? formatSlotTimeRange(w.startAt, w.endAt) : formatSlotTime(w.startAt))
          return (
            <button
              key={`${w.startAt}-${w.endAt}`}
              type="button"
              onClick={() => {
                if (interactionDisabled || disabled) return
                onSelectedWindowChange(isSelected ? null : w)
              }}
              disabled={disabled}
              className={cn(
                'rounded-lg border py-2.5 text-xs font-semibold transition-colors',
                slotButtonClassName,
                disabled &&
                  'cursor-not-allowed border-border bg-muted text-muted-foreground line-through opacity-50',
                !disabled &&
                  !isSelected &&
                  'border-border bg-card text-foreground hover:bg-secondary',
                !disabled && isSelected && 'border-accent bg-accent text-accent-foreground',
              )}
              aria-pressed={isSelected}
              aria-disabled={disabled}
            >
              {label}
            </button>
          )
        })}
      </div>
      <OpenBookingAvailabilitySlotLegend interactionDisabled={interactionDisabled} />
    </>
  )
}

export function OpenBookingAvailabilitySlotLegend({
  interactionDisabled = false,
}: Readonly<{ readonly interactionDisabled?: boolean }>) {
  return (
    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
      {interactionDisabled ? (
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-accent/50 bg-accent/10" aria-hidden />
          Scheduled session
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-accent" aria-hidden />
          Selected
        </span>
      )}
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded bg-muted opacity-50" aria-hidden />
        {interactionDisabled ? 'Sold out' : 'Unavailable'}
      </span>
    </div>
  )
}

