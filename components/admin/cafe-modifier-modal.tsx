/** Shared modifier picker for cafe POS and flows — radio vs checkbox from maxSelect. */
'use client'

import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  defaultModifierSelections,
  getModifierSelectionType,
  modifierGroupsForProduct,
  modifiersSatisfied,
  sumModifierDeltaForGroups,
} from '@/lib/cafe-utils'
import { cn, formatPrice } from '@/lib/utils'
import type { CafeModifier, CafeProduct, ModifierGroup } from '@/lib/types'

export interface CafeModifierConfirmPayload {
  selectedByGroup: Record<string, string[]>
  quantity: number
  lineTotal: number
  modifierTotal: number
}

export interface CafeModifierModalProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly product: CafeProduct | null
  readonly modifierGroups: ModifierGroup[]
  readonly onConfirm: (payload: CafeModifierConfirmPayload) => void
}

function groupsForProduct(
  product: CafeProduct,
  all: ModifierGroup[],
): ModifierGroup[] {
  const map = new Map(all.map((g) => [g.id, g]))
  return product.modifierGroupIds.map((id) => map.get(id)).filter(Boolean) as ModifierGroup[]
}

function ModifierOptionRow({
  group,
  modifier,
  checked,
  onToggle,
  disabled,
  ui,
}: Readonly<{
  group: ModifierGroup
  modifier: CafeModifier
  checked: boolean
  onToggle: () => void
  disabled: boolean
  ui: 'radio' | 'checkbox'
}>) {
  const deltaLabel =
    modifier.priceDelta > 0 ? `+${formatPrice(modifier.priceDelta)}` : modifier.priceDelta < 0
      ? formatPrice(modifier.priceDelta)
      : ''

  if (ui === 'radio') {
    return (
      <div className="flex items-center space-x-2 rounded-lg border border-transparent px-2 py-1.5 hover:bg-muted/40">
        <RadioGroupItem value={modifier.id} id={`${group.id}-${modifier.id}`} />
        <Label htmlFor={`${group.id}-${modifier.id}`} className="flex flex-1 cursor-pointer justify-between gap-2">
          <span>{modifier.name}</span>
          {deltaLabel ? (
            <span className="text-xs text-muted-foreground">{deltaLabel}</span>
          ) : null}
        </Label>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 rounded-lg border border-transparent px-2 py-1.5 hover:bg-muted/40">
      <Checkbox
        id={`${group.id}-${modifier.id}`}
        checked={checked}
        disabled={disabled}
        onCheckedChange={() => onToggle()}
      />
      <Label htmlFor={`${group.id}-${modifier.id}`} className="flex flex-1 cursor-pointer justify-between gap-2">
        <span>{modifier.name}</span>
        {deltaLabel ? (
          <span className="text-xs text-muted-foreground">{deltaLabel}</span>
        ) : null}
      </Label>
    </div>
  )
}

export function CafeModifierModal({
  open,
  onOpenChange,
  product,
  modifierGroups,
  onConfirm,
}: Readonly<CafeModifierModalProps>) {
  const groups = useMemo(() => {
    if (!product) return []
    return modifierGroupsForProduct(product, modifierGroups)
  }, [product, modifierGroups])

  const [selectedByGroup, setSelectedByGroup] = useState<Record<string, string[]>>({})
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (!open || !product) return
    setSelectedByGroup(defaultModifierSelections(groups))
    setQuantity(1)
  }, [open, product, groups])

  const modifierTotal = useMemo(
    () => sumModifierDeltaForGroups(groups, selectedByGroup),
    [groups, selectedByGroup],
  )

  const unitPrice = (product?.basePrice ?? 0) + modifierTotal
  const lineTotal = unitPrice * quantity
  const canSubmit = product != null && modifiersSatisfied(groups, selectedByGroup)

  function setRadioGroup(groupId: string, modifierId: string) {
    setSelectedByGroup((prev) => ({ ...prev, [groupId]: [modifierId] }))
  }

  function toggleCheckboxGroup(group: ModifierGroup, modifierId: string) {
    setSelectedByGroup((prev) => {
      const cur = prev[group.id] ?? []
      const has = cur.includes(modifierId)
      let next: string[]
      if (has) {
        next = cur.filter((id) => id !== modifierId)
      } else if (cur.length >= group.maxSelect) {
        return prev
      } else {
        next = [...cur, modifierId]
      }
      return { ...prev, [group.id]: next }
    })
  }

  function handleConfirm() {
    if (!product || !canSubmit) return
    onConfirm({
      selectedByGroup,
      quantity,
      lineTotal,
      modifierTotal,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle style={{ fontFamily: 'var(--font-barlow)' }}>
            {product?.name ?? 'Customise'}
          </DialogTitle>
          {product?.notes?.trim() ? (
            <p className="text-sm text-muted-foreground">📝 {product.notes}</p>
          ) : null}
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] px-6">
          <div className="space-y-6 pb-4">
            {groups.map((group) => {
              const ui = getModifierSelectionType(group.maxSelect)
              const selected = selectedByGroup[group.id] ?? []

              return (
                <div key={group.id} className="space-y-2">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <p className="text-sm font-semibold">{group.name}</p>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        group.isRequired ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
                      )}
                    >
                      {group.isRequired ? '(required)' : '(optional)'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {group.maxSelect === 1
                        ? '(pick one)'
                        : `(up to ${group.maxSelect})`}
                    </span>
                  </div>

                  {ui === 'radio' ? (
                    <RadioGroup
                      value={selected[0] ?? ''}
                      onValueChange={(v) => {
                        if (v) setRadioGroup(group.id, v)
                      }}
                      className="gap-1"
                    >
                      {group.modifiers.map((m) => (
                        <ModifierOptionRow
                          key={m.id}
                          group={group}
                          modifier={m}
                          checked={selected.includes(m.id)}
                          ui="radio"
                          disabled={false}
                          onToggle={() => setRadioGroup(group.id, m.id)}
                        />
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="space-y-1">
                      {group.modifiers.map((m) => {
                        const checked = selected.includes(m.id)
                        const atCap = !checked && selected.length >= group.maxSelect
                        return (
                          <ModifierOptionRow
                            key={m.id}
                            group={group}
                            modifier={m}
                            checked={checked}
                            ui="checkbox"
                            disabled={atCap}
                            onToggle={() => toggleCheckboxGroup(group, m.id)}
                          />
                        )
                      })}
                      {selected.length >= group.maxSelect ? (
                        <p className="text-xs text-muted-foreground">Max {group.maxSelect} selected</p>
                      ) : null}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>

        <Separator />

        <div className="space-y-4 p-6 pt-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Quantity</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                −
              </Button>
              <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={quantity >= 10}
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                aria-label="Increase quantity"
              >
                +
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-bold">{formatPrice(lineTotal)}</span>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border p-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!canSubmit} onClick={handleConfirm}>
            Add — {formatPrice(unitPrice)} × {quantity} = {formatPrice(lineTotal)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
