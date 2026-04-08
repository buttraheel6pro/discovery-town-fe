/** TagPill — small colored pill for contact tags with optional remove button. */
'use client'

import { X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ContactTag } from '@/lib/types'

interface TagPillProps {
  readonly tag: ContactTag
  readonly onRemove?: (tagId: string) => void
  readonly className?: string
}

export function TagPill({
  tag,
  onRemove,
  className,
}: Readonly<TagPillProps>) {
  return (
    <Badge
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium border-none',
        className,
      )}
      style={{ backgroundColor: tag.color }}
    >
      <span className="truncate max-w-[7rem]">{tag.name}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={() => onRemove(tag.id)}
          className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition-colors"
          aria-label={`Remove ${tag.name}`}
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </Badge>
  )
}

