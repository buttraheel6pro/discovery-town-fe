/** Shared explore-category merge for Shop / Cafe / Rentals product menus. */
import type { ProductCatalogSlug } from '@/lib/catalog-slugs'
import {
  collectSchedulingCategoriesForProductMenuExplore,
  mergeProductMenuExploreCategories,
  type ProductMenuExploreCategory,
} from '@/lib/product-menu-explore-categories'
import type { ProductCategory, SchedulingCategory } from '@/lib/types'

export function buildProductMenuExploreCategories<
  T extends {
    readonly id: string
    readonly name: string
    readonly slug: string
    readonly description?: string
    readonly imageUrl?: string
    readonly displayOrder: number
  },
>(
  menuSlug: ProductCatalogSlug,
  productCategories: readonly T[],
  schedulingCategories: readonly SchedulingCategory[],
  inventoryProductCategories: readonly ProductCategory[],
): ProductMenuExploreCategory[] {
  const schedulingPlacedOnMenu = collectSchedulingCategoriesForProductMenuExplore(
    menuSlug,
    schedulingCategories,
    inventoryProductCategories,
  )

  return mergeProductMenuExploreCategories(productCategories, schedulingPlacedOnMenu)
}

export function isProductMenuExploreEntry(
  category: ProductMenuExploreCategory,
): category is ProductMenuExploreCategory & { readonly source: 'product' } {
  return category.source === 'product'
}

export function isSchedulingMenuExploreEntry(
  category: ProductMenuExploreCategory,
): category is ProductMenuExploreCategory & {
  readonly source: 'scheduling'
  readonly schedulingCategory: SchedulingCategory
} {
  return category.source === 'scheduling' && category.schedulingCategory != null
}
