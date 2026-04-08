/** Stock adjustment modal — records movements and updates product stock. */
'use client'

import { useEffect, useMemo, useState } from 'react'

import { CrudModal } from '@/components/admin/crud-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useInventory } from '@/lib/inventory-store'
import type { Product, StockMovement } from '@/lib/types'

type MovementType = StockMovement['movementType']

const typeOptions: Array<{
  value: MovementType
  label: string
  sign: '+' | '-'
}> = [
  { value: 'PURCHASE', label: 'Purchase', sign: '+' },
  { value: 'ADJUSTMENT', label: 'Adjustment', sign: '+' },
  { value: 'RETURN', label: 'Return', sign: '+' },
  { value: 'SALE', label: 'Sale', sign: '-' },
  { value: 'DAMAGE', label: 'Write-off / Damage', sign: '-' },
]

function clampInt(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.trunc(value)
}

export interface StockAdjustmentModalProps {
  readonly product: Product
  readonly open: boolean
  readonly onClose: () => void
}

export function StockAdjustmentModal({
  product,
  open,
  onClose,
}: Readonly<StockAdjustmentModalProps>) {
  const { adjustStock } = useInventory()
  const { toast } = useToast()

  const [type, setType] = useState<MovementType>('PURCHASE')
  const [quantityRaw, setQuantityRaw] = useState('1')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    setType('PURCHASE')
    setQuantityRaw('1')
    setNotes('')
  }, [open])

  const option = typeOptions.find((t) => t.value === type) ?? typeOptions[0]

  const quantity = useMemo(() => {
    const parsed = Number.parseInt(quantityRaw || '0', 10)
    return clampInt(parsed)
  }, [quantityRaw])

  const signedQuantity = option.sign === '-' ? -Math.abs(quantity) : Math.abs(quantity)
  const newBalance = product.stockCount + signedQuantity

  const canSubmit = quantity > 0 && Number.isFinite(newBalance)

  function submit() {
    if (!canSubmit) return
    adjustStock(product.id, signedQuantity, type, notes.trim() || undefined)
    toast({ title: 'Stock updated', description: `${product.name} is now ${Math.max(0, newBalance)} in stock.` })
    onClose()
  }

  return (
    <CrudModal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      title="Adjust stock"
      description="Record a stock movement and update available inventory."
      size="sm"
      variant="edit"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{product.name}</p>
          <p className="text-xs text-muted-foreground">
            Current stock: <span className="font-semibold text-foreground">{product.stockCount}</span>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock-type">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as MovementType)}>
            <SelectTrigger id="stock-type">
              <SelectValue placeholder="Select movement type" />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock-qty">Quantity</Label>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted/30 text-sm font-bold text-muted-foreground">
              {option.sign}
            </div>
            <Input
              id="stock-qty"
              inputMode="numeric"
              type="number"
              value={quantityRaw}
              onChange={(e) => setQuantityRaw(e.target.value)}
              min={1}
              step={1}
              className="h-10"
            />
          </div>
          <p className={cn('text-xs', newBalance < 0 ? 'text-destructive' : 'text-muted-foreground')}>
            New balance preview: {product.stockCount} → {Math.max(0, newBalance)}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock-notes">Notes (optional)</Label>
          <Textarea
            id="stock-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add context for this adjustment…"
            maxLength={500}
          />
        </div>
      </div>
    </CrudModal>
  )
}

