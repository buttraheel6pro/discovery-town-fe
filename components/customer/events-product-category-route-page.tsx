/** Events placed product category route — `/events/[slug]` for Take Out Party, etc. */
'use client'

import { useMemo } from 'react'
import { notFound } from 'next/navigation'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { EventsProductCategoryDetailClient } from '@/components/customer/events-product-category-detail-client'
import { useEventsCategories } from '@/hooks/use-events-categories'
import {
  type EventsProductConsumerCategory,
  resolveEventsPlacedProductCategoryForRoute,
} from '@/lib/events-product-consumer-categories'
import { decodeEventsProductCategoryParam } from '@/lib/events-product-category-routes'
import { useInventory } from '@/lib/inventory-store'
import { useInventoryHydrated } from '@/lib/redux/provider'

export interface EventsProductCategoryRoutePageProps {
  readonly categorySlug: string
}

export function EventsProductCategoryRoutePage({
  categorySlug,
}: Readonly<EventsProductCategoryRoutePageProps>) {
  const { productCategories } = useInventory()
  const inventoryHydrated = useInventoryHydrated()
  const { exploreCategories } = useEventsCategories()
  const decodedSlug = decodeEventsProductCategoryParam(categorySlug)

  const category = useMemo(
    (): EventsProductConsumerCategory | null =>
      resolveEventsPlacedProductCategoryForRoute(decodedSlug, productCategories),
    [decodedSlug, productCategories],
  )

  const categoryIndex = category
    ? exploreCategories.findIndex((entry) => entry.id === category.id)
    : -1

  if (!inventoryHydrated) {
    return null
  }

  if (!category) {
    notFound()
  }

  return (
    <>
      <CustomerNavbar />
      <main>
        <EventsProductCategoryDetailClient
          category={category}
          categoryIndex={categoryIndex >= 0 ? categoryIndex : 0}
        />
      </main>
      <CustomerFooter />
    </>
  )
}
