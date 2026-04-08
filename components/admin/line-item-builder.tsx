/** Editable invoice line items with live row totals. */
'use client'

import { Minus, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/utils'

export interface LineItemDraft {
  description: string
  quantity: number
  unitPrice: number
}

export interface LineItemBuilderProps {
  readonly items: LineItemDraft[]
  readonly onChange: (items: LineItemDraft[]) => void
}

function rowTotal(li: LineItemDraft): number {
  return Math.round(li.quantity * li.unitPrice * 100) / 100
}

export function LineItemBuilder({ items, onChange }: Readonly<LineItemBuilderProps>) {
  function update(idx: number, patch: Partial<LineItemDraft>) {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  function addRow() {
    onChange([...items, { description: '', quantity: 1, unitPrice: 0 }])
  }

  function removeRow(idx: number) {
    if (items.length <= 1) return
    onChange(items.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-12 gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="col-span-5">Description</span>
        <span className="col-span-2">Qty</span>
        <span className="col-span-2">Unit</span>
        <span className="col-span-2 text-right">Line</span>
        <span className="col-span-1" />
      </div>
      {items.map((li, idx) => (
        <div key={idx} className="grid grid-cols-12 items-center gap-2">
          <Input
            className="col-span-5 h-9"
            value={li.description}
            onChange={(e) => update(idx, { description: e.target.value })}
            placeholder="Description"
            aria-label={`Line ${idx + 1} description`}
          />
          <Input
            className="col-span-2 h-9"
            type="number"
            min={1}
            step={1}
            value={String(li.quantity)}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value || '1', 10)
              update(idx, { quantity: Number.isFinite(n) && n >= 1 ? n : 1 })
            }}
            aria-label={`Line ${idx + 1} quantity`}
          />
          <Input
            className="col-span-2 h-9"
            type="number"
            min={0}
            step={0.01}
            value={String(li.unitPrice)}
            onChange={(e) => {
              const n = Number.parseFloat(e.target.value || '0')
              update(idx, { unitPrice: Number.isFinite(n) && n >= 0 ? n : 0 })
            }}
            aria-label={`Line ${idx + 1} unit price`}
          />
          <p className="col-span-2 text-right text-sm font-semibold text-foreground">
            {formatPrice(rowTotal(li))}
          </p>
          <div className="col-span-1 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={items.length <= 1}
              onClick={() => removeRow(idx)}
              aria-label={`Remove line ${idx + 1}`}
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-1">
        <Plus className="h-4 w-4" />
        Add line item
      </Button>
    </div>
  )
}
