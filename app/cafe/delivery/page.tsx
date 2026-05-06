/** Cafe delivery — address, mock fee, free-delivery progress toward $50. */
'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useInventory } from '@/lib/inventory-store'
import { cn } from '@/lib/utils'

const FREE_DELIVERY_THRESHOLD = 50

function mockDeliveryFee(zip: string): number {
  const z = zip.trim()
  if (z.length === 0) return 0
  const n = z.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return 4 + (n % 5)
}

export default function CafeDeliveryPage() {
  const { cart } = useInventory()
  const [address, setAddress] = useState('')
  const [zip, setZip] = useState('')

  const cartTotal = useMemo(
    () => cart.items.reduce((s, i) => s + i.price * i.quantity, 0),
    [cart.items],
  )

  const fee = mockDeliveryFee(zip)
  const remainder = Math.max(0, FREE_DELIVERY_THRESHOLD - cartTotal)
  const progressPct = Math.min(100, (cartTotal / FREE_DELIVERY_THRESHOLD) * 100)

  return (
    <>
      <CustomerNavbar />
      <main className="container mx-auto max-w-3xl px-4 py-10 md:px-6">
        <Link href="/cafe" className="text-sm font-medium text-primary hover:underline">
          ← Cafe
        </Link>
        <h1
          className="mt-4 text-3xl font-black tracking-tight text-foreground"
          style={{ fontFamily: 'var(--font-barlow)' }}
        >
          Delivery
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your address for an estimated fee (mock). Free delivery on orders over £50.
        </p>

        <div className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="addr">Street address</Label>
            <Input
              id="addr"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main Street"
              autoComplete="street-address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip">ZIP / Postal code</Label>
            <Input
              id="zip"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="46032"
              autoComplete="postal-code"
            />
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">Free delivery progress</p>
          <Progress value={progressPct} className="mt-2 h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            {remainder > 0
              ? `Add £${remainder.toFixed(2)} more for free delivery.`
              : 'You qualify for free delivery.'}
          </p>
          <p className="mt-4 text-sm">
            Cart subtotal: <span className="font-semibold">£{cartTotal.toFixed(2)}</span>
          </p>
          <p className={cn('mt-1 text-sm', fee === 0 && zip.trim() === '' && 'text-muted-foreground')}>
            Delivery fee (est.):{' '}
            <span className="font-semibold">
              {zip.trim() === '' ? '—' : `£${fee.toFixed(2)}`}
            </span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Estimated delivery: 1:15–1:30 PM (mock window based on cart timing).
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button type="button" asChild>
            <Link href="/cart">Review cart</Link>
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/shop/checkout">Checkout</Link>
          </Button>
        </div>
      </main>
      <CustomerFooter />
    </>
  )
}
