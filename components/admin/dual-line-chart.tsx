/** Multi-series line chart for new vs returning, referrals, etc. */
'use client'

import { format, parseISO } from 'date-fns'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface DualLineSeries {
  readonly key: string
  readonly label: string
  readonly color: string
}

export interface DualLineChartProps {
  readonly data: Record<string, string | number>[]
  readonly lines: DualLineSeries[]
  readonly height?: number
  readonly className?: string
}

export function DualLineChart({
  data,
  lines,
  height = 280,
  className,
}: Readonly<DualLineChartProps>) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-border text-sm text-muted-foreground"
        style={{ height }}
      >
        No data
      </div>
    )
  }

  return (
    <div className={className} style={{ height }} data-slot="dual-line-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(d) => {
              try {
                return format(parseISO(String(d)), 'd MMM')
              } catch {
                return String(d)
              }
            }}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
            }}
          />
          <Legend />
          {lines.map((ln) => (
            <Line
              key={ln.key}
              type="monotone"
              dataKey={ln.key}
              name={ln.label}
              stroke={ln.color}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
