/** Paying extra adults — separate from category-linked add-ons. */
'use client'

import {
  BOOKING_CART_OPTION_ROW_CLASS,
  BOOKING_CART_STEPPER_CLASS,
} from '@/components/customer/booking-cart-card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn, formatPrice } from '@/lib/utils'

export interface BookingAdditionalAdultFieldProps {
  readonly count: number
  readonly unitPrice: number
  readonly freeAdultCount: number
  readonly onChange: (count: number) => void
  readonly className?: string
}

export function BookingAdditionalAdultField({
  count,
  unitPrice,
  freeAdultCount,
  onChange,
  className,
}: Readonly<BookingAdditionalAdultFieldProps>) {
  return (
    <div className={className}>
      <div className="space-y-1">
        <Label className="text-sm font-semibold">Additional adults</Label>
        <p className="text-xs text-muted-foreground">
          {freeAdultCount > 0
            ? `${freeAdultCount} supervising adult${freeAdultCount === 1 ? '' : 's'} included per booking. Add more below.`
            : 'Add supervising adults beyond those included in your booking.'}
        </p>
      </div>
      <div
        className={cn(
          'mt-3 flex items-center justify-between gap-3 px-4 py-3',
          BOOKING_CART_OPTION_ROW_CLASS,
        )}
      >
        <span className="text-sm text-foreground">
          Additional Adult ({formatPrice(unitPrice)})
        </span>
        <div className={BOOKING_CART_STEPPER_CLASS}>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onChange(Math.max(0, count - 1))}
            disabled={count <= 0}
            aria-label="Decrease additional adults"
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
            aria-label="Increase additional adults"
          >
            +
          </Button>
        </div>
      </div>
    </div>
  )
}
