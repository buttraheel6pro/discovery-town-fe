/** Account orders — customer order history and detail view. */
'use client'

import { useMemo, useState } from 'react'

import { CrudModal } from '@/components/admin/crud-modal'
import { OrderDetailPanel } from '@/components/admin/order-detail-panel'
import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { OrderStatusBadge } from '@/components/admin/order-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatPrice } from '@/lib/utils'
import { useInventory } from '@/lib/inventory-store'
import type { Order } from '@/lib/types'

type Tab = 'ALL' | 'PENDING' | 'DELIVERED' | 'CANCELLED'

export default function AccountOrdersPage() {
  const { orders } = useInventory()
  const [tab, setTab] = useState<Tab>('ALL')
  const [selected, setSelected] = useState<Order | null>(null)

  const myOrders = useMemo(() => {
    const contactId = 'contact-1'
    return orders
      .filter((o) => o.contactId === contactId)
      .filter((o) => (tab === 'ALL' ? true : o.status === tab))
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [orders, tab])

  return (
    <>
      <CustomerNavbar />
      <main className="bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <div>
            <h1 className="text-3xl font-black text-foreground" style={{ fontFamily: 'var(--font-barlow)' }}>
              My orders
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">View your shop order history.</p>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="PENDING">Pending</TabsTrigger>
              <TabsTrigger value="DELIVERED">Fulfilled</TabsTrigger>
              <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>

          {myOrders.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No orders yet</CardTitle>
                <CardDescription>When you place an order, it will appear here.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <a href="/shop">Visit the shop</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myOrders.map((o) => (
                <Card key={o.id} className="border-border">
                  <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-mono text-xs font-semibold text-muted-foreground">{o.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(o.createdAt).toLocaleDateString()} • {o.items.length} item(s)
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-foreground">{formatPrice(o.total)}</p>
                      <OrderStatusBadge status={o.status} />
                      <Button variant="outline" size="sm" onClick={() => setSelected(o)}>
                        View details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <CustomerFooter />

      <CrudModal
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        title="Order details"
        description="Review items and totals."
        size="lg"
        variant="view"
        scrollMode="dialog"
        footer={null}
      >
        {selected ? <OrderDetailPanel order={selected} onClose={() => setSelected(null)} /> : null}
      </CrudModal>
    </>
  )
}

