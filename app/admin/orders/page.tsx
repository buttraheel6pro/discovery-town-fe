/** Admin orders — store-backed order list + detail view. */
'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { CrudModal } from '@/components/admin/crud-modal'
import { OrderChannelBadge } from '@/components/admin/order-channel-badge'
import { OrderDetailPanel } from '@/components/admin/order-detail-panel'
import { OrderStatusBadge } from '@/components/admin/order-status-badge'
import { PaymentStatusBadge } from '@/components/admin/payment-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatPrice } from '@/lib/utils'
import { useInventory } from '@/lib/inventory-store'
import { isAdminApiReady } from '@/lib/api/client'
import { listOrders } from '@/lib/api/orders.api'
import type { Order, OrderStatus } from '@/lib/types'

type StatusTab = 'ALL' | 'RENTALS' | 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'REFUNDED' | 'CANCELLED'

function OrdersManagementContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { orders: storeOrders } = useInventory()
  const [apiOrders, setApiOrders] = useState<Order[] | null>(null)
  const orders = apiOrders ?? storeOrders
  const [tab, setTab] = useState<StatusTab>('ALL')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Order | null>(null)

  useEffect(() => {
    if (!isAdminApiReady()) return
    void listOrders({ limit: 100 }).then(setApiOrders).catch(() => setApiOrders(null))
  }, [])

  useEffect(() => {
    const orderId = searchParams.get('orderId')
    if (!orderId) return
    const match = orders.find((o) => o.id === orderId)
    if (match) {
      setSelected(match)
    }
    router.replace('/admin/orders', { scroll: false })
  }, [searchParams, orders, router])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders
      .filter((o) => {
        if (tab === 'RENTALS') {
          return o.fulfillmentType === 'RENTAL'
        }
        if (tab !== 'ALL' && o.status !== tab) return false
        if (!q) return true
        const hay = `${o.orderNumber} ${(o.contactName ?? '')} ${(o.contactEmail ?? '')}`.toLowerCase()
        return hay.includes(q)
      })
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [orders, search, tab])

  const totalRevenue = useMemo(() => orders.reduce((s, o) => s + o.total, 0), [orders])

  const byStatus = useMemo(() => {
    const map = new Map<OrderStatus, number>()
    for (const o of orders) {
      map.set(o.status, (map.get(o.status) ?? 0) + 1)
    }
    return map
  }, [orders])

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground mt-2">View and manage shop orders.</p>
        </div>
        <Button asChild>
          <Link href="/admin/inventory/pos">New order (POS)</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{orders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{byStatus.get('DELIVERED') ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending/Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {(byStatus.get('PENDING') ?? 0) + (byStatus.get('PROCESSING') ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatPrice(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Gross</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order list</CardTitle>
          <CardDescription>Filter by status and search by number or customer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as StatusTab)}>
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="RENTALS">Rentals</TabsTrigger>
              <TabsTrigger value="PENDING">Pending</TabsTrigger>
              <TabsTrigger value="PROCESSING">Processing</TabsTrigger>
              <TabsTrigger value="DELIVERED">Delivered</TabsTrigger>
              <TabsTrigger value="REFUNDED">Refunded</TabsTrigger>
              <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>

          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order number or customer…"
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>{tab === 'RENTALS' ? 'Fulfillment' : 'Channel'}</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">{tab === 'RENTALS' ? 'Rental date' : 'Items'}</TableHead>
                <TableHead className="text-right">{tab === 'RENTALS' ? 'Deposit' : 'Total'}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Created</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs font-semibold text-foreground">{o.orderNumber}</TableCell>
                  <TableCell>
                    {tab === 'RENTALS' ? (
                      <span className="text-sm font-medium text-foreground">{o.fulfillmentMode ?? '—'}</span>
                    ) : (
                      <OrderChannelBadge channel={o.channel} />
                    )}
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <p className="text-sm font-semibold text-foreground">{o.contactName ?? 'Guest'}</p>
                    <p className="text-xs text-muted-foreground">{o.contactEmail ?? '—'}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    {tab === 'RENTALS'
                      ? `${o.rentalStartAt?.slice(0, 10) ?? '—'} to ${o.rentalEndAt?.slice(0, 10) ?? '—'}`
                      : o.items.length}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {tab === 'RENTALS' ? formatPrice(o.depositAmount ?? 0) : formatPrice(o.total)}
                  </TableCell>
                  <TableCell className="flex flex-wrap items-center gap-2">
                    <PaymentStatusBadge status={o.paymentStatus} />
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelected(o)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CrudModal
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        title="Order details"
        description="Review items, totals, and update status."
        size="lg"
        variant="view"
        scrollMode="dialog"
        footer={null}
      >
        {selected ? <OrderDetailPanel order={selected} onClose={() => setSelected(null)} /> : null}
      </CrudModal>
    </div>
  )
}

export default function OrdersManagement() {
  return (
    <Suspense
      fallback={<div className="p-8 text-sm text-muted-foreground">Loading orders…</div>}
    >
      <OrdersManagementContent />
    </Suspense>
  )
}
