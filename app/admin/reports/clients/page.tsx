/** Client insights — cohorts, channels, top contacts, at-risk panel. */
'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { DualLineChart } from '@/components/admin/dual-line-chart'
import { GlobalDateRangePicker } from '@/components/admin/global-date-range-picker'
import { RetentionCohortTable } from '@/components/admin/retention-cohort-table'
import { RevenueCategoryDonut } from '@/components/admin/revenue-category-donut'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useClients } from '@/lib/client-store'
import { useReports } from '@/lib/reports-store'
import { useScheduling } from '@/lib/scheduling-store'
import type { CategoryRevenue } from '@/lib/types'
import { CHART_COLORS, formatPrice } from '@/lib/utils'

const ACTIVE_CLIENT_TYPES = new Set(['CUSTOMER', 'CHILD', 'CORPORATE'])

export default function ReportsClientsPage() {
  const { reportClientInsights, topContacts, cohortMatrix } = useReports()
  const { contacts } = useClients()
  const { bookings } = useScheduling()

  const newReturningSeries = useMemo(
    () =>
      reportClientInsights.newVsReturningDaily.map((d) => ({
        date: d.date,
        newContacts: d.new,
        returningContacts: d.returning,
      })),
    [reportClientInsights.newVsReturningDaily],
  )

  const channelDonutData: CategoryRevenue[] = useMemo(
    () =>
      reportClientInsights.bookingChannels.map((c) => ({
        category: c.channel,
        total: c.count,
        percentage: c.percentage,
      })),
    [reportClientInsights.bookingChannels],
  )

  const atRiskContacts = useMemo(() => {
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - 30)
    const thresholdIso = threshold.toISOString()
    const lastBookingByContact = new Map<string, string>()
    for (const b of bookings) {
      if (b.status === 'CANCELLED') continue
      const prev = lastBookingByContact.get(b.contactId)
      if (!prev || b.createdAt > prev) {
        lastBookingByContact.set(b.contactId, b.createdAt)
      }
    }
    return contacts
      .filter((c) => ACTIVE_CLIENT_TYPES.has(c.contactType))
      .filter((c) => {
        const last = lastBookingByContact.get(c.id)
        return !last || last < thresholdIso
      })
      .slice(0, 8)
  }, [bookings, contacts])

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-3xl font-black tracking-tight text-foreground"
          style={{ fontFamily: 'var(--font-barlow)' }}
        >
          Clients
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acquisition, retention cohorts, and engagement signals.
        </p>
      </div>

      <GlobalDateRangePicker />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-barlow)' }}>
              {reportClientInsights.newContacts}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Returning</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-barlow)' }}>
              {reportClientInsights.returningContacts}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Churn rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive" style={{ fontFamily: 'var(--font-barlow)' }}>
              {reportClientInsights.churnRate}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg LTV</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-barlow)' }}>
              {formatPrice(reportClientInsights.avgLifetimeValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-barlow)' }}>New vs returning</CardTitle>
          <CardDescription>Daily sign-ins and repeat activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <DualLineChart
            data={newReturningSeries}
            lines={[
              { key: 'newContacts', label: 'New', color: CHART_COLORS.categories[0] },
              { key: 'returningContacts', label: 'Returning', color: CHART_COLORS.categories[3] },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-barlow)' }}>Retention cohorts</CardTitle>
          <CardDescription>Month-over-month retention grid.</CardDescription>
        </CardHeader>
        <CardContent>
          <RetentionCohortTable data={cohortMatrix} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-barlow)' }}>Age distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={reportClientInsights.ageGroups}
                  margin={{ left: 16, right: 16, top: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="label" width={48} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--card))',
                    }}
                  />
                  <Bar dataKey="count" name="Contacts" fill={CHART_COLORS.categories[1]} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-barlow)' }}>Booking channel</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueCategoryDonut data={channelDonutData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-barlow)' }}>Top contacts</CardTitle>
            <CardDescription>By spend and booking frequency.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topContacts.map((c) => (
                  <TableRow key={c.contactId}>
                    <TableCell className="text-muted-foreground">{c.rank}</TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/clients/${c.contactId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {c.contactName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatPrice(c.totalSpend)}</TableCell>
                    <TableCell className="text-right">{c.bookingCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-barlow)' }}>At-risk (no booking 30+ days)</CardTitle>
            <CardDescription>Reach out or re-engage these accounts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {atRiskContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No at-risk contacts in this slice.</p>
            ) : (
              atRiskContacts.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {c.firstName} {c.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.email ?? 'No email'}</p>
                  </div>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/admin/clients/${c.id}`}>Open profile</Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
