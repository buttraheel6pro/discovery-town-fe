/** Revenue share by category — donut chart. */
'use client'

import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import type { CategoryRevenue } from '@/lib/types'
import { CHART_COLORS, formatPrice } from '@/lib/utils'

export interface RevenueCategoryDonutProps {
  readonly data: CategoryRevenue[]
  readonly className?: string
}

export function RevenueCategoryDonut({ data, className }: Readonly<RevenueCategoryDonutProps>) {
  const total = useMemo(() => data.reduce((s, d) => s + d.total, 0), [data])

  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl border border-border text-sm text-muted-foreground">
        No category data
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="relative h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="78%"
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS.categories[i % CHART_COLORS.categories.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number | string) => formatPrice(Number(v))}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs font-medium text-muted-foreground">Total</p>
          <p className="text-lg font-black text-foreground" style={{ fontFamily: 'var(--font-barlow)' }}>
            {formatPrice(total)}
          </p>
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {data.map((d, i) => (
          <li key={d.category} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: CHART_COLORS.categories[i % CHART_COLORS.categories.length],
              }}
            />
            {d.category} ({d.percentage.toFixed(1)}%)
          </li>
        ))}
      </ul>
    </div>
  )
}
