/** Image thumbnail that opens a hover preview card on mouse-over — shared catalog list pattern. */
'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import { Eye } from 'lucide-react'

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { cn } from '@/lib/utils'

export const CATALOG_PREVIEW_CARD_CLASS =
  'w-80 space-y-0 overflow-hidden rounded-xl border border-border bg-card p-0'

interface CatalogItemImagePreviewProps {
  readonly imageSrc: string
  readonly label: string
  readonly children: ReactNode
}

export function CatalogItemImagePreview({
  imageSrc,
  label,
  children,
}: Readonly<CatalogItemImagePreviewProps>) {
  return (
    <HoverCard openDelay={120} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className={cn(
            'group/image relative block h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted',
            'cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
          aria-label={`Preview ${label}`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => event.stopPropagation()}
        >
          <Image
            src={imageSrc}
            alt=""
            fill
            className="object-cover"
            sizes="56px"
            aria-hidden
          />
          <span
            className={cn(
              'pointer-events-none absolute inset-0 flex items-center justify-center',
              'bg-black/45 text-white opacity-0 transition-opacity',
              'group-hover/image:opacity-100 group-focus-visible/image:opacity-100',
            )}
            aria-hidden
          >
            <Eye className="h-5 w-5" />
          </span>
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="right" align="start" className={CATALOG_PREVIEW_CARD_CLASS}>
        {children}
      </HoverCardContent>
    </HoverCard>
  )
}
