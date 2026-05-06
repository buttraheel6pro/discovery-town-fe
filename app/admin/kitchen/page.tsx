/** Kitchen display — column board with order cards and status actions. */
'use client'

import { useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCafe } from '@/lib/cafe-store'
import { getMaxPrepTime } from '@/lib/cafe-utils'
import type { CafeKitchenColumn, CafeKitchenOrder, CartItem } from '@/lib/types'

/** Approximate max prep from kitchen line meta (mock uses minutes per line). */
function orderMaxPrep(order: CafeKitchenOrder): number {
  const fakeItems: CartItem[] = order.items.map((row) => ({
    id: row.name,
    type: 'product',
    name: row.name,
    price: 0,
    quantity: 1,
    preparationTimeMinutes: row.preparationTimeMinutes,
  }))
  return getMaxPrepTime(fakeItems)
}

export default function AdminKitchenPage() {
  const { kitchenOrders, updateKitchenOrderStatus } = useCafe()
  const [lastRefresh, setLastRefresh] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setLastRefresh(new Date()), 30000)
    return () => window.clearInterval(id)
  }, [])

  const columns = useMemo(() => {
    const map: Record<CafeKitchenColumn, CafeKitchenOrder[]> = {
      NEW: [],
      PREPARING: [],
      READY: [],
    }
    for (const o of kitchenOrders) {
      map[o.status].push(o)
    }
    return map
  }, [kitchenOrders])

  function channelBadge(ch: CafeKitchenOrder['channel']) {
    switch (ch) {
      case 'POS':
        return <Badge variant="secondary">POS</Badge>
      case 'TAKEOUT':
        return <Badge>TAKEOUT</Badge>
      case 'DELIVERY':
        return <Badge variant="outline">DELIVERY</Badge>
      default:
        return null
    }
  }

  function renderCard(order: CafeKitchenOrder) {
    const maxPrep = orderMaxPrep(order)
    return (
      <Card key={order.id} className="border-border">
        <CardHeader className="space-y-1 pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">{order.orderNumber}</CardTitle>
            {channelBadge(order.channel)}
          </div>
          <p className="text-xs text-muted-foreground">
            Received {new Date(order.receivedAt).toLocaleTimeString()}
          </p>
          {order.scheduledFor ? (
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
              Due {new Date(order.scheduledFor).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </p>
          ) : null}
          {order.deliveryAddress ? (
            <p className="text-xs text-muted-foreground">{order.deliveryAddress}</p>
          ) : null}
          {order.cateringEventName ? (
            <p className="text-xs font-semibold">🎉 Catering — {order.cateringEventName}</p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ul className="space-y-2">
            {order.items.map((line) => (
              <li key={`${order.id}-${line.name}`}>
                <p className="font-medium">{line.name}</p>
                {line.modifierSummary ? (
                  <p className="text-xs text-muted-foreground">{line.modifierSummary}</p>
                ) : null}
                {line.preparationTimeMinutes != null && line.preparationTimeMinutes > 0 ? (
                  <p className="text-xs text-muted-foreground">Prep ~{line.preparationTimeMinutes} min</p>
                ) : null}
              </li>
            ))}
          </ul>
          {maxPrep > 0 ? (
            <p className="text-xs font-semibold text-muted-foreground">Max prep: ~{maxPrep} min</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {order.status === 'NEW' ? (
              <Button
                type="button"
                size="sm"
                onClick={() => updateKitchenOrderStatus(order.id, 'PREPARING')}
              >
                Start prep
              </Button>
            ) : null}
            {order.status === 'PREPARING' ? (
              <Button
                type="button"
                size="sm"
                onClick={() => updateKitchenOrderStatus(order.id, 'READY')}
              >
                Mark ready
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black" style={{ fontFamily: 'var(--font-barlow)' }}>
          Kitchen display
        </h1>
        <p className="text-sm text-muted-foreground">
          Auto-refreshes every 30s (mock). Last sync {lastRefresh.toLocaleTimeString()}.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">New orders</h2>
          <div className="space-y-3">{columns.NEW.map(renderCard)}</div>
        </section>
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">In preparation</h2>
          <div className="space-y-3">{columns.PREPARING.map(renderCard)}</div>
        </section>
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Ready for pickup</h2>
          <div className="space-y-3">{columns.READY.map(renderCard)}</div>
        </section>
      </div>
    </div>
  )
}
