/** Admin inventory dashboard — stock KPIs, low stock alerts, and recent orders. */

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, BarChart2, Package, ShoppingBag } from 'lucide-react'

import { OrderChannelBadge } from '@/components/admin/order-channel-badge'
import { OrderStatusBadge } from '@/components/admin/order-status-badge'
import { PaymentStatusBadge } from '@/components/admin/payment-status-badge'
import { StockAdjustmentModal } from '@/components/admin/stock-adjustment-modal'
import { StockStatusBadge } from '@/components/admin/stock-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatPrice, getLowStockProducts } from '@/lib/utils'
import { useInventory } from '@/lib/inventory-store'
import type { Product } from '@/lib/types'

export default function InventoryManagement() {
  const { products, orders } = useInventory()
  const [adjusting, setAdjusting] = useState<Product | null>(null)

  const lowStockProducts = useMemo(() => getLowStockProducts(products), [products])

  const totalActiveProducts = useMemo(() => products.filter((p) => p.isActive).length, [products])

  const totalStockValue = useMemo(() => {
    return products.reduce((s, p) => {
      const cost = p.costPrice ?? p.price
      return s + cost * p.stockCount
    }, 0)
  }, [products])

  const todayStr = new Date().toISOString().slice(0, 10)
  const todaysOrders = useMemo(
    () => orders.filter((o) => o.createdAt.slice(0, 10) === todayStr),
    [orders, todayStr],
  )

  const revenueToday = useMemo(
    () => todaysOrders.reduce((s, o) => s + o.total, 0),
    [todaysOrders],
  )

  const recentOrders = useMemo(() => {
    return orders
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10)
  }, [orders])

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-2">
            Products, stock health, and recent order activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/inventory/products">View products</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/inventory/pos">New POS order</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active products</CardTitle>
            <Package className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalActiveProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently sellable</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock value</CardTitle>
            <BarChart2 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatPrice(totalStockValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Estimated (cost or price)</p>
          </CardContent>
        </Card>

        <Card className={lowStockProducts.length > 0 ? 'border-destructive/40 bg-destructive/5' : undefined}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low stock alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders today</CardTitle>
            <ShoppingBag className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{todaysOrders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{todayStr}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue today</CardTitle>
            <ShoppingBag className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatPrice(revenueToday)}</div>
            <p className="text-xs text-muted-foreground mt-1">Paid orders</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>Low stock alerts</span>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/inventory/products">View all</Link>
            </Button>
          </CardTitle>
          <CardDescription>Products that are low or out of stock.</CardDescription>
        </CardHeader>
        <CardContent>
          {lowStockProducts.length === 0 ? (
            <div className="rounded-xl border border-border bg-green-500/5 p-6 text-sm text-green-700">
              ✓ All stock levels are healthy.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.slice(0, 8).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-normal">
                      <p className="font-semibold text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category?.name ?? '—'}</p>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.sku ?? '—'}</TableCell>
                    <TableCell>
                      <StockStatusBadge product={p} />
                    </TableCell>
                    <TableCell className="text-right font-semibold">{p.stockCount}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setAdjusting(p)}>
                        Adjust stock
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>Recent orders</span>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/inventory/orders">View all</Link>
            </Button>
          </CardTitle>
          <CardDescription>Latest orders across channels.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs font-semibold text-foreground">
                    {o.orderNumber}
                  </TableCell>
                  <TableCell>
                    <OrderChannelBadge channel={o.channel} />
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <p className="text-sm text-foreground font-semibold">{o.contactName ?? 'Guest'}</p>
                    <p className="text-xs text-muted-foreground">{o.contactEmail ?? '—'}</p>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatPrice(o.total)}</TableCell>
                  <TableCell className="flex flex-wrap items-center gap-2">
                    <PaymentStatusBadge status={o.paymentStatus} />
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {adjusting ? (
        <StockAdjustmentModal product={adjusting} open={true} onClose={() => setAdjusting(null)} />
      ) : null}
    </div>
  )
}
