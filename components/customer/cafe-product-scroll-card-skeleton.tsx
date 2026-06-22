/** Loading placeholder for CafeProductScrollCard in horizontal rails. */
'use client'

import { cn } from '@/lib/utils'

interface CafeProductScrollCardSkeletonProps {
  readonly className?: string
}

export function CafeProductScrollCardSkeleton({ className }: CafeProductScrollCardSkeletonProps) {
  return (
    <div
      className={cn(
        'w-[260px] sm:w-[280px] flex-shrink-0 rounded-xl border border-border bg-card overflow-hidden',
        className,
      )}
    >
      {/* Image placeholder */}
      <div className="aspect-[4/3] w-full animate-pulse bg-muted" />

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Name */}
        <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />

        {/* Description */}
        <div className="h-3 w-full animate-pulse rounded bg-muted" />

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-1">
          <div className="h-5 w-12 animate-pulse rounded bg-muted" />
          <div className="h-7 w-14 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}
