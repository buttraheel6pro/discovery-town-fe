/** Fulfillment legend shown on rentals pages. */
import { RentalFulfillmentBadge } from '@/components/customer/rental-fulfillment-badge'
import type { RentalProductFulfillment } from '@/lib/types'

const LEGEND_ITEMS: RentalProductFulfillment[] = [
  'DELIVERY_REQUIRED',
  'STAFF_INCLUDED',
  'STAFF_REQUIRED',
  'BOOKING_REQUIRED',
  'SELF_OPERATED',
]

interface RentalFulfillmentLegendProps {
  readonly compact?: boolean
}

export function RentalFulfillmentLegend({ compact = false }: Readonly<RentalFulfillmentLegendProps>) {
  return (
    <div className={compact ? '' : 'rounded-xl border border-border bg-card p-4'}>
      {!compact ? <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Fulfillment legend</h2> : null}
      <div className="flex flex-wrap gap-2">
        {LEGEND_ITEMS.map((item) => (
          <RentalFulfillmentBadge key={item} fulfillment={item} />
        ))}
      </div>
    </div>
  )
}
