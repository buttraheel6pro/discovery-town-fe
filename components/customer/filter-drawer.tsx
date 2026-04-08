/** Filter drawer — reusable sheet for listing page filters. */

'use client'

import { SlidersHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export interface FilterDrawerProps {
  title: string
  activeCount?: number
  triggerLabel?: string
  children: React.ReactNode
  onClear?: () => void
  className?: string
}

export function FilterDrawer({
  title,
  activeCount = 0,
  triggerLabel = 'Filters',
  children,
  onClear,
  className,
}: Readonly<FilterDrawerProps>) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className={cn('gap-2', className)}
          aria-label={triggerLabel}
        >
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <span>{triggerLabel}</span>
          {activeCount > 0 ? (
            <span className="ml-1 text-xs font-bold text-accent">
              ({activeCount})
            </span>
          ) : null}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-11/12 sm:max-w-sm">
        <SheetHeader>
          <SheetTitle style={{ fontFamily: 'var(--font-barlow)' }}>
            {title}
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-4 space-y-6 overflow-auto">{children}</div>

        {onClear ? (
          <SheetFooter>
            <Button variant="outline" onClick={onClear}>
              Clear filters
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

