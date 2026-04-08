/** Stock status badge — consistent label + color for inventory stock. */

import { Badge } from '@/components/ui/badge'
import { getStockStatus, getStockStatusLabel, getStockStatusColor } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types'

const colorClassName: Record<
  ReturnType<typeof getStockStatusColor>,
  string
> = {
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
}

export function StockStatusBadge({
  product,
  className,
}: Readonly<{
  product: Pick<Product, 'stockCount' | 'lowStockThreshold' | 'allowBackorders' | 'trackInventory'>
  className?: string
}>) {
  const status = getStockStatus(product)
  const color = getStockStatusColor(status)

  return (
    <Badge className={cn('text-xs font-semibold', colorClassName[color], className)}>
      {getStockStatusLabel(status)}
    </Badge>
  )
}

