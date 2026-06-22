/** Learn category route shell — hero, list, and cart for `/learn/[categoryId]`. */
'use client'

import { useMemo } from 'react'
import { notFound } from 'next/navigation'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { LearnCategoryDetailClient } from '@/components/customer/learn-category-detail-client'
import { decodeLearnCategoryParam } from '@/lib/learn-category-routes'
import { resolveSchedulingCategoryForConsumerRoute } from '@/lib/scheduling-category-route-resolve'
import { useScheduling } from '@/lib/scheduling-store'

export interface LearnCategoryRoutePageProps {
  readonly categoryId: string
}

export function LearnCategoryRoutePage({ categoryId }: Readonly<LearnCategoryRoutePageProps>) {
  const { categories } = useScheduling()
  const decodedId = decodeLearnCategoryParam(categoryId)
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
        <LearnCategoryDetailClient category={category} categoryIndex={categoryIndex} />
      </main>
      <CustomerFooter />
    </>
  )
}
