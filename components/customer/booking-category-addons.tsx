/** Paid add-ons linked on the scheduling sub-category in admin (optional checkboxes). */
'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { BOOKING_CART_OPTION_ROW_CLASS } from '@/components/customer/booking-cart-card'
import { cn, formatPrice } from '@/lib/utils'
import type { SchedulingServiceAddOn } from '@/lib/types'

export interface BookingCategoryAddonsProps {
  readonly optional: readonly SchedulingServiceAddOn[]
  readonly selectedOptionalIds: readonly string[]
  readonly onOptionalToggle: (addOnId: string, selected: boolean) => void
}

export function BookingCategoryAddons({
  optional,
  selectedOptionalIds,
  onOptionalToggle,
}: Readonly<BookingCategoryAddonsProps>) {
  if (optional.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-3 p-3', BOOKING_CART_OPTION_ROW_CLASS)}>
      <Label className="text-sm font-semibold">Add-ons</Label>
      <ul className="space-y-2">
        {optional.map((addOn) => (
          <li key={addOn.id}>
            <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedOptionalIds.includes(addOn.id)}
                  onCheckedChange={(checked) => onOptionalToggle(addOn.id, Boolean(checked))}
                />
                <span>{addOn.name}</span>
              </div>
              <span className="text-muted-foreground">{formatPrice(addOn.price)}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
