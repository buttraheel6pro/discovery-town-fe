/** Order detail panel — shows line items, totals, and admin actions. */
'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'

import { RefundModal } from '@/components/admin/refund-modal'
import { OrderChannelBadge } from '@/components/admin/order-channel-badge'
import { OrderStatusBadge } from '@/components/admin/order-status-badge'
import { PaymentStatusBadge } from '@/components/admin/payment-status-badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'
import { useInventory } from '@/lib/inventory-store'
import type { Order } from '@/lib/types'

export interface OrderDetailPanelProps {
  readonly order: Order
  readonly onClose?: () => void
}

export function OrderDetailPanel({ order, onClose }: Readonly<OrderDetailPanelProps>) {
  const { fulfillOrder, cancelOrder, updateOrderNotes } = useInventory()
  const { toast } = useToast()

  const [refundOpen, setRefundOpen] = useState(false)
  const [notes, setNotes] = useState(order.notes ?? '')

  useEffect(() => {
    setNotes(order.notes ?? '')
  }, [order.id, order.notes])

  const totals = useMemo(() => {
    const couponDiscount = order.couponDiscount ?? 0
    return {
      subtotal: order.subtotal,
      discount: couponDiscount,
      tax: order.tax,
      total: order.total,
    }
  }, [order])

  const canFulfill = order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'PENDING'
  const canRefund = order.status !== 'CANCELLED' && order.status !== 'REFUNDED'
  const canCancel = order.status === 'PENDING' || order.status === 'PROCESSING'

  function doFulfill() {
    fulfillOrder(order.id)
    toast({ title: 'Order updated', description: 'Marked as fulfilled.' })
  }

  function doCancel() {
    cancelOrder(order.id, 'Cancelled by admin')
    toast({ title: 'Order cancelled' })
  }

  function saveNotes() {
    const next = notes.trim()
    updateOrderNotes(order.id, next)
    toast({ title: 'Notes saved' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-mono text-sm font-bold text-foreground">{order.orderNumber}</p>
          <div className="flex flex-wrap items-center gap-2">
            <OrderChannelBadge channel={order.channel} />
            <PaymentStatusBadge status={order.paymentStatus} />
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-xs text-muted-foreground">
            Created {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canCancel ? (
            <Button variant="outline" onClick={doCancel}>
              Cancel order
            </Button>
          ) : null}
          {canRefund ? (
            <Button variant="outline" onClick={() => setRefundOpen(true)}>
              Refund
            </Button>
          ) : null}
          {canFulfill ? (
            <Button onClick={doFulfill}>Mark fulfilled</Button>
          ) : null}
          {onClose ? (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          ) : null}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Items</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((li) => (
              <TableRow key={li.id}>
                <TableCell className="whitespace-normal">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-md bg-muted/30">
                      <Image
                        src={li.imageUrl ?? '/placeholder.svg'}
                        alt={li.productName}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{li.productName}</p>
                      {li.sku ? (
                        <p className="font-mono text-xs text-muted-foreground">{li.sku}</p>
                      ) : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">{li.quantity}</TableCell>
                <TableCell className="text-right">{formatPrice(li.unitPrice)}</TableCell>
                <TableCell className="text-right font-semibold">{formatPrice(li.totalPrice)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Internal notes</p>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            placeholder="Add internal notes…"
          />
          <p className="text-xs text-muted-foreground">Auto-saves on blur.</p>
        </div>

        <div className="space-y-2 rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">Totals</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatPrice(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 ? (
              <div className="flex justify-between text-green-700">
                <span>Discount</span>
                <span>-{formatPrice(totals.discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-muted-foreground">
              <span>Tax</span>
              <span>{formatPrice(totals.tax)}</span>
            </div>
            <Separator />
            <div
              className="flex justify-between text-base font-black text-foreground"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              <span>Total</span>
              <span>{formatPrice(totals.total)}</span>
            </div>
          </div>
        </div>
      </div>

      <RefundModal order={order} open={refundOpen} onClose={() => setRefundOpen(false)} />
    </div>
  )
}

