/** Product sub-category rails on Gym / Play / Events when placed from product menus. */
'use client'

import { useMemo } from 'react'

import { HorizontalScrollSection } from '@/components/customer/horizontal-scroll-section'
import { ShopProductCard } from '@/components/customer/shop-product-card'
import type { SchedulingCatalogSlug } from '@/lib/catalog-slugs'
import { useCafe } from '@/lib/cafe-store'
import { useInventory } from '@/lib/inventory-store'
import {
  buildProductSectionsForSchedulingMenu,
  type ProductSchedulingMenuSection,
} from '@/lib/product-scheduling-menu-sections'

interface SchedulingMenuProductRailsProps {
  readonly menuSlug: SchedulingCatalogSlug
  readonly sections?: readonly ProductSchedulingMenuSection[]
}

export function SchedulingMenuProductRails({
  menuSlug,
  sections: sectionsOverride,
}: SchedulingMenuProductRailsProps) {
  const { products, productCategories } = useInventory()
  const { cafeProducts } = useCafe()

  const builtSections = useMemo(
    () =>
      buildProductSectionsForSchedulingMenu({
        menuSlug,
        productCategories,
        products,
        cafeProducts,
      }),
    [cafeProducts, menuSlug, productCategories, products],
  )

  const sections = sectionsOverride ?? builtSections

  if (sections.length === 0) {
    return null
  }

  return (
    <>
      {sections.map((section) => (
        <div
          key={`product-menu-${section.id}`}
          id={`product-menu-${section.id}`}
          className="scroll-mt-32"
        >
          <HorizontalScrollSection title={section.title} description={section.description}>
            {section.products.map((product) => (
              <div key={product.id} className="w-[260px] shrink-0 snap-start">
                <ShopProductCard product={product} className="h-full" />
              </div>
            ))}
          </HorizontalScrollSection>
        </div>
      ))}
    </>
  )
}
