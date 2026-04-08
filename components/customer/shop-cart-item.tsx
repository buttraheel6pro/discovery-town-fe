/** ShopCartItem — cart line item for the shared /cart page. */
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Minus, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn, formatPrice } from '@/lib/utils'
import type { CartItem } from '@/lib/types'

export interface ShopCartItemProps {
  readonly item: CartItem
  readonly onUpdateQuantity: (qty: number) => void
  readonly onRemove: () => void
  readonly className?: string
}

export function ShopCartItem({
  item,
  onUpdateQuantity,
  onRemove,
  className,
}: Readonly<ShopCartItemProps>) {
  const [usePlaceholder, setUsePlaceholder] = useState(false)
  return (
    <div className={cn('flex items-start gap-4 rounded-xl border border-border bg-card p-4', className)}>
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
        <Image
          src={usePlaceholder ? '/placeholder.jpg' : item.imageUrl ?? '/placeholder.jpg'}
          alt={item.name}
          fill
          className="object-cover"
          sizes="64px"
          onError={() => setUsePlaceholder(true)}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
            {item.description ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.description}</p>
            ) : null}
          </div>
          <Button variant="ghost" size="icon" onClick={onRemove} aria-label={`Remove ${item.name}`}>
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onUpdateQuantity(item.quantity - 1)}
              disabled={item.quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              value={String(item.quantity)}
              onChange={(e) => {
                const next = Number.parseInt(e.target.value || '1', 10)
                if (!Number.isFinite(next)) return
                onUpdateQuantity(next)
              }}
              className="h-8 w-16 text-center"
              inputMode="numeric"
              aria-label="Quantity"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onUpdateQuantity(item.quantity + 1)}
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-sm font-bold text-foreground">
            {formatPrice(item.price * item.quantity)}
          </p>
        </div>
      </div>
    </div>
  )
}

