/** Category menu — filters cafe products with availability rules. */
'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo } from 'react'

import { CafeProductCard } from '@/components/customer/cafe-product-card'
import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { Button } from '@/components/ui/button'
import { filterCafeProducts, slugToCafeCategory } from '@/lib/cafe-utils'
import { useCafe } from '@/lib/cafe-store'

export default function CafeCategoryMenuPage() {
  const params = useParams()
  const slug = typeof params.category === 'string' ? params.category : ''
  const category = slugToCafeCategory(slug)
  const { cafeProducts } = useCafe()

  const today = useMemo(() => new Date().getDay(), [])

  const { visible, soldOut } = useMemo(() => {
    if (!category) {
      return { visible: [] as typeof cafeProducts, soldOut: [] as typeof cafeProducts }
    }
    const inCat = cafeProducts.filter((p) => p.category === category)
    return filterCafeProducts(inCat, today)
  }, [cafeProducts, category, today])

  if (!category) {
    return (
      <>
        <CustomerNavbar />
        <main className="container mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="text-muted-foreground">Category not found.</p>
          <Button type="button" className="mt-4" asChild>
            <Link href="/cafe">Back to cafe</Link>
          </Button>
        </main>
        <CustomerFooter />
      </>
    )
  }

  return (
    <>
      <CustomerNavbar />
      <main className="container mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/cafe" className="text-sm font-medium text-primary hover:underline">
              ← Cafe home
            </Link>
            <h1
              className="mt-2 text-3xl font-black tracking-tight text-foreground"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              {category}
            </h1>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <CafeProductCard key={p.id} product={p} />
          ))}
          {soldOut.map((p) => (
            <CafeProductCard key={p.id} product={p} soldOut />
          ))}
        </div>
      </main>
      <CustomerFooter />
    </>
  )
}
