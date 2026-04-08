"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, Users, Calendar, DollarSign, Zap, UserCircle, Building2, Package } from "lucide-react";
import { facilities, users, events } from "@/lib/mock-data";
import { CapacityRing } from "@/components/admin/capacity-ring";
import { KpiCard } from "@/components/admin/kpi-card";
import { RevenueLineChart } from "@/components/admin/revenue-line-chart";
import { SlotStatusBadge } from "@/components/admin/slot-status-badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useScheduling } from "@/lib/scheduling-store";
import { useCalendar } from "@/lib/calendar-store";
import { useClients } from "@/lib/client-store";
import { useInventory } from "@/lib/inventory-store";
import { useReports } from "@/lib/reports-store";
import { ContactAvatar } from "@/components/customer/contact-avatar";
import { ContactTypeBadge } from "@/components/customer/contact-type-badge";
import type { BillingCycle, ContactSubscription, MembershipPlan } from "@/lib/types";
import { getLowStockProducts } from "@/lib/utils";

const revenueData = [
  { month: "Jan", revenue: 4000, bookings: 2400 },
  { month: "Feb", revenue: 3000, bookings: 1398 },
  { month: "Mar", revenue: 2000, bookings: 9800 },
  { month: "Apr", revenue: 2780, bookings: 3908 },
  { month: "May", revenue: 1890, bookings: 4800 },
  { month: "Jun", revenue: 2390, bookings: 3800 },
];

const facilityData = facilities.map((f) => ({
  name: f.name,
  occupancy: Math.floor(Math.random() * 100),
}));

const COLORS = ["#ff9a56", "#1a2340", "#4a5f8f", "#8b9bbb"];

function monthlyValueForPlan(
  plan: MembershipPlan | undefined,
): number {
  if (!plan) return 0;
  const cycle: BillingCycle = plan.billingCycle;
  if (cycle === "MONTHLY") return plan.price;
  if (cycle === "ANNUAL") return plan.price / 12;
  if (cycle === "WEEKLY") return plan.price * 4;
  if (cycle === "QUARTERLY") return plan.price / 3;
  return plan.price;
}

export default function AdminDashboard() {
  const { slots, bookings } = useScheduling();
  const { contacts, subscriptions, membershipPlans } = useClients();
  const { inquiries } = useCalendar();
  const { orders: shopOrders, products: shopProducts } = useInventory();
  const { kpiDashboard, revenueSummary } = useReports();
  const totalRevenue = 15940;
  const totalBookings = 26706;
  const totalUsers = users.length;
  const activeEvents = events.filter(
    (e) => new Date(e.date) > new Date(),
  ).length;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todaysSlots = slots
    .filter((s) => s.startAt.startsWith(todayStr))
    .slice()
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, 6);

  const bookingsToday = bookings.filter((b) => b.createdAt.startsWith(todayStr) && b.status === "CONFIRMED").length;

  const activeClientRoles = new Set(["CUSTOMER", "CHILD", "CORPORATE"]);
  const totalActiveClients = contacts.filter((c) =>
    activeClientRoles.has(c.contactType),
  ).length;
  const activeMemberships = subscriptions.filter(
    (s) => s.status === "ACTIVE" || s.status === "TRIALING",
  ).length;
  const revenueThisMonth = subscriptions
    .filter((s) => s.status === "ACTIVE" || s.status === "TRIALING")
    .reduce((sum, s: ContactSubscription) => {
      const plan = membershipPlans.find((p) => p.id === s.planId);
      return sum + monthlyValueForPlan(plan);
    }, 0);
  const recentClients = [...contacts]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  const pendingHireCount = inquiries.filter((i) => i.status === "PENDING").length;
  const pendingHirePreview = inquiries
    .filter((i) => i.status === "PENDING")
    .slice(0, 3);

  const revenueToday = shopOrders
    .filter((o) => o.createdAt.startsWith(todayStr))
    .reduce((s, o) => s + o.total, 0);

  const lowStockAlerts = getLowStockProducts(shopProducts).length;

  const todaysOrdersPreview = shopOrders
    .filter((o) => o.createdAt.startsWith(todayStr))
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here&apos;s your sports complex overview.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalBookings}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalUsers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bookings Today
            </CardTitle>
            <Zap className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {bookingsToday}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Confirmed today
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Performance overview</h2>
            <p className="text-sm text-muted-foreground">
              Snapshot from the reports module (mock period data).
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/reports">Open reports</Link>
          </Button>
        </div>
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
            accentColor={kpiDashboard.pendingPrivateHires > 0 ? "amber" : undefined}
            icon={Building2}
            href="/admin/calendar/private-hire"
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Revenue this month</CardTitle>
            <CardDescription>Daily net revenue trend (compact).</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueLineChart data={revenueSummary.daily} height={160} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              £{revenueToday.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Shop orders today
            </p>
            <div className="mt-3">
              <Link href="/admin/orders">
                <Button size="sm" variant="outline">
                  View orders
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className={lowStockAlerts > 0 ? "border-destructive/40 bg-destructive/5" : undefined}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <Package className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {lowStockAlerts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Products needing attention
            </p>
            <div className="mt-3">
              <Link href="/admin/inventory/products">
                <Button size="sm" variant="outline">
                  View products
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active clients
            </CardTitle>
            <UserCircle className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalActiveClients}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Customers, children & corporate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active memberships
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {activeMemberships}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active or trialling subscriptions
            </p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Est. membership revenue (monthly)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              £{revenueThisMonth.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Normalised from plan billing cycles
            </p>
          </CardContent>
        </Card>
        <Link href="/admin/calendar/private-hire" className="block md:col-span-2 lg:col-span-1">
          <Card
            className={
              pendingHireCount > 0
                ? "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 transition-colors h-full"
                : "hover:bg-muted/40 transition-colors h-full"
            }
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending hire requests
              </CardTitle>
              <Building2
                className={
                  pendingHireCount > 0 ? "h-4 w-4 text-amber-600" : "h-4 w-4 text-muted-foreground"
                }
              />
            </CardHeader>
            <CardContent>
              <div
                className={
                  pendingHireCount > 0
                    ? "text-2xl font-bold text-amber-800 dark:text-amber-200"
                    : "text-2xl font-bold text-foreground"
                }
              >
                {pendingHireCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting review
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between flex-row">
          <div>
            <CardTitle>Today's Orders</CardTitle>
            <CardDescription>Latest shop orders from today.</CardDescription>
          </div>
          <Link href="/admin/orders">
            <Button variant="outline" size="sm">
              View all orders
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {todaysOrdersPreview.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders today.</p>
          ) : (
            <div className="space-y-2">
              {todaysOrdersPreview.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {o.orderNumber}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {o.channel}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    £{o.total.toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Recent clients</CardTitle>
            <Link href="/admin/clients">
              <Button variant="ghost" size="sm" className="text-xs text-accent">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentClients.length === 0 ? (
              <p className="text-sm text-muted-foreground">No clients yet.</p>
            ) : (
              recentClients.map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/clients/${c.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border p-2 hover:bg-muted/50 transition-colors"
                >
                  <ContactAvatar
                    firstName={c.firstName}
                    lastName={c.lastName}
                    imageUrl={c.avatarUrl}
                    contactType={c.contactType}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {c.firstName} {c.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.email ?? c.phone ?? "—"}
                    </p>
                  </div>
                  <ContactTypeBadge contactType={c.contactType} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Pending hire requests</CardTitle>
            <Link href="/admin/calendar/private-hire">
              <Button variant="ghost" size="sm" className="text-xs text-accent">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingHirePreview.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending enquiries.</p>
            ) : (
              pendingHirePreview.map((i) => (
                <div
                  key={i.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{i.contactName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {i.eventType.replace(/_/g, " ").toLowerCase()} ·{" "}
                      {new Date(i.preferredDate).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/calendar/private-hire">Review</Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue & Bookings Trend</CardTitle>
            <CardDescription>Monthly performance data</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={{ fill: "var(--accent)" }}
                />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ fill: "var(--primary)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Facilities</CardTitle>
            <CardDescription>By occupancy rate</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={facilityData.slice(0, 4)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, occupancy }) => `${name} ${occupancy}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="occupancy"
                >
                  {facilityData.slice(0, 4).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Facility Utilization
              </span>
              <span className="font-semibold text-foreground">78%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full"
                style={{ width: "78%" }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Class Enrollment Rate
              </span>
              <span className="font-semibold text-foreground">85%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full"
                style={{ width: "85%" }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Customer Satisfaction
              </span>
              <span className="font-semibold text-foreground">92%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full"
                style={{ width: "92%" }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 pb-3 border-b border-border">
                <div className="w-2 h-2 rounded-full bg-accent mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    New booking created
                  </p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 pb-3 border-b border-border">
                <div className="w-2 h-2 rounded-full bg-accent mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Class registration
                  </p>
                  <p className="text-xs text-muted-foreground">
                    15 minutes ago
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 pb-3 border-b border-border">
                <div className="w-2 h-2 rounded-full bg-accent mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Event created: Summer Tournament
                  </p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-accent mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Inventory updated
                  </p>
                  <p className="text-xs text-muted-foreground">3 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-3">
            Today&apos;s Sessions
            <Link href="/admin/scheduling">
              <Button variant="ghost" size="sm" className="text-xs text-accent">
                View all
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {todaysSlots.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No sessions today.
            </div>
          ) : (
            <div className="space-y-2">
              {todaysSlots.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {s.service.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.startAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <CapacityRing booked={s.bookedCount} capacity={s.effectiveCapacity} size="sm" />
                    <SlotStatusBadge status={s.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
