/** Pass / guest count stepper for scheduling checkout. */
'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export interface BookingPassCountFieldProps {
  readonly label: string
  readonly count: number
  readonly min?: number
  readonly max?: number | null
  readonly onChange: (count: number) => void
  readonly decreaseAriaLabel?: string
  readonly increaseAriaLabel?: string
  readonly helperText?: string
}

export function BookingPassCountField({
  label,
  count,
  min = 1,
  max = null,
  onChange,
  decreaseAriaLabel,
  increaseAriaLabel,
  helperText,
}: Readonly<BookingPassCountFieldProps>) {
  const effectiveMax = max != null && max >= min ? max : null
  const isFixed = effectiveMax != null && effectiveMax <= min
  const atMin = count <= min
  const atMax = effectiveMax != null && count >= effectiveMax

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">{label}</Label>
      {helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
      {isFixed ? (
        <p className="text-base font-bold tabular-nums">{count}</p>
      ) : (
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onChange(Math.max(min, count - 1))}
            disabled={atMin}
            aria-label={decreaseAriaLabel ?? `Decrease ${label.toLowerCase()}`}
          >
            –
          </Button>
          <span className="w-14 text-center text-base font-bold tabular-nums">{count}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              onChange(
                effectiveMax != null ? Math.min(effectiveMax, count + 1) : count + 1,
              )
            }
            disabled={atMax}
            aria-label={increaseAriaLabel ?? `Increase ${label.toLowerCase()}`}
          >
            +
          </Button>
        </div>
      )}
    </div>
  )
}
