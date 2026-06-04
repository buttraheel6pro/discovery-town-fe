/** Customer booking modal — title, description, scrollable body, footer actions. */
'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export type HouseholdBookingModalSize = 'sm' | 'md'

const sizeClassName: Record<HouseholdBookingModalSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-xl',
}

export interface HouseholdBookingModalProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly title: string
  readonly description?: string | null
  readonly children?: React.ReactNode
  readonly footer?: React.ReactNode
  readonly size?: HouseholdBookingModalSize
  readonly className?: string
  readonly bodyClassName?: string
}

export function HouseholdBookingModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
  bodyClassName,
}: Readonly<HouseholdBookingModalProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex max-h-[min(90vh,720px)] flex-col gap-0 p-0',
          sizeClassName[size],
          className,
        )}
      >
        <DialogHeader className="shrink-0 space-y-1.5 border-b border-border px-6 py-4 text-left">
          <DialogTitle
            className="text-lg font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {children ? (
          <div
            className={cn(
              'min-h-0 flex-1 overflow-y-auto px-6 py-4',
              bodyClassName,
            )}
          >
            {children}
          </div>
        ) : null}

        {footer ? (
          <DialogFooter className="shrink-0 gap-2 border-t border-border px-6 py-4 sm:justify-end">
            {footer}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
