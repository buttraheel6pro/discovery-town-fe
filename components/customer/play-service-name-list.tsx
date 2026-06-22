/** Play / scheduling service name list — maps domain items onto the shared catalog list. */
'use client'

import type { ReactNode } from 'react'

import {
  CatalogItemNameList,
  CATALOG_ITEM_LIST_IMAGE_FALLBACK,
  type CatalogItemNameListItem,
} from '@/components/customer/catalog-item-name-list'
import { EventPackageHoverDetail } from '@/components/customer/event-package-hover-detail'
import { PlayMembershipOfferHoverDetail } from '@/components/customer/play-membership-offer-hover-detail'
import { PlayServiceHoverDetail } from '@/components/customer/play-service-hover-detail'
import type { OpenPlayMembershipOffer } from '@/lib/open-play-membership-offers'
import {
  OPEN_PLAY_MEMBERSHIP_PASS_SERVICE_ID,
  OPEN_PLAY_SEASONAL_PASS_SERVICE_ID,
} from '@/lib/open-play-pass-catalog'
import { formatPrice } from '@/lib/utils'
import type { EventPackage, SchedulingService } from '@/lib/types'

const DESCRIPTION_FALLBACK = 'Tap to view details and book.'

export type PlayServiceListItem =
  | {
      readonly kind: 'service'
      readonly id: string
      readonly service: SchedulingService
      readonly href: string
    }
  | {
      readonly kind: 'membership-offer'
      readonly id: string
      readonly offer: OpenPlayMembershipOffer
      readonly displayPrice: number
      readonly href: string
    }
  | {
      readonly kind: 'event-package'
      readonly id: string
      readonly pkg: EventPackage
      readonly bookingService: SchedulingService
      readonly href: string
    }

export interface PlayServiceNameListProps {
  readonly items: readonly PlayServiceListItem[]
  readonly isLoading?: boolean
  readonly categoryName?: string
  readonly listHeadingSuffix?: string
  readonly listDescription?: string
  readonly emptyMessage?: string
  readonly listAriaLabel?: string
}

function resolveServicePriceSuffix(service: SchedulingService): string {
  if (service.id === OPEN_PLAY_MEMBERSHIP_PASS_SERVICE_ID) {
    return '/mo'
  }
  if (service.id === OPEN_PLAY_SEASONAL_PASS_SERVICE_ID) {
    return '/season'
  }
  if (service.pricingModel === 'per_hour') {
    return '/hr'
  }
  if (service.pricingModel === 'per_person') {
    return '/person'
  }
  return ''
}

function resolvePlayItemDescription(item: PlayServiceListItem): string {
  if (item.kind === 'service') {
    return item.service.description?.trim() || DESCRIPTION_FALLBACK
  }
  if (item.kind === 'event-package') {
    const serviceDescription = item.bookingService.description?.trim()
    if (serviceDescription) {
      return serviceDescription
    }
    if (item.pkg.features.length > 0) {
      return item.pkg.features.join(' · ')
    }
    return DESCRIPTION_FALLBACK
  }
  return item.offer.description.trim() || DESCRIPTION_FALLBACK
}

function resolvePlayItemPriceLabel(item: PlayServiceListItem): string {
  if (item.kind === 'service') {
    return `${formatPrice(item.service.basePrice)}${resolveServicePriceSuffix(item.service)}`
  }
  if (item.kind === 'event-package') {
    return formatPrice(item.pkg.basePrice)
  }
  return `${formatPrice(item.displayPrice)}${item.offer.priceSuffix}`
}

function resolvePlayItemImageSrc(item: PlayServiceListItem): string {
  if (item.kind === 'service') {
    return item.service.imageUrl ?? CATALOG_ITEM_LIST_IMAGE_FALLBACK
  }
  if (item.kind === 'event-package') {
    return item.bookingService.imageUrl ?? CATALOG_ITEM_LIST_IMAGE_FALLBACK
  }
  return item.offer.imageUrl
}

function resolvePlayItemName(item: PlayServiceListItem): string {
  if (item.kind === 'service') {
    return item.service.name
  }
  if (item.kind === 'event-package') {
    return item.pkg.name
  }
  return item.offer.name
}

function renderPlayItemPreview(item: PlayServiceListItem): ReactNode {
  const imageSrc = resolvePlayItemImageSrc(item)
  const label = resolvePlayItemName(item)

  if (item.kind === 'service') {
    return (
      <PlayServiceHoverDetail service={item.service} imageSrc={imageSrc} label={label} />
    )
  }
  if (item.kind === 'event-package') {
    return (
      <EventPackageHoverDetail
        pkg={item.pkg}
        bookingService={item.bookingService}
        imageSrc={imageSrc}
        label={label}
      />
    )
  }
  return (
    <PlayMembershipOfferHoverDetail
      offer={item.offer}
      displayPrice={item.displayPrice}
      imageSrc={imageSrc}
      label={label}
    />
  )
}

function mapPlayItemToCatalogItem(item: PlayServiceListItem): CatalogItemNameListItem {
  return {
    id: item.id,
    name: resolvePlayItemName(item),
    description: resolvePlayItemDescription(item),
    priceLabel: resolvePlayItemPriceLabel(item),
    href: item.href,
    renderPreview: () => renderPlayItemPreview(item),
  }
}

export function PlayServiceNameList({
  items,
  isLoading = false,
  categoryName,
  listHeadingSuffix = 'passes & services',
  listDescription = 'Select a service to book. Hover the image for a preview.',
  emptyMessage = 'No services available in this category yet.',
  listAriaLabel = 'Play services',
}: Readonly<PlayServiceNameListProps>) {
  const catalogItems = items.map(mapPlayItemToCatalogItem)

  return (
    <CatalogItemNameList
      items={catalogItems}
      isLoading={isLoading}
      categoryName={categoryName}
      listHeadingSuffix={listHeadingSuffix}
      listDescription={listDescription}
      emptyMessage={emptyMessage}
      listAriaLabel={listAriaLabel}
      loadingAriaLabel="Loading services"
    />
  )
}
