/** Loading placeholder for ShopProductScrollCard in horizontal rails. */
'use client'

import { cn } from '@/lib/utils'

interface ShopProductScrollCardSkeletonProps {
  readonly className?: string
}

export function ShopProductScrollCardSkeleton({ className }: ShopProductScrollCardSkeletonProps) {
  return (
    <div
      className={cn(
        'w-[220px] sm:w-[240px] flex-shrink-0 rounded-xl border border-border bg-card overflow-hidden',
        className,
      )}
    >
      <div className="aspect-square w-full animate-pulse bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-5 w-12 animate-pulse rounded bg-muted" />
          <div className="h-7 w-14 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}
