/** Shop category page — facility-style hero, product list, and cart sidebar. */
'use client'

import { use, useMemo } from 'react'
import { notFound } from 'next/navigation'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { ShopCategoryDetailClient } from '@/components/customer/shop-category-detail-client'
import { useShopCategories } from '@/hooks/use-shop-categories'
import { useInventory } from '@/lib/inventory-store'
import { useInventoryHydrated } from '@/lib/redux/provider'
import { resolveShopCategorySlug } from '@/lib/shop-category-routes'
import { resolveShopConsumerCategoryForRoute } from '@/lib/shop-consumer-categories'

interface ShopCategoryPageProps {
  readonly params: Promise<{
    slug: string
  }>
}

function ShopCategoryPageContent({ categorySlug }: Readonly<{ categorySlug: string }>) {
  const { categories, isLoading: categoriesLoading } = useShopCategories()
  const { productCategories } = useInventory()
  const inventoryHydrated = useInventoryHydrated()
  const resolvedSlug = resolveShopCategorySlug(categorySlug)

  const category = useMemo(
    () => resolveShopConsumerCategoryForRoute(resolvedSlug, productCategories),
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
        <ShopCategoryDetailClient category={category} categoryIndex={categoryIndex} />
      </main>
      <CustomerFooter />
    </>
  )
}

export default function ShopCategoryPage({ params }: Readonly<ShopCategoryPageProps>) {
  const { slug } = use(params)
  return <ShopCategoryPageContent categorySlug={slug} />
}
