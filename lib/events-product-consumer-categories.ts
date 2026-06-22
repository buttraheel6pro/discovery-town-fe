/** Product sub-categories placed on the Events customer menu. */
import { normalizeCatalogSlug } from '@/lib/catalog-slugs'
import {
  buildProductCategoryById,
  isConsumerVisibleProductCategory,
} from '@/lib/product-visibility'
import type { ProductCategory } from '@/lib/types'

export interface EventsProductConsumerCategory {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly description?: string
  readonly imageUrl?: string
  readonly displayOrder: number
}

function mapInventoryCategory(category: ProductCategory): EventsProductConsumerCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    displayOrder: category.displayOrder,
  }
}

function isPlacedOnEventsMenu(category: ProductCategory): boolean {
  return normalizeCatalogSlug(category.placementCatalogSlug ?? null) === 'events'
}

/** `/events/[slug]` when the category is explicitly placed on Events. */
export function resolveEventsPlacedProductCategoryForRoute(
  slug: string,
  productCategories: readonly ProductCategory[],
): EventsProductConsumerCategory | null {
  const categoryById = buildProductCategoryById(productCategories)
  const category = productCategories.find((row) => row.slug === slug) ?? null

  if (!category || !isPlacedOnEventsMenu(category)) {
    return null
  }
  if ((category.parentId ?? null) === null) {
    return null
  }
  if (!isConsumerVisibleProductCategory(category, categoryById)) {
    return null
  }

  return mapInventoryCategory(category)
}
