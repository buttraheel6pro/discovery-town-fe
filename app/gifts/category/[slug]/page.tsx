/** Gifts category page — facility-style hero, product list, and cart sidebar. */
'use client'

import { use, useMemo } from 'react'
import { notFound } from 'next/navigation'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { GiftsCategoryDetailClient } from '@/components/customer/gifts-category-detail-client'
import { useGiftsCategories } from '@/hooks/use-gifts-categories'
import { resolveGiftsCategorySlug } from '@/lib/gifts-category-routes'
import { resolveGiftsConsumerCategoryForRoute } from '@/lib/gifts-consumer-categories'
import { useInventory } from '@/lib/inventory-store'
import { useInventoryHydrated } from '@/lib/redux/provider'

interface GiftsCategoryPageProps {
  readonly params: Promise<{
    slug: string
  }>
}

function GiftsCategoryPageContent({ categorySlug }: Readonly<{ categorySlug: string }>) {
  const { categories, isLoading: categoriesLoading } = useGiftsCategories()
  const { productCategories } = useInventory()
  const inventoryHydrated = useInventoryHydrated()
  const resolvedSlug = resolveGiftsCategorySlug(categorySlug)

  const category = useMemo(
    () => resolveGiftsConsumerCategoryForRoute(resolvedSlug, productCategories),
    [productCategories, resolvedSlug],
  )

  const categoryIndex = category
    ? categories.findIndex((entry) => entry.id === category.id)
    : -1

  if (!inventoryHydrated || categoriesLoading) {
    return null
  }

  if (!category) {
    notFound()
  }

  return (
    <>
      <CustomerNavbar />
      <main>
        <GiftsCategoryDetailClient category={category} categoryIndex={categoryIndex} />
      </main>
      <CustomerFooter />
    </>
  )
}

export default function GiftsCategoryPage({ params }: Readonly<GiftsCategoryPageProps>) {
  const { slug } = use(params)
  return <GiftsCategoryPageContent categorySlug={slug} />
}
