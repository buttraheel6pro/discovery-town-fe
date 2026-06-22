/**
 * Cafe category page — facility-style hero, product list, and cart sidebar.
 */
'use client'

import { use, useMemo } from 'react'
import { notFound } from 'next/navigation'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { CafeCategoryDetailClient } from '@/components/customer/cafe-category-detail-client'
import { useCafeCategories } from '@/hooks/use-cafe-categories'
import { resolveCafeConsumerCategoryForRoute } from '@/lib/cafe-consumer-categories'
import { resolveCafeCategorySlug } from '@/lib/cafe-category-routes'
import { useInventory } from '@/lib/inventory-store'
import { useInventoryHydrated } from '@/lib/redux/provider'

interface CafeCategoryPageProps {
  readonly params: Promise<{
    category: string
  }>
}

function CafeCategoryPageContent({
  categorySlug,
}: Readonly<{ categorySlug: string }>) {
  const { categories, isLoading: categoriesLoading } = useCafeCategories()
  const { productCategories } = useInventory()
  const inventoryHydrated = useInventoryHydrated()
  const resolvedSlug = resolveCafeCategorySlug(categorySlug)

  const category = useMemo(
    () => resolveCafeConsumerCategoryForRoute(resolvedSlug, productCategories),
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
        <CafeCategoryDetailClient category={category} categoryIndex={categoryIndex} />
      </main>
      <CustomerFooter />
    </>
  )
}

export default function CafeCategoryMenuPage({ params }: Readonly<CafeCategoryPageProps>) {
  const { category } = use(params)
  return <CafeCategoryPageContent categorySlug={category} />
}
