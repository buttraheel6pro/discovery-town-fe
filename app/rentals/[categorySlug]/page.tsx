/**
 * Rentals category page — facility-style hero, product list, and cart sidebar.
 */
'use client'

import { use, useMemo } from 'react'
import { notFound } from 'next/navigation'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { RentalsCategoryDetailClient } from '@/components/customer/rentals-category-detail-client'
import { useRentalsCategories } from '@/hooks/use-rentals-categories'
import { useInventory } from '@/lib/inventory-store'
import { useInventoryHydrated } from '@/lib/redux/provider'
import { resolveRentalsConsumerCategoryForRoute } from '@/lib/rentals-consumer-categories'
import { decodeRentalsCategoryParam } from '@/lib/rentals-category-routes'

interface RentalCategoryPageProps {
  readonly params: Promise<{
    categorySlug: string
  }>
}

function RentalCategoryPageContent({
  categorySlug,
}: Readonly<{ categorySlug: string }>) {
  const { categories, isLoading: categoriesLoading } = useRentalsCategories()
  const { productCategories } = useInventory()
  const inventoryHydrated = useInventoryHydrated()
  const decodedSlug = decodeRentalsCategoryParam(categorySlug)

  const category = useMemo(
    () => resolveRentalsConsumerCategoryForRoute(decodedSlug, productCategories),
    [decodedSlug, productCategories],
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
        <RentalsCategoryDetailClient category={category} categoryIndex={categoryIndex} />
      </main>
      <CustomerFooter />
    </>
  )
}

export default function RentalCategoryPage({ params }: Readonly<RentalCategoryPageProps>) {
  const { categorySlug } = use(params)
  return <RentalCategoryPageContent categorySlug={categorySlug} />
}
