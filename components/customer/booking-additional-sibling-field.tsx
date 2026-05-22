/** Extra sibling passes beyond the primary pass count on open-play bookings. */
'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { formatPrice } from '@/lib/utils'

export interface BookingAdditionalSiblingFieldProps {
  readonly count: number
  readonly unitPrice: number
  readonly passCount: number
  readonly onChange: (count: number) => void
  readonly className?: string
}

export function BookingAdditionalSiblingField({
  count,
  unitPrice,
  passCount,
  onChange,
  className,
}: Readonly<BookingAdditionalSiblingFieldProps>) {
  return (
    <div className={className}>
      <div className="space-y-1">
        <Label className="text-sm font-semibold">Additional siblings</Label>
        <p className="text-xs text-muted-foreground">
          {passCount} pass{passCount === 1 ? '' : 'es'} cover primary children. Add siblings
          here — you can select up to {passCount + count} child
          {passCount + count === 1 ? '' : 'ren'} in total.
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3">
        <span className="text-sm text-foreground">
          Additional sibling ({formatPrice(unitPrice)})
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onChange(Math.max(0, count - 1))}
            disabled={count <= 0}
            aria-label="Decrease additional siblings"
          >
            –
          </Button>
          <span className="w-8 text-center text-sm font-bold">{count}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onChange(count + 1)}
            aria-label="Increase additional siblings"
          >
            +
          </Button>
        </div>
      </div>
    </div>
  )
}
