/** Product / rental name list — maps inventory items onto the shared catalog list. */
'use client'

import type { ReactNode } from 'react'

import {
  CatalogItemNameList,
  CATALOG_ITEM_LIST_IMAGE_FALLBACK,
  type CatalogItemNameListItem,
} from '@/components/customer/catalog-item-name-list'
import { RentalProductHoverDetail } from '@/components/customer/rental-product-hover-detail'
import { formatPrice } from '@/lib/utils'

const DESCRIPTION_FALLBACK = 'Tap to view details and add to cart.'

export interface RentalProductListItem {
  readonly id: string
  readonly name: string
  readonly description?: string | null
  readonly imageUrl?: string | null
  readonly price: number
  readonly href: string
}

export interface RentalProductNameListProps {
  readonly items: readonly RentalProductListItem[]
  readonly isLoading?: boolean
  readonly categoryName?: string
  readonly listHeadingSuffix?: string
  readonly listDescription?: string
  readonly emptyMessage?: string
  readonly listAriaLabel?: string
}

function renderProductPreview(item: RentalProductListItem): ReactNode {
  const imageSrc = item.imageUrl?.trim() || CATALOG_ITEM_LIST_IMAGE_FALLBACK

  return (
    <RentalProductHoverDetail
      name={item.name}
      description={item.description}
      imageUrl={item.imageUrl}
      price={item.price}
      imageSrc={imageSrc}
    />
  )
}

function mapProductItemToCatalogItem(item: RentalProductListItem): CatalogItemNameListItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description?.trim() || DESCRIPTION_FALLBACK,
    priceLabel: formatPrice(item.price),
    href: item.href,
    renderPreview: () => renderProductPreview(item),
  }
}

export function RentalProductNameList({
  items,
  isLoading = false,
  categoryName,
  listHeadingSuffix = 'rental items',
  listDescription = 'Select an item to view details and add to cart. Hover the image for a preview.',
  emptyMessage = 'No rental items available in this category yet.',
  listAriaLabel = 'Rental products',
}: Readonly<RentalProductNameListProps>) {
  const catalogItems = items.map(mapProductItemToCatalogItem)

  return (
    <CatalogItemNameList
      items={catalogItems}
      isLoading={isLoading}
      categoryName={categoryName}
      listHeadingSuffix={listHeadingSuffix}
      listDescription={listDescription}
      emptyMessage={emptyMessage}
      listAriaLabel={listAriaLabel}
      loadingAriaLabel="Loading items"
    />
  )
}
