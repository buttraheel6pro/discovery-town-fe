/** Rental category page — resolves category from persisted inventory catalog. */
'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'

import { RentalProductList } from '@/components/customer/rental-product-list'
import { findProductCategoryBySlugOnCustomerMenu } from '@/lib/catalog-placement'
import { useInventory } from '@/lib/inventory-store'
import { useInventoryHydrated } from '@/lib/redux/provider'

interface RentalCategoryPageProps {
  readonly params: Promise<{
    categorySlug: string
  }>
}

export default function RentalCategoryPage({ params }: Readonly<RentalCategoryPageProps>) {
  const { categorySlug } = use(params)
  const inventoryHydrated = useInventoryHydrated()
  const { productCategories } = useInventory()

  if (!inventoryHydrated) {
    return null
  }

  const category = findProductCategoryBySlugOnCustomerMenu(
    productCategories,
    categorySlug,
    'rentals',
  )

  if (!category) {
    notFound()
  }

  return (
    <RentalProductList
      categorySlug={categorySlug}
      categoryName={category.name}
      categoryDescription={category.description}
    />
  )
}
