/** Rental product card with tiered pricing and fulfillment details. */
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Clock3 } from 'lucide-react'

import { RentalFulfillmentBadge } from '@/components/customer/rental-fulfillment-badge'
import { Button } from '@/components/ui/button'
import { useInventory } from '@/lib/inventory-store'
import { cn, formatPrice } from '@/lib/utils'
import type { Product } from '@/lib/types'

interface RentalProductCardProps {
  readonly product: Product
  readonly className?: string
}

function getPricingLabel(product: Product): string {
  if (product.rentalBillingType === 'PER_EVENT' && product.pricePerEvent != null) {
    return `Per Event: ${formatPrice(product.pricePerEvent)}`
  }
  if (product.rentalBillingType === 'PER_HOUR' && product.pricePerHour != null) {
    return `Per Hour: ${formatPrice(product.pricePerHour)}`
  }
  if (product.rentalBillingType === 'PER_HALF_DAY' && product.rentalPricePerHalfDay != null) {
    return `Per Half Day: ${formatPrice(product.rentalPricePerHalfDay)}`
  }
  const tiers: string[] = []
  if (product.rentalPricePerHalfDay != null) {
    tiers.push(`Half Day: ${formatPrice(product.rentalPricePerHalfDay)}`)
  }
  if (product.rentalPricePerDay != null) {
    tiers.push(`Full Day: ${formatPrice(product.rentalPricePerDay)}`)
  }
  return tiers.length > 0 ? tiers.join(' | ') : formatPrice(product.price)
}

export function RentalProductCard({ product, className }: Readonly<RentalProductCardProps>) {
  const { addToCart } = useInventory()
  const isAvailable = product.stockCount > 0
  const requiresRentalSchedule =
    product.rentalBillingType === 'PER_DAY' ||
    product.rentalBillingType === 'PER_HOUR' ||
    product.rentalBillingType === 'PER_HALF_DAY'

  return (
    <article className={cn('overflow-hidden rounded-xl border border-border bg-card', className)}>
      <Link href={`/shop/${product.id}`} className="block">
        <div className="relative aspect-[4/3] bg-secondary">
          <Image
            src={product.imageUrl ?? '/placeholder.jpg'}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      </Link>
      <div className="space-y-3 p-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground">{product.name}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {product.description ?? 'Rental item available for booking.'}
          </p>
        </div>
        <RentalFulfillmentBadge fulfillment={product.fulfillment} />
        <p className="text-sm font-semibold text-foreground">{getPricingLabel(product)}</p>
        {product.setupMinutes != null ? (
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" />
            Setup: {Math.round(product.setupMinutes / 60)} hrs
          </p>
        ) : null}
        <p className={cn('text-xs font-semibold', isAvailable ? 'text-green-700' : 'text-red-700')}>
          {isAvailable ? 'Available' : 'Fully booked'}
        </p>
        {requiresRentalSchedule ? (
          <Button className="w-full" asChild>
            <Link href={`/shop/${product.id}#rental-dates`}>
              {product.rentalBillingType === 'PER_DAY'
                ? 'Select rental dates'
                : 'Select dates & slot'}
            </Link>
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={() => addToCart({ product })}
          >
            Add to Rental Cart
          </Button>
        )}
      </div>
    </article>
  )
}
