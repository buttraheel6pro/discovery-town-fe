/** Shop order confirmation client — reads orderId from URL. */
'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/utils'
import { useInventory } from '@/lib/inventory-store'

export function ShopOrderConfirmationClient() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const { orders } = useInventory()

  const order = useMemo(() => {
    if (!orderId) return null
    return orders.find((o) => o.id === orderId) ?? null
  }, [orderId, orders])

  return (
    <>
      <CustomerNavbar />
      <main className="bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="rounded-xl border border-border bg-card p-10 text-center space-y-6">
            <CheckCircle2 className="mx-auto h-20 w-20 text-green-600 animate-[scale-in_300ms_ease-out]" />

            <div className="space-y-2">
              <h1 className="text-3xl font-black text-foreground" style={{ fontFamily: 'var(--font-barlow)' }}>
                Order confirmed
              </h1>
              <p className="text-sm text-muted-foreground">
                Thank you for your purchase. A confirmation summary is available below.
              </p>
            </div>

            {order ? (
              <div className="mx-auto max-w-md rounded-xl border border-border bg-background p-4 text-left space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-muted-foreground">Order</span>
                  <span className="font-mono text-xs font-bold text-foreground">{order.orderNumber}</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  {order.items.slice(0, 4).map((li) => (
                    <div key={li.id} className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">
                        {li.productName} × {li.quantity}
                      </span>
                      <span className="font-semibold text-foreground">{formatPrice(li.totalPrice)}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div
                  className="flex items-center justify-between text-base font-black text-foreground"
                  style={{ fontFamily: 'var(--font-barlow)' }}
                >
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                <Link href="/account/orders">View my orders</Link>
              </Button>
              <Button asChild variant="outline" className="font-semibold">
                <Link href="/shop">Continue shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <CustomerFooter />
    </>
  )
}

