/** Publish status badge — Draft vs Published for sessions. */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function PublishStatusBadge({
  isActive,
  className,
}: Readonly<{ isActive: boolean; className?: string }>) {
  const styles = isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
  return (
    <Badge className={cn('text-xs font-semibold', styles, className)}>
      {isActive ? 'Published' : 'Draft'}
    </Badge>
  )
}

