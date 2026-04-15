/** Shared visual container to keep section blocks prominent and consistent. */
import { cn } from '@/lib/utils'

interface ProminentSectionContainerProps {
  readonly children: React.ReactNode
  readonly className?: string
}

export function ProminentSectionContainer({
  children,
  className,
}: Readonly<ProminentSectionContainerProps>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-gradient-to-b from-card to-card/70 p-5 shadow-sm md:p-6',
        className,
      )}
    >
      {children}
    </div>
  )
}
