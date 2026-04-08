/** Refund modal — selects line items and records refund reason/amount. */
'use client'

import { useEffect, useMemo, useState } from 'react'

import { CrudModal } from '@/components/admin/crud-modal'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'
import { useInventory } from '@/lib/inventory-store'
import type { Order } from '@/lib/types'

export interface RefundModalProps {
  readonly order: Order
  readonly open: boolean
  readonly onClose: () => void
}

export function RefundModal({ order, open, onClose }: Readonly<RefundModalProps>) {
  const { refundOrder } = useInventory()
  const { toast } = useToast()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!open) return
    setSelectedIds(new Set(order.items.map((i) => i.id)))
    setReason('')
  }, [open, order.items])

  const refundTotal = useMemo(() => {
    return order.items.reduce((s, li) => {
      if (!selectedIds.has(li.id)) return s
      return s + li.totalPrice
    }, 0)
  }, [order.items, selectedIds])

  const canSubmit = refundTotal > 0 && reason.trim().length > 0

  function toggle(id: string, next: boolean) {
    setSelectedIds((prev) => {
      const copy = new Set(prev)
      if (next) copy.add(id)
      else copy.delete(id)
      return copy
    })
  }

  function submit() {
    if (!canSubmit) return
    refundOrder(order.id, refundTotal, reason.trim())
    toast({
      title: 'Refund recorded',
      description: `${formatPrice(refundTotal)} refunded for ${order.orderNumber}.`,
    })
    onClose()
  }

  return (
    <CrudModal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      title="Refund order"
      description="Select items to refund and provide a reason."
      size="sm"
      variant="delete"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={!canSubmit} onClick={submit}>
            Confirm refund {formatPrice(refundTotal)}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Line items</p>
          <div className="space-y-2">
            {order.items.map((li) => {
              const checked = selectedIds.has(li.id)
              return (
                <div key={li.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) => toggle(li.id, v === true)}
                    aria-label={`Refund ${li.productName}`}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{li.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty {li.quantity} × {formatPrice(li.unitPrice)} = {formatPrice(li.totalPrice)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="refund-reason">Reason</Label>
          <Textarea
            id="refund-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Required…"
          />
        </div>
      </div>
    </CrudModal>
  )
}

