/** Fulfillment badge for rental product requirements. */
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { RentalProductFulfillment } from '@/lib/types'

interface RentalFulfillmentBadgeProps {
  readonly fulfillment: RentalProductFulfillment | undefined
}

const FULFILLMENT_META: Record<RentalProductFulfillment, { label: string; className: string }> = {
  DELIVERY_REQUIRED: { label: 'Delivery Required', className: 'bg-red-100 text-red-700' },
  STAFF_INCLUDED: { label: 'Staff Included', className: 'bg-purple-100 text-purple-700' },
  STAFF_REQUIRED: { label: 'Staff Required', className: 'bg-orange-100 text-orange-700' },
  BOOKING_REQUIRED: { label: 'Booking Required', className: 'bg-blue-100 text-blue-700' },
  SELF_OPERATED: { label: 'Self-Operated', className: 'bg-green-100 text-green-700' },
  'DELIVERY_REQUIRED+STAFF': {
    label: 'Delivery + Staff',
    className: 'bg-violet-100 text-violet-700',
  },
}

export function RentalFulfillmentBadge({ fulfillment }: Readonly<RentalFulfillmentBadgeProps>) {
  const meta = fulfillment ? FULFILLMENT_META[fulfillment] : null
  if (!meta) {
    return null
  }

  return (
    <Badge className={cn('border-transparent font-semibold', meta.className)}>{meta.label}</Badge>
  )
}
