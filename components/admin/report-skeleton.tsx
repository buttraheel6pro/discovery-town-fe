/** Loading placeholders for reports pages. */
'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface ReportSkeletonProps {
  readonly variant: 'cards' | 'chart' | 'table'
  readonly className?: string
}

export function ReportSkeleton({ variant, className }: Readonly<ReportSkeletonProps>) {
  if (variant === 'cards') {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-5', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>
    )
  }

  if (variant === 'chart') {
    return <Skeleton className={cn('h-[280px] w-full rounded-xl', className)} />
  }

  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-md" />
      ))}
    </div>
  )
}
