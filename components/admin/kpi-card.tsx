/** Metric card for admin dashboard and reports — matches admin Card pattern. */
'use client'

import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ComparisonDelta } from '@/components/admin/comparison-delta'
import { cn, formatPrice } from '@/lib/utils'

export interface KpiCardProps {
  readonly value: string | number
  readonly label: string
  readonly deltaCurrent?: number
  readonly deltaPrevious?: number
  readonly deltaLabel?: string
  readonly icon?: LucideIcon
  readonly accentColor?: 'blue' | 'green' | 'amber' | 'red'
  readonly href?: string
  readonly valueIsCurrency?: boolean
  readonly className?: string
}

const accentText: Record<NonNullable<KpiCardProps['accentColor']>, string> = {
  blue: 'text-primary',
  green: 'text-green-600',
  amber: 'text-amber-600',
  red: 'text-destructive',
}

export function KpiCard({
  value,
  label,
  deltaCurrent,
  deltaPrevious,
  deltaLabel = 'vs prior',
  icon: Icon,
  accentColor,
  href,
  valueIsCurrency = false,
  className,
}: Readonly<KpiCardProps>) {
  const display =
    typeof value === 'number' && valueIsCurrency ? formatPrice(value) : String(value)

  const valueClass = accentColor ? accentText[accentColor] : 'text-foreground'

  const inner = (
    <Card
      className={cn(
        'transition-shadow hover:shadow-md',
        href && 'cursor-pointer',
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {Icon ? <Icon className="h-5 w-5 text-muted-foreground" aria-hidden /> : null}
      </CardHeader>
      <CardContent>
        <div
          className={cn('text-2xl font-bold', valueClass)}
          style={{ fontFamily: 'var(--font-barlow)' }}
        >
          {display}
        </div>
        {deltaCurrent != null && deltaPrevious != null ? (
          <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">{deltaLabel}</span>
            <ComparisonDelta current={deltaCurrent} previous={deltaPrevious} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
        {inner}
      </Link>
    )
  }

  return inner
}
