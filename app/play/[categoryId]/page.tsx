/**
 * Play category page — facility-style hero, service list, and add-to-cart sidebar.
 */
'use client'

import { use, useMemo } from 'react'
import { notFound } from 'next/navigation'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { PlayCategoryDetailClient } from '@/components/customer/play-category-detail-client'
import { decodePlayCategoryParam } from '@/lib/play-category-routes'
import { resolveSchedulingCategoryForConsumerRoute } from '@/lib/scheduling-category-route-resolve'
import { useScheduling } from '@/lib/scheduling-store'

interface PlayCategoryPageProps {
  readonly params: Promise<{ categoryId: string }>
}

function PlayCategoryPageContent({ categoryId }: Readonly<{ categoryId: string }>) {
  const { categories } = useScheduling()
  const decodedId = decodePlayCategoryParam(categoryId)
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
        <PlayCategoryDetailClient category={category} categoryIndex={categoryIndex} />
      </main>
      <CustomerFooter />
    </>
  )
}

export default function PlayCategoryPage({ params }: PlayCategoryPageProps) {
  const { categoryId } = use(params)
  return <PlayCategoryPageContent categoryId={categoryId} />
}
