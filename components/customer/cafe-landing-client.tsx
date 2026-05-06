/** Cafe landing — daily specials, featured drink, category grid, pickup/delivery CTAs. */
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { CafeCategoryGrid } from '@/components/customer/cafe-category-grid'
import { CafeProductCard } from '@/components/customer/cafe-product-card'
import { Button } from '@/components/ui/button'
import { getDailySpecials } from '@/lib/services/cafe-products'
import { useCafe } from '@/lib/cafe-store'
import { cn } from '@/lib/utils'
import type { CafeProduct } from '@/lib/types'

export interface CafeLandingClientProps {
  readonly className?: string
  /** When embedded inside another page with its own hero, omit the cafe hero section. */
  readonly variant?: 'standalone' | 'embedded'
}

export function CafeLandingClient({
  className,
  variant = 'standalone',
}: Readonly<CafeLandingClientProps>) {
  const { cafeProducts, attributeGroups } = useCafe()
  const [specials, setSpecials] = useState<CafeProduct[]>([])

  useEffect(() => {
    let cancelled = false
    void getDailySpecials().then((rows) => {
      if (!cancelled) setSpecials(rows)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const featured = useMemo(
    () => cafeProducts.find((p) => p.id === 'cp-002') ?? cafeProducts[0] ?? null,
    [cafeProducts],
  )

  return (
    <div className={cn('space-y-12', className)}>
      {variant === 'standalone' ? (
        <section className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-6 md:p-10">
          <div className="mx-auto max-w-3xl text-center space-y-4">
            <h1
              className="text-4xl font-black tracking-tight text-foreground md:text-5xl"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              Cafe & Food
            </h1>
            <p className="text-muted-foreground">
              Fresh drinks, pastries, and bites — order for pickup or delivery.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button type="button" size="lg" asChild>
                <Link href="/cafe/order-ahead">Order for Pickup</Link>
              </Button>
              <Button type="button" size="lg" variant="outline" asChild>
                <Link href="/cafe/delivery">Order for Delivery</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <section className="flex flex-wrap gap-3">
          <Button type="button" size="sm" asChild>
            <Link href="/cafe/order-ahead">Order for Pickup</Link>
          </Button>
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href="/cafe/delivery">Order for Delivery</Link>
          </Button>
        </section>
      )}

      {specials.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-barlow)' }}>
            Daily specials
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {specials.map((p) => (
              <CafeProductCard key={p.id} product={p} attributeGroups={attributeGroups} />
            ))}
          </div>
        </section>
      ) : null}

      {featured ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-barlow)' }}>
            Featured drink
          </h2>
          <div className="grid gap-6 overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-2">
            <div className="relative aspect-[16/10] bg-muted">
              <Image
                src={featured.imageUrl ?? '/placeholder.jpg'}
                alt={featured.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="flex flex-col justify-center space-y-3 p-6 md:p-10">
              <h3 className="text-2xl font-bold">{featured.name}</h3>
              {featured.subtype?.trim() ? (
                <div className="inline-flex w-fit items-center rounded-md border border-border bg-muted/40 px-3 py-1.5">
                  <p className="text-sm font-semibold text-foreground">{featured.subtype}</p>
                </div>
              ) : null}
              {featured.description?.trim() ? (
                <p className="text-sm leading-relaxed text-muted-foreground">{featured.description}</p>
              ) : null}
              <Button type="button" className="mt-2 w-fit" asChild>
                <Link href={`/shop/${featured.id}`}>View Details</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-barlow)' }}>
          Browse by category
        </h2>
        <CafeCategoryGrid />
      </section>
    </div>
  )
}
