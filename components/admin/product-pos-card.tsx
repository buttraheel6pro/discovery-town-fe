/** POS product card — touch-friendly product add tile. */
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'

import { StockStatusBadge } from '@/components/admin/stock-status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn, formatPrice, getStockStatus } from '@/lib/utils'
import type { Product } from '@/lib/types'

const SHOP_FALLBACK_SRC = '/placeholder.jpg'
const PLACEHOLDER_SRC = '/placeholder.jpg'

export interface ProductPOSCardProps {
  readonly product: Product
  readonly onAdd: (product: Product, quantity: number) => void
}

export function ProductPOSCard({ product, onAdd }: Readonly<ProductPOSCardProps>) {
  const status = getStockStatus(product)
  const blocked = status === 'OUT_OF_STOCK' && !product.allowBackorders

  const [open, setOpen] = useState(false)
  const [qtyRaw, setQtyRaw] = useState('1')
  const pressTimer = useRef<number | null>(null)
  const [usePlaceholder, setUsePlaceholder] = useState(false)

  const qty = useMemo(() => {
    const parsed = Number.parseInt(qtyRaw || '1', 10)
    if (!Number.isFinite(parsed) || parsed <= 0) return 1
    return parsed
  }, [qtyRaw])

  useEffect(() => {
    if (!open) setQtyRaw('1')
  }, [open])

  function addNow(quantity: number) {
    if (blocked) return
    onAdd(product, quantity)
  }

  function onPointerDown() {
    if (blocked) return
    if (pressTimer.current) window.clearTimeout(pressTimer.current)
    pressTimer.current = window.setTimeout(() => setOpen(true), 500)
  }

  function onPointerUp() {
    if (pressTimer.current) window.clearTimeout(pressTimer.current)
    pressTimer.current = null
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={() => addNow(1)}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          disabled={blocked}
          className={cn(
            'group flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-all',
            'hover:shadow-md hover:-translate-y-0.5',
            blocked && 'cursor-not-allowed opacity-50 hover:shadow-none hover:translate-y-0',
          )}
          aria-label={`Add ${product.name}`}
        >
          <div className="relative aspect-square w-full bg-muted/30">
            <Image
              src={usePlaceholder ? PLACEHOLDER_SRC : product.imageUrl ?? SHOP_FALLBACK_SRC}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 33vw, 25vw"
              onError={() => setUsePlaceholder(true)}
            />
          </div>
          <div className="flex min-h-[96px] flex-1 flex-col gap-2 p-3">
            <p className="line-clamp-2 text-sm font-semibold text-foreground">{product.name}</p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-black text-foreground" style={{ fontFamily: 'var(--font-barlow)' }}>
                {formatPrice(product.memberPrice ?? product.price)}
              </p>
              <StockStatusBadge product={product} />
            </div>
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-64 p-4">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Add quantity</p>
          <Input
            type="number"
            inputMode="numeric"
            step={1}
            min={1}
            value={qtyRaw}
            onChange={(e) => setQtyRaw(e.target.value)}
            className="h-10"
          />
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                addNow(qty)
                setOpen(false)
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

