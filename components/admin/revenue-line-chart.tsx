/** Net revenue over time with optional daily/weekly/monthly toggle. */
'use client'

import { useMemo, useState } from 'react'
import { format, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ChartToggle, type ChartGranularity } from '@/components/admin/chart-toggle'
import type { DailyRevenue } from '@/lib/types'
import { CHART_COLORS, formatPrice } from '@/lib/utils'

export interface RevenueLineChartProps {
  readonly data: DailyRevenue[]
  readonly toggle?: boolean
  readonly height?: number
}

function aggregateData(data: DailyRevenue[], mode: ChartGranularity): DailyRevenue[] {
  if (mode === 'daily') return data

  const map = new Map<string, { gross: number; refunds: number; net: number }>()

  for (const row of data) {
    const d = parseISO(row.date)
    let key: string
    if (mode === 'weekly') {
      const wk = startOfWeek(d, { weekStartsOn: 1 })
      key = format(wk, 'yyyy-MM-dd')
    } else {
      const mo = startOfMonth(d)
      key = format(mo, 'yyyy-MM')
    }
    const cur = map.get(key) ?? { gross: 0, refunds: 0, net: 0 }
    cur.gross += row.gross
    cur.refunds += row.refunds
    cur.net += row.net
    map.set(key, cur)
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      gross: Math.round(v.gross * 100) / 100,
      refunds: Math.round(v.refunds * 100) / 100,
      net: Math.round(v.net * 100) / 100,
    }))
}

export function RevenueLineChart({
  data,
  toggle = false,
  height = 280,
}: Readonly<RevenueLineChartProps>) {
  const [granularity, setGranularity] = useState<ChartGranularity>('daily')

  const chartData = useMemo(
    () => aggregateData(data, toggle ? granularity : 'daily'),
    [data, granularity, toggle],
  )

  return (
    <div className="space-y-3">
      {toggle ? (
        <ChartToggle value={granularity} onChange={setGranularity} />
      ) : null}
      <div style={{ height }} className="w-full min-h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickFormatter={(d) => {
                try {
                  return format(parseISO(d), granularity === 'monthly' ? 'MMM yy' : 'd MMM')
                } catch {
                  return d
                }
              }}
            />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              formatter={(v: number | string) => [formatPrice(Number(v)), 'Net']}
              labelFormatter={(d) => {
                try {
                  return format(parseISO(d), 'd MMM yyyy')
                } catch {
                  return String(d)
                }
              }}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))',
              }}
            />
            <Area
              type="monotone"
              dataKey="net"
              fill={CHART_COLORS.primary}
              fillOpacity={0.08}
              stroke="transparent"
            />
            <Line
              type="monotone"
              dataKey="net"
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
