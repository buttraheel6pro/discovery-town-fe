/**
 * Play category page — facility-style hero, service list, and add-to-cart sidebar.
 */
'use client'

import { use, useEffect, useMemo } from 'react'
import { notFound, useRouter } from 'next/navigation'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { PlayCategoryDetailClient } from '@/components/customer/play-category-detail-client'
import { getCustomerSchedulingMenuSlug } from '@/lib/catalog-placement'
import { getEventsCategoryHref } from '@/lib/events-category-routes'
import { decodePlayCategoryParam } from '@/lib/play-category-routes'
import { resolveSchedulingCategoryForConsumerRoute } from '@/lib/scheduling-category-route-resolve'
import { useScheduling } from '@/lib/scheduling-store'

interface PlayCategoryPageProps {
  readonly params: Promise<{ categoryId: string }>
}

function PlayCategoryPageContent({ categoryId }: Readonly<{ categoryId: string }>) {
  const router = useRouter()
  const { categories } = useScheduling()
  const decodedId = decodePlayCategoryParam(categoryId)
  const category = useMemo(
    () => resolveSchedulingCategoryForConsumerRoute(decodedId, categories),
    [categories, decodedId],
  )

  const eventsHref = useMemo(() => {
    if (!category) {
      return null
    }
    const menuSlug = getCustomerSchedulingMenuSlug(category)
    return menuSlug === 'events' ? getEventsCategoryHref(category.id) : null
  }, [category])

  useEffect(() => {
    if (eventsHref) {
      router.replace(eventsHref)
    }
  }, [eventsHref, router])

  if (!category) {
    notFound()
  }

  if (eventsHref) {
    return null
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
