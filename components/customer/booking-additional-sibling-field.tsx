/** Extra sibling passes beyond the primary pass count on open-play bookings. */
'use client'

import {
  BOOKING_CART_OPTION_ROW_CLASS,
  BOOKING_CART_STEPPER_CLASS,
} from '@/components/customer/booking-cart-card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn, formatPrice } from '@/lib/utils'
interface SiblingPassOption {
  readonly serviceId: string
  readonly name: string
  readonly unitPrice: number
}

export interface BookingAdditionalSiblingFieldProps {
  readonly count: number
  readonly unitPrice: number
  readonly passCount: number
  readonly onChange: (count: number) => void
  readonly siblingPassOptions?: readonly SiblingPassOption[]
  readonly siblingPassQuantities?: Readonly<Record<string, number>>
  readonly onSiblingPassQuantityChange?: (serviceId: string, quantity: number) => void
  readonly className?: string
}

export function BookingAdditionalSiblingField({
  count,
  unitPrice: _unitPrice,
  passCount,
  onChange,
  siblingPassOptions = [],
  siblingPassQuantities = {},
  onSiblingPassQuantityChange,
  className,
}: Readonly<BookingAdditionalSiblingFieldProps>) {
  const hasPassOptions = siblingPassOptions.length > 0

  function handleDecrease(serviceId: string): void {
    const current = siblingPassQuantities[serviceId] ?? 0
    if (current <= 0) {
      return
    }
    const next = current - 1
    onSiblingPassQuantityChange?.(serviceId, next)
    if (next <= 0) {
      const total = Object.values(siblingPassQuantities).reduce((sum, quantity) => {
        if (quantity <= 0) {
          return sum
        }
        return sum + quantity
      }, 0)
      onChange(Math.max(0, total - current))
      return
    }
    onChange(
      Object.values({
        ...siblingPassQuantities,
        [serviceId]: next,
      }).reduce((sum, quantity) => sum + Math.max(0, quantity), 0),
    )
  }

  function handleIncrease(serviceId: string): void {
    const next = (siblingPassQuantities[serviceId] ?? 0) + 1
    onSiblingPassQuantityChange?.(serviceId, next)
    onChange(
      Object.values({
        ...siblingPassQuantities,
        [serviceId]: next,
      }).reduce((sum, quantity) => sum + Math.max(0, quantity), 0),
    )
  }

  return (
    <div className={className}>
      <div className="space-y-1">
        <Label className="text-sm font-semibold">Choose another pass</Label>
        <p className="text-xs text-muted-foreground">
          {passCount} pass{passCount === 1 ? '' : 'es'} cover primary children. Select one pass
          and set quantity. You can select up to {passCount + count} child
          {passCount + count === 1 ? '' : 'ren'} in total.
        </p>
      </div>
      {hasPassOptions ? (
        <div className="mt-3 space-y-2">
          <div className="space-y-2">
            {siblingPassOptions.map((option) => {
              const quantity = siblingPassQuantities[option.serviceId] ?? 0
              const checked = quantity > 0
              return (
                <div
                  key={option.serviceId}
                  className={cn(
                    'flex items-center justify-between gap-3 px-3 py-2.5 transition-colors',
                    checked
                      ? 'rounded-lg border border-accent bg-accent/5'
                      : BOOKING_CART_OPTION_ROW_CLASS,
                  )}
                >                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {option.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatPrice(option.unitPrice)}
                    </span>
                  </div>
                  <div className={BOOKING_CART_STEPPER_CLASS}>                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDecrease(option.serviceId)}
                      disabled={!checked}
                      aria-label={`Decrease quantity for ${option.name}`}
                    >
                      –
                    </Button>
                    <span className="w-8 text-center text-sm font-bold">
                      {checked ? quantity : 0}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleIncrease(option.serviceId)}
                      aria-label={`Increase quantity for ${option.name}`}
                    >
                      +
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
