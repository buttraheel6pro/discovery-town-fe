/** Time-slot grid + legend shared by open booking (play) and rental hourly flows. */
'use client'

import type { ReactNode } from 'react'

import { cn, formatSlotTime, formatSlotTimeRange, areAvailableWindowsEqual } from '@/lib/utils'
import type { AvailableWindow } from '@/lib/types'

export interface OpenBookingTimeWindowGridProps {
  readonly title?: string
  readonly headline?: string
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
  readonly showLegend?: boolean
}

const TIME_SLOT_MIN_WIDTH_CLASS = 'min-w-[133.19px]'
const TIME_SLOT_HEIGHT_CLASS = 'h-[58px]'
const TIME_SLOT_GRID_CLASS =
  'mt-px grid w-full grid-cols-[repeat(auto-fill,minmax(133.19px,1fr))] gap-2'

export function OpenBookingTimeWindowGrid({
  title = 'Select a time',
  headline,
  windows,
  selectedWindow,
  onSelectedWindowChange,
  showTimeRange = false,
  resetSlot,
  formatWindowLabel,
  slotGridClassName = TIME_SLOT_GRID_CLASS,
  slotButtonClassName,
  isWindowSelected,
  interactionDisabled = false,
  showLegend = false,
}: Readonly<OpenBookingTimeWindowGridProps>) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        {resetSlot}
      </div>

      {headline ? (
        <p className="text-sm text-muted-foreground">{headline}</p>
      ) : null}

      <div className={slotGridClassName}>
        {windows.map((w) => {
          const soldOut = w.spotsRemaining <= 0
          const disabled = interactionDisabled || soldOut
          const isSelected =
            !interactionDisabled &&
            (isWindowSelected
              ? isWindowSelected(w)
              : areAvailableWindowsEqual(selectedWindow, w))
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
                'flex w-full flex-col items-center justify-center rounded-[4px] border text-center transition-colors',
                !slotButtonClassName && TIME_SLOT_MIN_WIDTH_CLASS,
                !slotButtonClassName && TIME_SLOT_HEIGHT_CLASS,
                slotButtonClassName,
                disabled &&
                  'cursor-not-allowed border-border bg-muted/60 text-muted-foreground line-through opacity-60',
                !disabled &&
                  !isSelected &&
                  'border-border bg-white text-foreground hover:border-border/80',
                !disabled &&
                  isSelected &&
                  'border-brand-orange bg-brand-orange text-nav-cream shadow-sm',
              )}
              aria-pressed={isSelected}
              aria-disabled={disabled}
            >
              <span className="text-sm font-bold leading-tight">{label}</span>
            </button>
          )
        })}
      </div>

      {showLegend ? (
        <OpenBookingAvailabilitySlotLegend interactionDisabled={interactionDisabled} />
      ) : null}
    </div>
  )
}

export function OpenBookingAvailabilitySlotLegend({
  interactionDisabled = false,
}: Readonly<{ readonly interactionDisabled?: boolean }>) {
  return (
    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
      {interactionDisabled ? (
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded border border-brand-orange/50 bg-brand-orange/10"
            aria-hidden
          />
          Scheduled session
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-brand-orange" aria-hidden />
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
