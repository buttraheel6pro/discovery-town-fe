/** Stock movement timeline — chronological stock history list. */

import { formatDistanceToNow, parseISO } from 'date-fns'

import { Badge } from '@/components/ui/badge'
import { cn, formatPrice } from '@/lib/utils'
import type { StockMovement } from '@/lib/types'

const typeStyles: Record<StockMovement['movementType'], string> = {
  PURCHASE: 'bg-green-100 text-green-700',
  SALE: 'bg-blue-100 text-blue-700',
  ADJUSTMENT: 'bg-slate-100 text-slate-700',
  RETURN: 'bg-amber-100 text-amber-700',
  DAMAGE: 'bg-red-100 text-red-700',
}

function qtyClassName(qty: number): string {
  return qty >= 0 ? 'text-green-700' : 'text-red-700'
}

export interface StockMovementTimelineProps {
  readonly movements: StockMovement[]
  readonly className?: string
}

export function StockMovementTimeline({
  movements,
  className,
}: Readonly<StockMovementTimelineProps>) {
  if (movements.length === 0) {
    return (
      <div className={cn('rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground', className)}>
        No stock history.
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {movements.map((m) => {
        const when = parseISO(m.createdAt)
        const rel = Number.isNaN(when.getTime()) ? '—' : formatDistanceToNow(when, { addSuffix: true })
        const qty = m.quantity
        const qtyLabel = `${qty >= 0 ? '+' : ''}${qty}`

        return (
          <div key={m.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn('text-xs font-semibold', typeStyles[m.movementType])}>
                  {m.movementType}
                </Badge>
                <span className={cn('text-sm font-bold', qtyClassName(qty))}>{qtyLabel}</span>
                <span className="text-xs text-muted-foreground">
                  Balance after: <span className="font-semibold text-foreground">{m.newStock}</span>
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{rel}</span>
            </div>

            {m.notes ? (
              <p className="mt-2 text-sm text-muted-foreground">{m.notes}</p>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

