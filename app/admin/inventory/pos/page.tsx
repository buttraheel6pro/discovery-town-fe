/** Admin POS — full-screen point-of-sale order creation. */
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'

import { POSCartPanel } from '@/components/admin/pos-cart-panel'
import { ProductPOSCard } from '@/components/admin/product-pos-card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useInventory } from '@/lib/inventory-store'
import type { Product } from '@/lib/types'

export default function AdminInventoryPOSPage() {
  const { products, productCategories, addToPosCart } = useInventory()

  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const skuBuffer = useRef<{ value: string; timer: number | null }>({ value: '', timer: null })

  const categories = useMemo(() => {
    return productCategories.slice().sort((a, b) => a.displayOrder - b.displayOrder)
  }, [productCategories])

  const posProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products
      .filter((p) => p.isActive && p.availablePOS !== false)
      .filter((p) => (categoryId ? p.categoryId === categoryId : true))
      .filter((p) => {
        if (!q) return true
        const hay = `${p.name} ${(p.sku ?? '')}`.toLowerCase()
        return hay.includes(q)
      })
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [categoryId, products, search])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        const sku = skuBuffer.current.value.trim()
        skuBuffer.current.value = ''
        if (!sku) return
        const match = products.find((p) => (p.sku ?? '').toUpperCase() === sku.toUpperCase())
        if (!match) return
        addToPosCart({ product: match, quantity: 1 })
        return
      }

      if (e.key.length === 1) {
        skuBuffer.current.value += e.key
        if (skuBuffer.current.timer) window.clearTimeout(skuBuffer.current.timer)
        skuBuffer.current.timer = window.setTimeout(() => {
          skuBuffer.current.value = ''
          skuBuffer.current.timer = null
        }, 500)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [addToPosCart, products])

  function handleAdd(product: Product, quantity: number) {
    addToPosCart({ product, quantity })
  }

  return (
    <div className="-m-8 h-[calc(100vh-4rem)] min-h-0 overflow-hidden">
      <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-2">
        <section className="flex h-full min-h-0 flex-col border-r border-border">
          <div className="shrink-0 space-y-3 border-b border-border p-4">
            <p className="text-lg font-black text-foreground" style={{ fontFamily: 'var(--font-barlow)' }}>
              POS
            </p>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCategoryId(null)}
                className={cn(
                  'shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors',
                  categoryId === null
                    ? 'bg-accent text-accent-foreground border-accent'
                    : 'bg-background text-muted-foreground border-border hover:bg-secondary',
                )}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={cn(
                    'shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors',
                    categoryId === c.id
                      ? 'bg-accent text-accent-foreground border-accent'
                      : 'bg-background text-muted-foreground border-border hover:bg-secondary',
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Search by name or SKU…" />
            </div>
            <p className="text-xs text-muted-foreground">
              SKU quick-add: type SKU then press Enter.
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {posProducts.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                No products match your search.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                {posProducts.map((p) => (
                  <ProductPOSCard key={p.id} product={p} onAdd={handleAdd} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="h-full min-h-0 overflow-hidden">
          <POSCartPanel onOrderComplete={() => {}} />
        </section>
      </div>
    </div>
  )
}

