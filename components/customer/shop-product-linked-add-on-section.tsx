/** “You may also like” grid for gift/rental linked add-on products on product detail. */
'use client'

import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/lib/types'

export interface ShopProductLinkedAddOnSectionProps {
  readonly related: readonly Product[]
  readonly relatedTitle: string
  readonly selectedQuantities: Readonly<Record<string, number>>
  readonly onUpdateQuantity: (productId: string, delta: number) => void
}

export function ShopProductLinkedAddOnSection({
  related,
  relatedTitle,
  selectedQuantities,
  onUpdateQuantity,
}: Readonly<ShopProductLinkedAddOnSectionProps>) {
  return (
    <section className="space-y-4">
      <h2
        className="text-xl font-black text-foreground"
        style={{ fontFamily: 'var(--font-barlow)' }}
      >
        {relatedTitle}
      </h2>
      {related.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((p) => {
            const unit = p.memberPrice ?? p.price
            const selectedQty = selectedQuantities[p.id] ?? 0
            return (
              <div key={p.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="relative aspect-[4/3] bg-muted/30">
                  <Image
                    src={p.imageUrl ?? '/placeholder.jpg'}
                    alt={p.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="space-y-2 p-5">
                  <p
                    className="text-base font-bold leading-tight text-foreground"
                    style={{ fontFamily: 'var(--font-barlow)' }}
                  >
                    {p.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{p.sku ?? '—'}</p>
                  <p className="text-lg font-black text-foreground">{formatPrice(unit)}</p>
                </div>
                <Button
                  type="button"
                  className="mx-5 mb-5 mt-0 w-[calc(100%-2.5rem)] bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                  onClick={() => onUpdateQuantity(p.id, 1)}
                >
                  {selectedQty > 0 ? `Added (${selectedQty})` : 'Add item'}
                </Button>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No add-on products available right now.</p>
      )}
    </section>
  )
}
