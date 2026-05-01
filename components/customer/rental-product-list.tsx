/** Reusable rental category product list template. */
'use client'

import { useMemo } from 'react'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { ShopProductCard } from '@/components/customer/shop-product-card'
import { useInventory } from '@/lib/inventory-store'

interface RentalProductListProps {
  readonly categorySlug: string
  readonly categoryName: string
  readonly categoryDescription?: string
}

export function RentalProductList({
  categorySlug,
  categoryName,
  categoryDescription,
}: Readonly<RentalProductListProps>) {
  const { products, productCategories } = useInventory()

  const categoryIds = useMemo(() => {
    const target = productCategories.find((category) => category.slug === categorySlug)
    if (!target) {
      return []
    }
    return [target.id]
  }, [categorySlug, productCategories])

  const items = useMemo(
    () =>
      products
        .filter((product) => product.isActive && categoryIds.includes(product.categoryId))
        .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured)),
    [categoryIds, products],
  )

  return (
    <>
      <CustomerNavbar />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-black text-foreground">{categoryName}</h1>
          <p className="text-muted-foreground">{categoryDescription ?? 'Rental products for this category.'}</p>
        </header>
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((product) => (
            <ShopProductCard key={product.id} product={product} />
          ))}
        </section>
      </main>
      <CustomerFooter />
    </>
  )
}
