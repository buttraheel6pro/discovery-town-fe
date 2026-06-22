/** Events category route shell — hero, list, and cart for `/events/[categoryId]`. */
'use client'

import { useMemo } from 'react'
import { notFound } from 'next/navigation'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { EventsCategoryDetailClient } from '@/components/customer/events-category-detail-client'
import { decodeEventsCategoryParam } from '@/lib/events-category-routes'
import { resolveSchedulingCategoryForConsumerRoute } from '@/lib/scheduling-category-route-resolve'
import { useScheduling } from '@/lib/scheduling-store'

export interface EventsCategoryRoutePageProps {
  readonly categoryId: string
}

export function EventsCategoryRoutePage({ categoryId }: Readonly<EventsCategoryRoutePageProps>) {
  const { categories } = useScheduling()
  const decodedId = decodeEventsCategoryParam(categoryId)
  const category = useMemo(
    () => resolveSchedulingCategoryForConsumerRoute(decodedId, categories),
    [categories, decodedId],
  )

  if (!category) {
    notFound()
  }

  const categoryIndex = categories.findIndex((entry) => entry.id === category.id)

  return (
    <>
      <CustomerNavbar />
      <main>
        <EventsCategoryDetailClient category={category} categoryIndex={categoryIndex} />
      </main>
      <CustomerFooter />
    </>
  )
}
