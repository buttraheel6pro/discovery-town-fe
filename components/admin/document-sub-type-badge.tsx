/** Document sub-type badge — who signs (participant vs organiser). */
'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DocumentSubType } from '@/lib/types'

export interface DocumentSubTypeBadgeProps {
  readonly subType: DocumentSubType | undefined
  readonly className?: string
}

export function DocumentSubTypeBadge({
  subType,
  className,
}: Readonly<DocumentSubTypeBadgeProps>) {
  if (!subType) return null

  if (subType === 'GUEST') {
    return (
      <Badge className={cn('text-xs font-semibold bg-blue-100 text-blue-700', className)}>
        Participant signs
      </Badge>
    )
  }

  return (
    <Badge className={cn('text-xs font-semibold bg-slate-900 text-white', className)}>
      Organiser signs
    </Badge>
  )
}

