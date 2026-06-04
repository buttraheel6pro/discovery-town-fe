/** Revenue by payment gateway — horizontal bars. */
'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { GatewayRevenue } from '@/lib/types'
import { CHART_COLORS, formatPrice } from '@/lib/utils'

export interface GatewayRevenueChartProps {
  readonly data: GatewayRevenue[]
  readonly className?: string
}

export function GatewayRevenueChart({ data, className }: Readonly<GatewayRevenueChartProps>) {
  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-xl border border-border text-sm text-muted-foreground">
        No gateway data
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} margin={{ left: 16, right: 16, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="gateway" width={100} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v: number | string, _n, p) => {
                const payload = p?.payload as GatewayRevenue | undefined
                const count = payload?.count ?? 0
                return [`${formatPrice(Number(v))} (${count} tx)`, 'Revenue']
              }}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))',
              }}
            />
            <Bar dataKey="total" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
