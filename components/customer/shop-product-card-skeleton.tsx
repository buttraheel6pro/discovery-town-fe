/** ShopProductCardSkeleton — loading skeleton matching ShopProductCard dimensions. */

import { cn } from '@/lib/utils'

export interface ShopProductCardSkeletonProps {
  readonly className?: string
}

export function ShopProductCardSkeleton({ className }: Readonly<ShopProductCardSkeletonProps>) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card',
        className,
      )}
    >
      <div className="aspect-[4/3] bg-muted/40" />
      <div className="space-y-3 p-5">
        <div className="space-y-2">
          <div className="h-4 w-3/4 rounded bg-muted/40" />
          <div className="h-3 w-1/3 rounded bg-muted/30" />
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-2">
            <div className="h-3 w-16 rounded bg-muted/30" />
            <div className="h-5 w-24 rounded bg-muted/40" />
          </div>
          <div className="h-5 w-20 rounded bg-muted/30" />
        </div>
        <div className="h-9 w-full rounded-md bg-muted/40" />
      </div>
    </div>
  )
}

