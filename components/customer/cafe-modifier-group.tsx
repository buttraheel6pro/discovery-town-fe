/** Single modifier group — radio or checkbox list from maxSelect. */
'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { getModifierSelectionType } from '@/lib/cafe-utils'
import { cn, formatPrice } from '@/lib/utils'
import type { CafeModifier, ModifierGroup } from '@/lib/types'

export interface CafeModifierGroupProps {
  readonly group: ModifierGroup
  readonly selectedIds: string[]
  readonly onChange: (nextIds: string[]) => void
}

export function CafeModifierGroup({
  group,
  selectedIds,
  onChange,
}: Readonly<CafeModifierGroupProps>) {
  const ui = getModifierSelectionType(group.maxSelect)

  function setRadio(id: string) {
    onChange([id])
  }

  function toggleCheckbox(id: string) {
    const has = selectedIds.includes(id)
    if (has) {
      onChange(selectedIds.filter((x) => x !== id))
      return
    }
    if (selectedIds.length >= group.maxSelect) return
    onChange([...selectedIds, id])
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <h3 className="text-base font-semibold">{group.name}</h3>
        <span
          className={cn(
            'text-xs font-medium',
            group.isRequired ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
          )}
        >
          {group.isRequired ? '(required)' : '(optional)'}
        </span>
      </div>

      {ui === 'radio' ? (
        <RadioGroup
          value={selectedIds[0] ?? ''}
          onValueChange={(v) => {
            if (v) setRadio(v)
          }}
          className="gap-2"
        >
          {group.modifiers.map((m) => (
            <ModifierRadioRow key={m.id} groupId={group.id} modifier={m} />
          ))}
        </RadioGroup>
      ) : (
        <div className="space-y-2">
          {group.modifiers.map((m) => {
            const checked = selectedIds.includes(m.id)
            const atCap = !checked && selectedIds.length >= group.maxSelect
            return (
              <label
                key={m.id}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border px-3 py-2',
                  atCap && 'opacity-50',
                )}
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={checked}
                    disabled={atCap}
                    onCheckedChange={() => toggleCheckbox(m.id)}
                  />
                  <span className="text-sm font-medium">{m.name}</span>
                </div>
                {m.priceDelta !== 0 ? (
                  <span className="text-xs text-muted-foreground">
                    {m.priceDelta > 0 ? '+' : ''}
                    {formatPrice(m.priceDelta)}
                  </span>
                ) : null}
              </label>
            )
          })}
          {selectedIds.length >= group.maxSelect ? (
            <p className="text-xs text-muted-foreground">Max {group.maxSelect} selected</p>
          ) : null}
        </div>
      )}
    </div>
  )
}

function ModifierRadioRow({
  groupId,
  modifier,
}: Readonly<{ groupId: string; modifier: CafeModifier }>) {
  const delta =
    modifier.priceDelta !== 0
      ? `${modifier.priceDelta > 0 ? '+' : ''}${formatPrice(modifier.priceDelta)}`
      : ''
  return (
    <div className="flex items-center space-x-2 rounded-lg border border-transparent px-2 py-1 hover:bg-muted/50">
      <RadioGroupItem value={modifier.id} id={`${groupId}-${modifier.id}`} />
      <Label htmlFor={`${groupId}-${modifier.id}`} className="flex flex-1 cursor-pointer justify-between gap-2">
        <span>{modifier.name}</span>
        {delta ? <span className="text-xs text-muted-foreground">{delta}</span> : null}
      </Label>
    </div>
  )
}
