/** Rentals category sections rendered inline with products. */

import { HorizontalScrollSection } from '@/components/customer/horizontal-scroll-section'
import { ShopProductCard } from '@/components/customer/shop-product-card'
import type { ProductCategory, Product } from '@/lib/types'

interface RentalCategoryGridProps {
  readonly categories: ProductCategory[]
  readonly products: Product[]
}

export function RentalCategoryGrid({ categories, products }: Readonly<RentalCategoryGridProps>) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-black text-foreground">Browse rental categories</h2>
      <div className="overflow-hidden">
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`#${category.slug}`}
              className="shrink-0 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              {category.name}
            </a>
          ))}
        </div>
      </div>
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
