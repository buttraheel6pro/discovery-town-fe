/** Rental category page route. */
import { notFound } from 'next/navigation'

import { RentalProductList } from '@/components/customer/rental-product-list'
import { findProductCategoryBySlugOnCustomerMenu } from '@/lib/catalog-placement'
import { productCategories } from '@/lib/mock-data'

interface RentalCategoryPageProps {
  readonly params: Promise<{
    categorySlug: string
  }>
}

export default async function RentalCategoryPage({ params }: Readonly<RentalCategoryPageProps>) {
  const { categorySlug } = await params
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
