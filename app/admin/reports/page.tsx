/** Reports KPI dashboard — charts, recent activity, sessions, private hire. */
'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Building2, Calendar, DollarSign, Package, TrendingUp, Users } from 'lucide-react'

import { CapacityRing } from '@/components/admin/capacity-ring'
import { GlobalDateRangePicker } from '@/components/admin/global-date-range-picker'
import { KpiCard } from '@/components/admin/kpi-card'
import { RevenueCategoryDonut } from '@/components/admin/revenue-category-donut'
import { RevenueLineChart } from '@/components/admin/revenue-line-chart'
import { SlotStatusBadge } from '@/components/admin/slot-status-badge'
import { Badge } from '@/components/ui/badge'
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
import { formatPrice, formatSlotTimeRange } from '@/lib/utils'
import { useCalendar } from '@/lib/calendar-store'
import { useInventory } from '@/lib/inventory-store'
import { useReports } from '@/lib/reports-store'
import { useScheduling } from '@/lib/scheduling-store'
import type { Order, SchedulingBooking } from '@/lib/types'

type MergedTx = {
  id: string
  kind: 'order' | 'booking'
  createdAt: string
  contactId: string
  contactLabel: string
  category: string
  amount: number
  statusLabel: string
}

export default function ReportsDashboardPage() {
  const { kpiDashboard, revenueSummary } = useReports()
  const { orders } = useInventory()
  const { slots, bookings } = useScheduling()
  const { inquiries } = useCalendar()

  const now = new Date().toISOString()

  const upcomingSlots = useMemo(() => {
    return slots
      .filter((s) => s.startAt > now)
      .slice()
      .sort((a, b) => a.startAt.localeCompare(b.startAt))
      .slice(0, 5)
  }, [slots, now])

  const pendingHires = useMemo(
    () => inquiries.filter((i) => i.status === 'PENDING').slice(0, 3),
    [inquiries],
  )

  const recentTx = useMemo<MergedTx[]>(() => {
    const orderRows: MergedTx[] = orders.map((o: Order) => ({
      id: o.id,
      kind: 'order',
      createdAt: o.createdAt,
      contactId: o.contactId,
      contactLabel: o.contactName ?? 'Guest',
      category: 'Retail',
      amount: o.total,
      statusLabel: o.paymentStatus,
    }))
    const bookingRows: MergedTx[] = bookings.map((b: SchedulingBooking) => ({
      id: b.id,
      kind: 'booking',
      createdAt: b.createdAt,
      contactId: b.contactId,
      contactLabel: b.contactName ?? 'Guest',
      category: 'Bookings',
      amount: b.totalAmount,
      statusLabel: b.status,
    }))
    return [...orderRows, ...bookingRows]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10)
  }, [orders, bookings])

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-3xl font-black tracking-tight text-foreground"
          style={{ fontFamily: 'var(--font-barlow)' }}
        >
          Reports dashboard
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          KPIs, revenue trends, and recent activity across Discovery Town.
        </p>
      </div>

      <GlobalDateRangePicker />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Net revenue"
          value={kpiDashboard.netRevenue}
          valueIsCurrency
          deltaCurrent={kpiDashboard.netRevenue}
          deltaPrevious={kpiDashboard.netRevenuePrev}
          icon={DollarSign}
        />
        <KpiCard
          label="New contacts"
          value={kpiDashboard.newContacts}
          deltaCurrent={kpiDashboard.newContacts}
          deltaPrevious={kpiDashboard.newContactsPrev}
          icon={Users}
        />
        <KpiCard
          label="Active memberships"
          value={kpiDashboard.activeMemberships}
          deltaCurrent={kpiDashboard.activeMemberships}
          deltaPrevious={kpiDashboard.activeMembershipsPrev}
          icon={TrendingUp}
        />
        <KpiCard
          label="Sessions completed"
          value={kpiDashboard.sessionsCompleted}
          deltaCurrent={kpiDashboard.sessionsCompleted}
          deltaPrevious={kpiDashboard.sessionsCompletedPrev}
          icon={Calendar}
        />
        <KpiCard
          label="Pending private hires"
          value={kpiDashboard.pendingPrivateHires}
          accentColor={kpiDashboard.pendingPrivateHires > 0 ? 'amber' : undefined}
          icon={Building2}
          href="/admin/calendar/private-hire"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-barlow)' }}>Net revenue</CardTitle>
          <CardDescription>Daily net revenue for the selected reporting context.</CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueLineChart data={revenueSummary.daily} toggle />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-barlow)' }}>Revenue by category</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueCategoryDonut data={revenueSummary.byCategory} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle style={{ fontFamily: 'var(--font-barlow)' }}>Recent transactions</CardTitle>
              <CardDescription>Latest orders and scheduling bookings.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTx.map((tx) => (
                  <TableRow key={`${tx.kind}-${tx.id}`}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {tx.kind === 'order' ? (
                        <Link
                          href={`/admin/orders?orderId=${tx.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {tx.contactLabel}
                        </Link>
                      ) : (
                        <Link
                          href={`/admin/clients/${tx.contactId}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {tx.contactLabel}
                        </Link>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{tx.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatPrice(tx.amount)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{tx.statusLabel}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/orders">All orders</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/scheduling">Scheduling</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle style={{ fontFamily: 'var(--font-barlow)' }}>Upcoming sessions</CardTitle>
              <CardDescription>Next five scheduled slots.</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/calendar">View calendar</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming sessions.</p>
            ) : (
              upcomingSlots.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{s.service.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSlotTimeRange(s.startAt, s.endAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <CapacityRing booked={s.bookedCount} capacity={s.effectiveCapacity} size="sm" />
                    <SlotStatusBadge status={s.status} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle style={{ fontFamily: 'var(--font-barlow)' }}>Pending private hire</CardTitle>
              <CardDescription>Requests awaiting review.</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/calendar/private-hire">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingHires.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending requests.</p>
            ) : (
              pendingHires.map((i) => (
                <div
                  key={i.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{i.contactName}</p>
                    <p className="text-xs text-muted-foreground">
                      Preferred {i.preferredDate}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/admin/calendar/private-hire">Review</Link>
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
