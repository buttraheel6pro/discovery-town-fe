/** ServiceScrollCardSkeleton — loading placeholder matching ServiceScrollCard dimensions. */

import { cn } from '@/lib/utils'

export interface ServiceScrollCardSkeletonProps {
  readonly className?: string
}

export function ServiceScrollCardSkeleton({ className }: Readonly<ServiceScrollCardSkeletonProps>) {
  return (
    <div
      className={cn(
        'flex w-[280px] shrink-0 snap-start sm:w-[300px]',
        className,
      )}
    >
      <div className="flex w-full animate-pulse flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="aspect-[16/9] w-full bg-muted/40" />
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="space-y-2">
            <div className="h-4 w-3/4 rounded bg-muted/40" />
            <div className="h-3 w-full rounded bg-muted/30" />
            <div className="h-3 w-2/3 rounded bg-muted/30" />
          </div>
          <div className="mt-auto space-y-2">
            <div className="h-3 w-24 rounded bg-muted/30" />
            <div className="h-3 w-20 rounded bg-muted/30" />
          </div>
          <div className="h-9 w-full rounded-md bg-muted/40" />
        </div>
      </div>
    </div>
  )
}
