/** Membership / seasonal offer hover preview — opens when hovering the list thumbnail. */
'use client'

import Image from 'next/image'
import { Clock3 } from 'lucide-react'

import { CatalogItemImagePreview } from '@/components/customer/catalog-item-image-preview'
import { Badge } from '@/components/ui/badge'
import type { OpenPlayMembershipOffer } from '@/lib/open-play-membership-offers'
import { formatPrice } from '@/lib/utils'

export interface PlayMembershipOfferHoverDetailProps {
  readonly offer: OpenPlayMembershipOffer
  readonly displayPrice: number
  readonly imageSrc: string
  readonly label: string
}

export function PlayMembershipOfferHoverDetail({
  offer,
  displayPrice,
  imageSrc,
  label,
}: Readonly<PlayMembershipOfferHoverDetailProps>) {
  return (
    <CatalogItemImagePreview imageSrc={imageSrc} label={label}>
      <div className="relative aspect-[16/10] overflow-hidden bg-muted/30">
        <Image
          src={offer.imageUrl}
          alt={offer.name}
          fill
          className="object-cover"
          sizes="320px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <Badge className="mb-2 bg-accent text-accent-foreground text-[10px]">
            {offer.categoryName}
          </Badge>
          <p
            className="text-lg font-black text-white"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            {offer.name}
          </p>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{offer.description}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5 shrink-0" />
          <span>Unlimited play — no slots required</span>
        </p>
        {offer.amenities.length > 0 ? (
          <ul className="space-y-1 text-xs text-muted-foreground">
            {offer.amenities.map((amenity) => (
              <li key={amenity}>• {amenity}</li>
            ))}
          </ul>
        ) : null}
        <p className="text-base font-bold text-foreground">
          {formatPrice(displayPrice)}
          {offer.priceSuffix}
        </p>
      </div>
    </CatalogItemImagePreview>
  )
}
