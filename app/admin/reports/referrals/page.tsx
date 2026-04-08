/** Referral analytics — sources, timeline, top referrers. */
'use client'

import Link from 'next/link'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { DualLineChart } from '@/components/admin/dual-line-chart'
import { GlobalDateRangePicker } from '@/components/admin/global-date-range-picker'
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
import { CHART_COLORS, formatPrice } from '@/lib/utils'

export default function ReportsReferralsPage() {
  const { referralOverview: ro } = useReports()

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-3xl font-black tracking-tight text-foreground"
          style={{ fontFamily: 'var(--font-barlow)' }}
        >
          Referrals
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Program performance, conversion, and advocate leaderboard.
        </p>
      </div>

      <GlobalDateRangePicker />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-barlow)' }}>
              {ro.totalReferrals}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Converted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-barlow)' }}>
              {ro.converted}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary" style={{ fontFamily: 'var(--font-barlow)' }}>
              {ro.conversionRate}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rewards issued</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-barlow)' }}>
              {formatPrice(ro.totalRewardValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-barlow)' }}>Referrals by source</CardTitle>
          <CardDescription>Volume and conversions per acquisition source.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ro.bySources} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="source" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                  }}
                />
                <Legend />
                <Bar
                  dataKey="referrals"
                  name="Referrals"
                  fill={CHART_COLORS.categories[0]}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="converted"
                  name="Converted"
                  fill={CHART_COLORS.categories[2]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-barlow)' }}>Timeline</CardTitle>
          <CardDescription>Referrals and conversions over time.</CardDescription>
        </CardHeader>
        <CardContent>
          <DualLineChart
            data={ro.timeline}
            lines={[
              { key: 'referrals', label: 'Referrals', color: CHART_COLORS.categories[0] },
              { key: 'conversions', label: 'Conversions', color: CHART_COLORS.categories[4] },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-barlow)' }}>Top referrers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Converted</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Rewards</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ro.topReferrers.map((r) => (
                <TableRow key={r.contactId}>
                  <TableCell className="text-muted-foreground">{r.rank}</TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/clients/${r.contactId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {r.contactName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">{r.referralsSent}</TableCell>
                  <TableCell className="text-right">{r.converted}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatPrice(r.revenueAttributed)}
                  </TableCell>
                  <TableCell className="text-right">{formatPrice(r.rewardsIssued)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
