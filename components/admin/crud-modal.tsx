/** Reusable centered dialog for admin CRUD flows — auto-width by size, scrollable body. */
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

export type CrudModalSize = 'sm' | 'md' | 'lg'

export type CrudModalVariant = 'create' | 'edit' | 'view' | 'delete'

const sizeClassName: Record<CrudModalSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-xl',
  lg: 'sm:max-w-4xl',
}

export interface CrudModalProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly title: string
  readonly description?: string | null
  readonly children?: React.ReactNode
  readonly footer?: React.ReactNode
  readonly size?: CrudModalSize
  readonly variant?: CrudModalVariant
  readonly className?: string
  readonly bodyClassName?: string
  readonly showCloseButton?: boolean
  /**
   * Controls where scrolling happens when content exceeds viewport height.
   * - section: header/footer fixed; body scrolls (default)
   * - dialog: whole dialog scrolls (no inner scroll container)
   */
  readonly scrollMode?: 'section' | 'dialog'
}

export function CrudModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  variant = 'edit',
  className,
  bodyClassName,
  showCloseButton = true,
  scrollMode = 'section',
}: Readonly<CrudModalProps>) {
  const sectionScroll = scrollMode === 'section'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={showCloseButton}
        className={cn(
          sectionScroll
            ? 'flex max-h-[min(90vh,900px)] flex-col gap-0 p-0'
            : 'max-h-[90vh] overflow-y-auto p-0',
          sizeClassName[size],
          variant === 'delete' && 'border-destructive/40',
          className,
        )}
      >
        <DialogHeader className="shrink-0 space-y-2 border-b border-border px-6 py-4 text-left">
          <DialogTitle
            className="text-lg font-semibold"
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

        {children != null ? (
          <div
            className={cn(
              sectionScroll
                ? 'min-h-0 flex-1 overflow-y-auto px-6 py-4'
                : 'px-6 py-4',
              bodyClassName,
            )}
          >
            {children}
          </div>
        ) : null}

        {footer ? (
          <DialogFooter
            className={cn(
              'border-t border-border px-6 py-4 sm:justify-end',
              sectionScroll ? 'shrink-0' : 'sticky bottom-0 bg-background',
            )}
          >
            {footer}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
