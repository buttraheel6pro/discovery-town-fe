/** Free-form membership benefit lines (bullets) — add/remove custom text only. */
'use client'

import { useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface MembershipBenefitPickerProps {
  readonly title: string
  readonly description?: string
  readonly selected: readonly string[]
  readonly onChange: (next: string[]) => void
}

export function MembershipBenefitPicker({
  title,
  description,
  selected,
  onChange,
}: Readonly<MembershipBenefitPickerProps>) {
  const customFieldId = useId()
  const [customLine, setCustomLine] = useState('')

  function addCustom() {
    const t = customLine.trim()
    if (!t || selected.some((s) => s.trim() === t)) return
    onChange([...selected, t])
    setCustomLine('')
  }

  function removeAt(index: number) {
    onChange(selected.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {selected.length > 0 ? (
        <ul className="space-y-2">
          {selected.map((line, i) => (
            <li
              key={`${i}-${line.slice(0, 32)}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
            >
              <span className="text-sm text-foreground">{line}</span>
              <Button type="button" size="sm" variant="outline" onClick={() => removeAt(i)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No benefit lines yet.</p>
      )}

      <div className="space-y-2">
        <Label htmlFor={customFieldId}>Add benefit line</Label>
        <div className="flex flex-wrap gap-2">
          <Input
            id={customFieldId}
            value={customLine}
            onChange={(e) => setCustomLine(e.target.value)}
            placeholder="e.g. Unlimited weekday play"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustom()
              }
            }}
          />
          <Button type="button" variant="secondary" onClick={addCustom}>
            Add line
          </Button>
        </div>
      </div>
    </div>
  )
}
