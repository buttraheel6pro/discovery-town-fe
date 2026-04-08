/** Period comparison — up/down/flat with color. */
'use client'

import { TrendingDown, TrendingUp } from 'lucide-react'

import { calcPeriodComparison, formatPrice } from '@/lib/utils'

export interface ComparisonDeltaProps {
  readonly current: number
  readonly previous: number
  readonly format?: 'currency' | 'number' | 'percent'
}

export function ComparisonDelta({
  current,
  previous,
  format = 'percent',
}: Readonly<ComparisonDeltaProps>) {
  const { changePercent, changeDirection } = calcPeriodComparison(current, previous)

  const label =
    format === 'currency'
      ? formatPrice(current - previous)
      : format === 'number'
        ? `${current - previous >= 0 ? '+' : ''}${current - previous}`
        : `${changePercent}%`

  if (changeDirection === 'flat') {
    return <span className="text-xs font-semibold text-muted-foreground">→ 0%</span>
  }

  if (changeDirection === 'up') {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-green-600">
        <TrendingUp className="h-3.5 w-3.5" aria-hidden />
        +{format === 'percent' ? `${changePercent}%` : label}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-500">
      <TrendingDown className="h-3.5 w-3.5" aria-hidden />
      {format === 'percent' ? `-${changePercent}%` : label}
    </span>
  )
}
