/** Order-ahead pickup — ASAP estimate and 15-minute slot chips. */
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatAsapPrepLabel, getMaxPrepTime } from '@/lib/cafe-utils'
import { getPickupSlots } from '@/lib/services/cafe-products'
import { useInventory } from '@/lib/inventory-store'
import { cn } from '@/lib/utils'
import type { CafePickupSlot } from '@/lib/types'

function todayIsoDate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function CafeOrderAheadPage() {
  const { cart } = useInventory()
  const [date, setDate] = useState(todayIsoDate)
  const [slots, setSlots] = useState<CafePickupSlot[]>([])
  const [selectedIso, setSelectedIso] = useState<string | null>(null)

  const cafePrep = useMemo(() => {
    const cafeLines = cart.items.filter(
      (i) => i.metadata && (i.metadata as { itemType?: string }).itemType === 'cafe',
    )
    return getMaxPrepTime(cafeLines)
  }, [cart.items])

  useEffect(() => {
    let cancelled = false
    void getPickupSlots(date).then((rows) => {
      if (!cancelled) setSlots(rows)
    })
    return () => {
      cancelled = true
    }
  }, [date])

  const asapLabel = formatAsapPrepLabel(cafePrep)

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
          Order ahead — pickup
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a pickup window. Checkout completes on the cart page.
        </p>

        <div className="mt-8 space-y-4">
          <label className="block text-sm font-medium" htmlFor="pickup-date">
            Date
          </label>
          <input
            id="pickup-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="mt-8 space-y-3">
          <p className="text-sm font-semibold">Pickup time</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={selectedIso === 'ASAP' ? 'default' : 'outline'}
              size="sm"
              className="rounded-full"
              onClick={() => setSelectedIso('ASAP')}
            >
              {asapLabel}
            </Button>
            {slots.map((s) => (
              <Button
                key={s.timeIso}
                type="button"
                size="sm"
                variant={selectedIso === s.timeIso ? 'default' : 'outline'}
                disabled={!s.available}
                className={cn('rounded-full', !s.available && 'opacity-60')}
                onClick={() => {
                  if (s.available) setSelectedIso(s.timeIso)
                }}
              >
                {s.label}
                {!s.available ? (
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    Full
                  </Badge>
                ) : null}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button type="button" disabled={selectedIso == null} asChild={selectedIso != null}>
            {selectedIso != null ? (
              <Link href="/cart">Continue to cart</Link>
            ) : (
              <span>Continue to cart</span>
            )}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/shop/checkout">Go to checkout</Link>
          </Button>
        </div>
      </main>
      <CustomerFooter />
    </>
  )
}
