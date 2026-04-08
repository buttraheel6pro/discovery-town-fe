/** Sticky filter column on large screens; collapsible panel on small screens. */
'use client'

import { ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface FilterSidebarProps {
  readonly title?: string
  readonly activeCount?: number
  readonly onClear?: () => void
  readonly clearLabel?: string
  readonly children: React.ReactNode
  readonly className?: string
}

export function FilterSidebar({
  title = 'Filters',
  activeCount = 0,
  onClear,
  clearLabel = 'Clear filters',
  children,
  className,
}: Readonly<FilterSidebarProps>) {
  return (
    <>
      <details className="group mb-6 rounded-lg border border-border bg-card lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-semibold text-foreground [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            {title}
            {activeCount > 0 ? (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
                {activeCount}
              </span>
            ) : null}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-6 border-t border-border px-4 py-4">{children}</div>
        {onClear ? (
          <div className="border-t border-border px-4 py-3">
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={onClear}>
              {clearLabel}
            </Button>
          </div>
        ) : null}
      </details>

      <aside
        className={cn(
          'hidden w-60 shrink-0 space-y-6 rounded-lg border border-border bg-card p-4 lg:block lg:sticky lg:top-24 lg:self-start',
          className,
        )}
        aria-label={title}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">{title}</h2>
          {activeCount > 0 ? (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
              {activeCount}
            </span>
          ) : null}
        </div>
        <div className="space-y-6">{children}</div>
        {onClear ? (
          <Button type="button" variant="outline" size="sm" className="w-full" onClick={onClear}>
            {clearLabel}
          </Button>
        ) : null}
      </aside>
    </>
  )
}
