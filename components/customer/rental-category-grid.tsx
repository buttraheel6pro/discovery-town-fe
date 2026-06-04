/** Rentals category sections rendered inline with products. */

import { HorizontalScrollSection } from '@/components/customer/horizontal-scroll-section'
import { ScrollableSectionBreadcrumbs } from '@/components/customer/scrollable-section-breadcrumbs'
import { ShopProductCard } from '@/components/customer/shop-product-card'
import type { SchedulingMenuBrowseCrumb } from '@/lib/scheduling-menu-browse'
import type { ProductCategory, Product } from '@/lib/types'

interface RentalCategoryGridProps {
  readonly categories: ProductCategory[]
  readonly products: Product[]
  readonly breadcrumbItems?: readonly SchedulingMenuBrowseCrumb[]
}

export function RentalCategoryGrid({
  categories,
  products,
  breadcrumbItems: breadcrumbItemsProp,
}: Readonly<RentalCategoryGridProps>) {
  const breadcrumbItems =
    breadcrumbItemsProp ??
    categories.map((category) => ({
      id: category.id,
      label: category.name,
      href: `#${category.slug}`,
    }))

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-black text-foreground">Browse rental categories</h2>
      <ScrollableSectionBreadcrumbs items={breadcrumbItems} />
      <div className="space-y-8">
        {categories.map((category) => {
          const items = products.filter((product) => product.categoryId === category.id)
          if (items.length === 0) {
            return null
          }
          return (
            <div id={category.slug} key={category.id}>
              <HorizontalScrollSection
                title={category.name}
                description={category.description ?? 'Rental products available in this category'}
                viewAllHref={`/rentals/${category.slug}`}
              >
                {items.map((product) => (
                  <div key={product.id} className="w-[260px] shrink-0 snap-start">
                    <ShopProductCard product={product} />
                  </div>
                ))}
              </HorizontalScrollSection>
            </div>
          )
        })}
      </div>
    </section>
  )
}
