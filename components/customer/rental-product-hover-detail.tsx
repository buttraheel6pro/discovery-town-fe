/** Hover preview card for a rental product — opens when hovering the list thumbnail. */
'use client'

import Image from 'next/image'

import { CatalogItemImagePreview } from '@/components/customer/catalog-item-image-preview'
import { formatPrice } from '@/lib/utils'

export interface RentalProductHoverDetailProps {
  readonly name: string
  readonly description?: string | null
  readonly imageUrl?: string | null
  readonly price: number
  readonly imageSrc: string
}

const IMAGE_FALLBACK = '/placeholder.jpg'

export function RentalProductHoverDetail({
  name,
  description,
  imageUrl,
  price,
  imageSrc,
}: Readonly<RentalProductHoverDetailProps>) {
  const previewImageSrc = imageUrl?.trim() || imageSrc || IMAGE_FALLBACK

  return (
    <CatalogItemImagePreview imageSrc={imageSrc} label={name}>
      <div className="relative aspect-[16/10] overflow-hidden bg-muted/30">
        <Image src={previewImageSrc} alt={name} fill className="object-cover" sizes="320px" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <p
            className="text-lg font-black text-white"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            {name}
          </p>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description?.trim() || 'No description available.'}
        </p>
        <p className="text-base font-bold text-accent">From {formatPrice(price)}</p>
      </div>
    </CatalogItemImagePreview>
  )
}
