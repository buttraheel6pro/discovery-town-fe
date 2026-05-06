/** Attribute chip — emoji + label with configurable background tint. */
'use client'

import { cn } from '@/lib/utils'
import type { AttributeOption } from '@/lib/types'

export interface CafeAttributeChipProps {
  readonly option: AttributeOption
  readonly className?: string
}

export function CafeAttributeChip({ option, className }: Readonly<CafeAttributeChipProps>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs font-medium',
        className,
      )}
      style={{
        backgroundColor: `${option.color}22`,
        borderColor: `${option.color}44`,
      }}
    >
      <span aria-hidden>{option.emoji}</span>
      <span>{option.label}</span>
    </span>
  )
}
