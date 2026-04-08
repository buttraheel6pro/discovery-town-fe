/** Revenue deep-dive — summary, charts, top services. */
'use client'

import { useMemo } from 'react'

import { ComparisonDelta } from '@/components/admin/comparison-delta'
import { GatewayRevenueChart } from '@/components/admin/gateway-revenue-chart'
import { GlobalDateRangePicker } from '@/components/admin/global-date-range-picker'
import { RevenueCategoryDonut } from '@/components/admin/revenue-category-donut'
import { RevenueLineChart } from '@/components/admin/revenue-line-chart'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useReports } from '@/lib/reports-store'
import type { TopServiceRevenue } from '@/lib/types'
import { formatPrice } from '@/lib/utils'

function serviceTypeLabel(t: TopServiceRevenue['serviceType']): string {
  return t.replaceAll('_', ' ')
}

export default function ReportsRevenuePage() {
  const { revenueSummary: rs } = useReports()

  const prev = useMemo(
    () => ({
      gross: Math.round(rs.gross * 0.93),
      net: Math.round(rs.net * 0.93),
      refunds: Math.round(rs.refunds * 1.05),
      avgTx: Math.round(rs.avgTransactionValue * 100 * 0.97) / 100,
      txCount: Math.round(rs.transactionCount * 0.95),
    }),
    [rs],
  )

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-3xl font-black tracking-tight text-foreground"
          style={{ fontFamily: 'var(--font-barlow)' }}
        >
          Revenue
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Gross, net, refunds, and mix by category and gateway.
        </p>
      </div>

      <GlobalDateRangePicker />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gross</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-barlow)' }}>
              {formatPrice(rs.gross)}
            </p>
            <ComparisonDelta current={rs.gross} previous={prev.gross} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-barlow)' }}>
              {formatPrice(rs.net)}
            </p>
            <ComparisonDelta current={rs.net} previous={prev.net} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive" style={{ fontFamily: 'var(--font-barlow)' }}>
              {formatPrice(rs.refunds)}
            </p>
            <ComparisonDelta current={rs.refunds} previous={prev.refunds} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-barlow)' }}>
              {formatPrice(rs.avgTransactionValue)}
            </p>
            <ComparisonDelta current={rs.avgTransactionValue} previous={prev.avgTx} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-barlow)' }}>
              {rs.transactionCount}
            </p>
            <ComparisonDelta current={rs.transactionCount} previous={prev.txCount} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-barlow)' }}>Net revenue trend</CardTitle>
          <CardDescription>Daily / weekly / monthly aggregation.</CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueLineChart data={rs.daily} toggle />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-barlow)' }}>By category</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueCategoryDonut data={rs.byCategory} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-barlow)' }}>By gateway</CardTitle>
          </CardHeader>
          <CardContent>
            <GatewayRevenueChart data={rs.byGateway} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-barlow)' }}>Top services</CardTitle>
          <CardDescription>By booking volume and revenue.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Bookings</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Avg / booking</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rs.topServices.map((row) => (
                <TableRow key={row.serviceId}>
                  <TableCell className="font-medium text-foreground">{row.serviceName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{serviceTypeLabel(row.serviceType)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{row.bookingCount}</TableCell>
                  <TableCell className="text-right font-semibold">{formatPrice(row.totalRevenue)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatPrice(row.avgPerBooking)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
