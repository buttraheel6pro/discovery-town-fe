/** Compact Learn program summary — period, session count, and weekly schedule days. */
'use client'

import { useMemo } from 'react'
import { Calendar } from 'lucide-react'

import {
  formatLearnProgramPeriodLabel,
  resolveLearnProgramBounds,
  resolveLearnProgramScheduleDaysLabel,
  resolveLearnProgramSessionsInBounds,
} from '@/lib/learn-enrollment'
import type { SchedulingService, SchedulingSlot } from '@/lib/types'

interface LearnProgramEnrollmentSummaryCardProps {
  readonly service: SchedulingService
  readonly slots: readonly SchedulingSlot[]
}

export function LearnProgramEnrollmentSummaryCard({
  service,
  slots,
}: Readonly<LearnProgramEnrollmentSummaryCardProps>) {
  const bounds = useMemo(
    () => resolveLearnProgramBounds(service, slots),
    [service, slots],
  )
  const sessionCount = useMemo(
    () => resolveLearnProgramSessionsInBounds(service, slots).length,
    [service, slots],
  )
  const scheduleDaysLabel = useMemo(
    () => resolveLearnProgramScheduleDaysLabel(service, slots),
    [service, slots],
  )

  if (!bounds || sessionCount === 0) {
    return null
  }

  return (
    <div className="mb-4 rounded-md border border-border bg-muted/30 px-3 py-2.5 text-xs">
      <p className="flex items-center gap-1.5 font-medium text-sm text-foreground">
        <Calendar className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
        {formatLearnProgramPeriodLabel(bounds)}
      </p>
      <p className="mt-1 text-muted-foreground">
        {sessionCount} session{sessionCount === 1 ? '' : 's'} included in enrollment
      </p>
      {scheduleDaysLabel ? (
        <p className="mt-0.5 text-muted-foreground">{scheduleDaysLabel}</p>
      ) : null}
    </div>
  )
}
