/** Featured rental cards for landing page. */
import { RentalProductCard } from '@/components/customer/rental-product-card'
import type { Product } from '@/lib/types'

interface RentalFeaturedItemsProps {
  readonly products: Product[]
}

export function RentalFeaturedItems({ products }: Readonly<RentalFeaturedItemsProps>) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-black text-foreground">Featured rental items</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <RentalProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
