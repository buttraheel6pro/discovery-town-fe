/** Gym category route shell — hero, list, and cart for `/gym/[categoryId]`. */
'use client'

import { useMemo } from 'react'
import { notFound } from 'next/navigation'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { GymCategoryDetailClient } from '@/components/customer/gym-category-detail-client'
import { decodeGymCategoryParam } from '@/lib/gym-category-routes'
import { resolveSchedulingCategoryForConsumerRoute } from '@/lib/scheduling-category-route-resolve'
import { useScheduling } from '@/lib/scheduling-store'

export interface GymCategoryRoutePageProps {
  readonly categoryId: string
}

export function GymCategoryRoutePage({ categoryId }: Readonly<GymCategoryRoutePageProps>) {
  const { categories } = useScheduling()
  const decodedId = decodeGymCategoryParam(categoryId)
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
        <GymCategoryDetailClient category={category} categoryIndex={categoryIndex} />
      </main>
      <CustomerFooter />
    </>
  )
}
