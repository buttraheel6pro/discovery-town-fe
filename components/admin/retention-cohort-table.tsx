/** Cohort retention matrix — CSS Grid with tooltips. */
'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { CohortMatrix } from '@/lib/types'
import { cn, getCohortCellColor, getCohortCellTextColor } from '@/lib/utils'

export interface RetentionCohortTableProps {
  readonly data: CohortMatrix
  readonly className?: string
}

export function RetentionCohortTable({ data, className }: Readonly<RetentionCohortTableProps>) {
  const { rows, maxMonths } = data

  return (
    <TooltipProvider>
      <div className={cn('overflow-x-auto rounded-xl border border-border', className)}>
        <div
          className="grid min-w-[640px] gap-px bg-border p-px"
          style={{
            gridTemplateColumns: `minmax(120px,1fr) minmax(64px,auto) repeat(${maxMonths}, minmax(72px,1fr))`,
          }}
        >
          <div className="bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground">Cohort</div>
          <div className="bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground">Users</div>
          {Array.from({ length: maxMonths }, (_, i) => (
            <div
              key={i}
              className="bg-muted/50 px-2 py-2 text-center text-xs font-semibold text-foreground"
            >
              M{i + 1}
            </div>
          ))}

          {rows.map((row) => (
            <div key={row.cohortMonth} className="contents">
              <div className="bg-card px-3 py-2 text-sm font-medium text-foreground">
                {row.cohortLabel}
              </div>
              <div className="bg-card px-3 py-2 text-sm text-muted-foreground">{row.startCount}</div>
              {row.retention.slice(0, maxMonths).map((pct, idx) => (
                <Tooltip key={`${row.cohortMonth}-${idx}`}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'flex min-h-[40px] items-center justify-center text-xs font-semibold',
                        getCohortCellColor(pct),
                        getCohortCellTextColor(pct),
                      )}
                    >
                      {pct === null ? '' : `${pct}%`}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {pct === null
                      ? 'Future period'
                      : `${pct}% of ${row.cohortLabel} still active in month ${idx + 1}`}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  )
}
