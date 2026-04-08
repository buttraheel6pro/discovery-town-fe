/** Order receipt modal — print/email receipt after POS or online checkout. */
'use client'

import { useMemo } from 'react'

import { CrudModal } from '@/components/admin/crud-modal'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/utils'
import { useInventory } from '@/lib/inventory-store'
import type { Order } from '@/lib/types'

export interface OrderReceiptModalProps {
  readonly order: Order
  readonly open: boolean
  readonly onClose: () => void
}

function buildReceiptText(order: Order): string {
  const lines: string[] = []
  lines.push('Discovery Town')
  lines.push(new Date(order.createdAt).toLocaleString())
  lines.push(`Order: ${order.orderNumber}`)
  lines.push('')
  for (const li of order.items) {
    lines.push(`${li.productName} x${li.quantity}  ${formatPrice(li.totalPrice)}`)
  }
  lines.push('')
  lines.push(`Subtotal: ${formatPrice(order.subtotal)}`)
  if ((order.couponDiscount ?? 0) > 0) {
    lines.push(`Discount: -${formatPrice(order.couponDiscount ?? 0)}`)
  }
  lines.push(`Tax: ${formatPrice(order.tax)}`)
  lines.push(`Total: ${formatPrice(order.total)}`)
  if (order.paymentMethod) lines.push(`Payment: ${order.paymentMethod}`)
  return lines.join('\n')
}

export function OrderReceiptModal({
  order,
  open,
  onClose,
}: Readonly<OrderReceiptModalProps>) {
  const { clearCart } = useInventory()

  const mailtoHref = useMemo(() => {
    const email = order.contactEmail
    if (!email) return null
    const subject = encodeURIComponent(`Receipt ${order.orderNumber}`)
    const body = encodeURIComponent(buildReceiptText(order))
    return `mailto:${email}?subject=${subject}&body=${body}`
  }, [order])

  function printReceipt() {
    if (typeof window === 'undefined') return
    window.print()
  }

  function newOrder() {
    clearCart()
    onClose()
  }

  return (
    <CrudModal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      title="Receipt"
      description="Print or email a receipt for this order."
      size="sm"
      variant="view"
      scrollMode="dialog"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {mailtoHref ? (
            <Button variant="outline" asChild>
              <a href={mailtoHref}>Email receipt</a>
            </Button>
          ) : null}
          <Button variant="outline" onClick={printReceipt}>
            Print
          </Button>
          <Button onClick={newOrder}>New order</Button>
        </>
      }
    >
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #dt-receipt,
          #dt-receipt * {
            visibility: visible;
          }
          #dt-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 24px;
          }
        }
      `}</style>

      <div
        id="dt-receipt"
        className="space-y-4 rounded-xl border border-border bg-background p-4"
      >
        <div className="text-center">
          <p className="text-sm font-black text-foreground" style={{ fontFamily: 'var(--font-barlow)' }}>
            Discovery Town
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleString()}
          </p>
          <p className="mt-2 inline-flex rounded-md bg-muted px-2 py-1 font-mono text-xs text-foreground">
            {order.orderNumber}
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          {order.items.map((li) => (
            <div key={li.id} className="flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{li.productName}</p>
                <p className="text-xs text-muted-foreground">
                  {li.quantity} × {formatPrice(li.unitPrice)}
                </p>
              </div>
              <p className="shrink-0 font-semibold text-foreground">{formatPrice(li.totalPrice)}</p>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {(order.couponDiscount ?? 0) > 0 ? (
            <div className="flex justify-between text-green-700">
              <span>Discount</span>
              <span>-{formatPrice(order.couponDiscount ?? 0)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-muted-foreground">
            <span>Tax</span>
            <span>{formatPrice(order.tax)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-black text-foreground" style={{ fontFamily: 'var(--font-barlow)' }}>
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>

        {order.paymentMethod ? (
          <p className="text-center text-xs text-muted-foreground">
            Paid via <span className="font-semibold text-foreground">{order.paymentMethod}</span>
          </p>
        ) : null}
      </div>
    </CrudModal>
  )
}

