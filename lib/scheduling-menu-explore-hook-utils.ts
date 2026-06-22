/** Shared explore-category merge for Gym / Play / Events / Learn menus. */
import type { SchedulingCatalogSlug } from '@/lib/catalog-slugs'
import {
  collectProductCategoriesForSchedulingMenuExplore,
  mergeSchedulingMenuExploreCategories,
  type SchedulingMenuExploreCategory,
} from '@/lib/scheduling-menu-explore-categories'
import type { ProductCategory, SchedulingCategory } from '@/lib/types'

export function buildSchedulingMenuExploreCategories(
  menuSlug: SchedulingCatalogSlug,
  schedulingCategories: readonly SchedulingCategory[],
  productCategories: readonly ProductCategory[],
): SchedulingMenuExploreCategory[] {
  const productPlacedOnMenu = collectProductCategoriesForSchedulingMenuExplore(
    menuSlug,
    productCategories,
  )

  return mergeSchedulingMenuExploreCategories(schedulingCategories, productPlacedOnMenu)
}

export function isSchedulingMenuNativeEntry(
  entry: SchedulingMenuExploreCategory,
): entry is SchedulingMenuExploreCategory & {
  readonly source: 'scheduling'
  readonly schedulingCategory: SchedulingCategory
} {
  return entry.source === 'scheduling' && entry.schedulingCategory != null
}

export function isSchedulingMenuProductEntry(
  entry: SchedulingMenuExploreCategory,
): entry is SchedulingMenuExploreCategory & {
  readonly source: 'product'
  readonly productCategory: ProductCategory
} {
  return entry.source === 'product' && entry.productCategory != null
}
