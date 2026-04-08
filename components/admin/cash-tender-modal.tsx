/** Cash tender modal — completes POS sale with tendered amount + change due. */
'use client'

import { useEffect, useMemo, useState } from 'react'

import { CrudModal } from '@/components/admin/crud-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn, formatPrice } from '@/lib/utils'

export interface CashTenderModalProps {
  readonly total: number
  readonly open: boolean
  readonly onClose: () => void
  readonly onComplete: () => void
}

export function CashTenderModal({
  total,
  open,
  onClose,
  onComplete,
}: Readonly<CashTenderModalProps>) {
  const [tenderedRaw, setTenderedRaw] = useState('')

  useEffect(() => {
    if (!open) return
    setTenderedRaw('')
  }, [open])

  const tendered = useMemo(() => {
    const parsed = Number.parseFloat(tenderedRaw || '0')
    return Number.isFinite(parsed) ? parsed : 0
  }, [tenderedRaw])

  const change = tendered - total
  const canComplete = change >= 0 && total > 0

  function submit() {
    if (!canComplete) return
    onComplete()
    onClose()
  }

  return (
    <CrudModal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      title="Cash payment"
      description="Enter the amount tendered to calculate change due."
      size="sm"
      variant="edit"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canComplete}>
            Complete sale
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="text-sm text-muted-foreground">Total due</p>
          <p className="text-2xl font-black text-foreground" style={{ fontFamily: 'var(--font-barlow)' }}>
            {formatPrice(total)}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cash-tendered">Amount tendered</Label>
          <Input
            id="cash-tendered"
            inputMode="decimal"
            type="number"
            step="0.01"
            value={tenderedRaw}
            onChange={(e) => setTenderedRaw(e.target.value)}
            placeholder="0.00"
            className="h-11 text-base"
          />
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-sm text-muted-foreground">Change due</p>
          <p className={cn('text-lg font-bold', change >= 0 ? 'text-green-700' : 'text-muted-foreground')}>
            {change >= 0 ? formatPrice(change) : '—'}
          </p>
        </div>
      </div>
    </CrudModal>
  )
}

