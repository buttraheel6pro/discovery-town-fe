/** Unified “View details” dialog for cart line items (cafe, shop, rental, play, gym, event). */

'use client'

import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatModifierSummary } from '@/lib/cafe-utils'
import {
  buildShopSelectedOptionLines,
  extractCafeCustomerNoteFromMetadata,
  extractCafeSelectedAttributeLinesFromMetadata,
  extractCartLineProductId,
  extractCartLineServiceId,
} from '@/lib/cart-line-details'
import { formatPrice } from '@/lib/utils'
import type { CartItem } from '@/lib/types'

export type CartLineDetailsKind = 'cafe' | 'shop' | 'rental' | 'play' | 'gym' | 'event'

export interface CartLineDetailsTarget {
  readonly kind: CartLineDetailsKind
  readonly itemId: string
}

export interface CartLineDetailsModalProps {
  readonly items: readonly CartItem[]
  readonly target: CartLineDetailsTarget | null
  readonly onClose: () => void
}

const HEADER_BY_KIND: Record<CartLineDetailsKind, { title: string; description: string }> = {
  cafe: {
    title: 'Cafe item details',
    description: 'Review customisation and notes for this line item.',
  },
  shop: {
    title: 'Shop item details',
    description: 'Review selected customisation options for this line item.',
  },
  rental: {
    title: 'Rental item details',
    description: 'Review details for this line item.',
  },
  play: {
    title: 'Play booking details',
    description: 'Review details for this line item.',
  },
  gym: {
    title: 'Gym booking details',
    description: 'Review details for this line item.',
  },
  event: {
    title: 'Event booking details',
    description: 'Review details for this line item.',
  },
}

export function CartLineDetailsModal({ items, target, onClose }: CartLineDetailsModalProps) {
  const item = useMemo(() => {
    if (!target) return null
    return items.find((row) => row.id === target.itemId) ?? null
  }, [items, target])

  const kind = target?.kind ?? null
  const header = kind ? HEADER_BY_KIND[kind] : { title: '', description: '' }

  const cafeCustomerNote =
    kind === 'cafe' && item ? extractCafeCustomerNoteFromMetadata(item.metadata) : ''
  const cafeAttributeLines =
    kind === 'cafe' && item ? extractCafeSelectedAttributeLinesFromMetadata(item.metadata) : []
  const shopOptionLines = kind === 'shop' && item ? buildShopSelectedOptionLines(item) : []
  const serviceId =
    kind === 'play' || kind === 'gym' || kind === 'event'
      ? item
        ? extractCartLineServiceId(item.metadata)
        : ''
      : ''
  const productRefId = kind === 'rental' && item ? extractCartLineProductId(item.metadata) : ''

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{header.title}</DialogTitle>
          <DialogDescription>{header.description}</DialogDescription>
        </DialogHeader>
        {target && !item ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">This item is no longer in your cart.</p>
            <div className="flex justify-end">
              <Button type="button" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : !item || !kind ? null : kind === 'cafe' ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{item.name}</p>
                {item.subtypeLabel?.trim() ? (
                  <p className="text-xs text-muted-foreground">{item.subtypeLabel}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <p className="font-semibold text-foreground">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
            {item.selectedModifiers?.length ? (
              <div className="space-y-1 rounded-lg border border-border bg-card p-3">
                <p className="text-sm font-semibold text-foreground">Selected options</p>
                <p className="text-sm text-muted-foreground">
                  {formatModifierSummary(item.selectedModifiers)}
                </p>
              </div>
            ) : null}
            {cafeAttributeLines.length > 0 ? (
              <div className="space-y-1 rounded-lg border border-border bg-card p-3">
                <p className="text-sm font-semibold text-foreground">Selected attributes</p>
                <p className="text-sm text-muted-foreground">{cafeAttributeLines.join(' • ')}</p>
              </div>
            ) : null}
            {cafeCustomerNote ? (
              <div className="space-y-1 rounded-lg border border-border bg-card p-3">
                <p className="text-sm font-semibold text-foreground">Notes</p>
                <p className="text-sm text-muted-foreground">{cafeCustomerNote}</p>
              </div>
            ) : null}
            {item.description ? (
              <div className="space-y-1 rounded-lg border border-border bg-card p-3">
                <p className="text-sm font-semibold text-foreground">Details</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ) : null}
            <div className="flex justify-end">
              <Button type="button" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : kind === 'shop' ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <p className="font-semibold text-foreground">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
            {shopOptionLines.length > 0 ? (
              <div className="space-y-1 rounded-lg border border-border bg-card p-3">
                <p className="text-sm font-semibold text-foreground">Selected options</p>
                <p className="text-sm text-muted-foreground">{shopOptionLines.join(' • ')}</p>
              </div>
            ) : (
              <div className="space-y-1 rounded-lg border border-border bg-card p-3">
                <p className="text-sm text-muted-foreground">No selected customisation options.</p>
              </div>
            )}
            {item.description ? (
              <div className="space-y-1 rounded-lg border border-border bg-card p-3">
                <p className="text-sm font-semibold text-foreground">Details</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ) : null}
            <div className="flex justify-end">
              <Button type="button" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : kind === 'rental' ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <p className="font-semibold text-foreground">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
            {productRefId ? (
              <div className="space-y-1 rounded-lg border border-border bg-card p-3">
                <p className="text-sm font-semibold text-foreground">Product reference</p>
                <p className="text-sm text-muted-foreground">{productRefId}</p>
              </div>
            ) : (
              <div className="space-y-1 rounded-lg border border-border bg-card p-3">
                <p className="text-sm text-muted-foreground">No product reference on this line.</p>
              </div>
            )}
            {item.description ? (
              <div className="space-y-1 rounded-lg border border-border bg-card p-3">
                <p className="text-sm font-semibold text-foreground">Details</p>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{item.description}</p>
              </div>
            ) : null}
            <div className="flex justify-end">
              <Button type="button" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : kind === 'play' || kind === 'gym' || kind === 'event' ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3">
              <p className="font-semibold text-foreground">{item.name}</p>
              <p className="font-semibold text-foreground">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
            {serviceId ? (
              <div className="space-y-1 rounded-lg border border-border bg-card p-3">
                <p className="text-sm font-semibold text-foreground">Service reference</p>
                <p className="text-sm text-muted-foreground">{serviceId}</p>
              </div>
            ) : (
              <div className="space-y-1 rounded-lg border border-border bg-card p-3">
                <p className="text-sm text-muted-foreground">No service reference on this line.</p>
              </div>
            )}
            {item.description ? (
              <div className="space-y-1 rounded-lg border border-border bg-card p-3">
                <p className="text-sm font-semibold text-foreground">Details</p>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{item.description}</p>
              </div>
            ) : null}
            <div className="flex justify-end">
              <Button type="button" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
