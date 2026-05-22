/** Shop page client — handles URL filters via useSearchParams. */
'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search, ShoppingCart, X } from 'lucide-react'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { ShopProductCard } from '@/components/customer/shop-product-card'
import { ShopProductCardSkeleton } from '@/components/customer/shop-product-card-skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useInventory } from '@/lib/inventory-store'
import type { ProductCategory } from '@/lib/types'

const PAGE_SIZE = 12

function setParam(
  params: URLSearchParams,
  key: string,
  value: string | null,
): URLSearchParams {
  const next = new URLSearchParams(params)
  if (!value) next.delete(key)
  else next.set(key, value)
  return next
}

export function ShopPageClient() {
  const { products, productCategories, cart } = useInventory()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [loading] = useState(false)
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [minPrice, setMinPrice] = useState(searchParams.get('min') ?? '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max') ?? '')

  const activeCategoryId = searchParams.get('category')
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)

  const topCategories = useMemo<ProductCategory[]>(() => {
    return productCategories.slice().sort((a, b) => a.displayOrder - b.displayOrder)
  }, [productCategories])

  const activeCategory = useMemo(() => {
    if (!activeCategoryId) return null
    return productCategories.find((c) => c.id === activeCategoryId) ?? null
  }, [activeCategoryId, productCategories])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const min = Number.parseFloat(minPrice)
    const max = Number.parseFloat(maxPrice)

    return products.filter((p) => {
      if (!p.isActive) return false
      if (p.availableOnline === false) return false
      if (activeCategoryId && p.categoryId !== activeCategoryId) return false

      if (q) {
        const hay = `${p.name} ${(p.sku ?? '')}`.toLowerCase()
        if (!hay.includes(q)) return false
      }

      if (Number.isFinite(min) && p.price < min) return false
      if (Number.isFinite(max) && p.price > max) return false

      return true
    })
  }, [activeCategoryId, maxPrice, minPrice, products, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE)

  function push(next: URLSearchParams) {
    router.push(`${pathname}?${next.toString()}`)
  }

  function selectCategory(categoryId: string | null) {
    const next = setParam(searchParams as unknown as URLSearchParams, 'category', categoryId)
    push(setParam(next, 'page', '1'))
  }

  function clearFilters() {
    const next = new URLSearchParams()
    push(next)
    setSearch('')
    setMinPrice('')
    setMaxPrice('')
  }

  return (
    <>
      <CustomerNavbar />
      <main>
        <section className="bg-primary py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-accent text-sm font-bold uppercase tracking-widest mb-3">
                Apex Gear
              </p>
              <h1
                className="text-4xl sm:text-5xl font-black text-white text-balance"
                style={{ fontFamily: 'var(--font-barlow)' }}
              >
                Shop
              </h1>
              <p className="text-white/70 mt-3 max-w-xl leading-relaxed">
                Official Discovery Town merchandise, equipment, and essentials.
              </p>
            </div>
            <Link href="/cart">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold gap-2">
                <ShoppingCart className="w-4 h-4" />
                Cart ({cart.items.length})
              </Button>
            </Link>
          </div>
        </section>

        <div className="bg-card border-b border-border py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => selectCategory(null)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border',
                !activeCategoryId
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'bg-background text-muted-foreground border-border hover:bg-secondary',
              )}
            >
              All
            </button>
            {topCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => selectCategory(cat.id)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border',
                  activeCategoryId === cat.id
                    ? 'bg-accent text-accent-foreground border-accent'
                    : 'bg-background text-muted-foreground border-border hover:bg-secondary',
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <section className="py-10 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {activeCategory ? activeCategory.name : 'All products'}
                </p>
                <p className="text-xs text-muted-foreground">{filtered.length} items</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[720px]">
                <div className="relative sm:col-span-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onBlur={() => {
                      const next = setParam(
                        searchParams as unknown as URLSearchParams,
                        'q',
                        search.trim() || null,
                      )
                      push(setParam(next, 'page', '1'))
                    }}
                    placeholder="Search products or SKU…"
                    className="pl-9"
                  />
                </div>
                <Input
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  onBlur={() => {
                    const next = setParam(searchParams as unknown as URLSearchParams, 'min', minPrice || null)
                    push(setParam(next, 'page', '1'))
                  }}
                  inputMode="decimal"
                  type="number"
                  step="0.01"
                  placeholder="From $"
                />
                <Input
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  onBlur={() => {
                    const next = setParam(searchParams as unknown as URLSearchParams, 'max', maxPrice || null)
                    push(setParam(next, 'page', '1'))
                  }}
                  inputMode="decimal"
                  type="number"
                  step="0.01"
                  placeholder="To $"
                />
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <ShopProductCardSkeleton key={idx} />
                ))}
              </div>
            ) : pageItems.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-10 text-center">
                <p className="text-sm font-semibold text-foreground">No products found.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try clearing filters or browsing all categories.
                </p>
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" onClick={clearFilters}>
                    Browse all
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pageItems.map((p) => (
                  <ShopProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                disabled={pageSafe <= 1}
                onClick={() =>
                  push(setParam(searchParams as unknown as URLSearchParams, 'page', String(pageSafe - 1)))
                }
              >
                Previous
              </Button>
              <p className="text-xs text-muted-foreground">
                Page {pageSafe} of {totalPages}
              </p>
              <Button
                variant="outline"
                disabled={pageSafe >= totalPages}
                onClick={() =>
                  push(setParam(searchParams as unknown as URLSearchParams, 'page', String(pageSafe + 1)))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </section>
      </main>
      <CustomerFooter />
    </>
  )
}

