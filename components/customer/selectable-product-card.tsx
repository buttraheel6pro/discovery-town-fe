/** Selectable product card for request-based party flows. */
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatPrice } from '@/lib/utils'
import type { Product } from '@/lib/types'

interface SelectableProductCardProps {
  readonly product: Product
  readonly selected: boolean
  readonly onToggle: () => void
  readonly className?: string
}

export function SelectableProductCard({
  product,
  selected,
  onToggle,
  className,
}: Readonly<SelectableProductCardProps>) {
  const [usePlaceholder, setUsePlaceholder] = useState(false)

  return (
    <article
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card transition-all',
        selected && 'ring-2 ring-accent/70',
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <Image
          src={usePlaceholder ? '/placeholder.jpg' : product.imageUrl ?? '/placeholder.jpg'}
          alt={product.name}
          fill
          className="object-cover"
          sizes="300px"
          onError={() => setUsePlaceholder(true)}
        />
        <div className="absolute left-3 top-3">
          <Badge className="bg-background text-foreground text-xs">Select</Badge>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <p className="line-clamp-2 text-sm font-bold text-foreground">{product.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{product.sku ?? '—'}</p>
        </div>
        <p className="text-base font-black text-foreground" style={{ fontFamily: 'var(--font-barlow)' }}>
          {formatPrice(product.memberPrice ?? product.price)}
        </p>
        <Button
          type="button"
          className={cn(
            'w-full',
            selected
              ? 'bg-green-600 text-white hover:bg-green-600'
              : 'bg-accent text-accent-foreground hover:bg-accent/90',
          )}
          onClick={onToggle}
        >
          {selected ? (
            <>
              <Check className="mr-1.5 h-4 w-4" />
              Selected
            </>
          ) : (
            'Select item'
          )}
        </Button>
      </div>
    </article>
  )
}
