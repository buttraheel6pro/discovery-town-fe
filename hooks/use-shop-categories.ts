/** Resolves shop menu product categories in consumer display order. */
'use client'

import { useEffect, useMemo, useState } from 'react'

import { fetchShopCategories, type ShopPublicCategory } from '@/lib/api/shop.api'
import { isApiEnabled } from '@/lib/api/client'
import { isMockDataEnabled } from '@/lib/config/data-source'
import {
  buildProductMenuExploreCategories,
  isProductMenuExploreEntry,
} from '@/lib/product-menu-explore-hook-utils'
import type { ProductMenuExploreCategory } from '@/lib/product-menu-explore-categories'
import { collectShopConsumerCategories } from '@/lib/shop-consumer-categories'
import type { ShopConsumerCategory } from '@/lib/shop-consumer-categories'
import { STATIC_SHOP_CONSUMER_CATEGORIES } from '@/lib/shop-static-categories'
import { buildProductCategoryById } from '@/lib/product-visibility'
import { useInventory } from '@/lib/inventory-store'
import { useInventoryHydrated } from '@/lib/redux/provider'
import { useScheduling } from '@/lib/scheduling-store'
import type { ProductCategory } from '@/lib/types'

export type ShopExploreCategory = ProductMenuExploreCategory

export type { ShopConsumerCategory } from '@/lib/shop-consumer-categories'

export interface UseShopCategoriesResult {
  readonly categories: ShopExploreCategory[]
  readonly categoryById: ReadonlyMap<string, ShopConsumerCategory>
  readonly categoryBySlug: ReadonlyMap<string, ShopConsumerCategory>
  readonly isLoading: boolean
}

function slugifyShopCategoryName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function mergeApiCategory(
  apiCategory: ShopPublicCategory,
  inventoryById: ReadonlyMap<string, ProductCategory>,
): ShopConsumerCategory {
  const inventory = inventoryById.get(apiCategory.id) ?? null
  const displayOrder =
    typeof apiCategory.displayOrder === 'number'
      ? apiCategory.displayOrder
      : (inventory?.displayOrder ?? 0)

  return {
    id: apiCategory.id,
    name: apiCategory.name,
    slug: inventory?.slug ?? slugifyShopCategoryName(apiCategory.name),
    description: apiCategory.description ?? inventory?.description ?? undefined,
    imageUrl: apiCategory.imageUrl ?? inventory?.imageUrl ?? undefined,
    displayOrder,
  }
}

function withMockStaticFallback(
  categories: readonly ShopConsumerCategory[],
): ShopConsumerCategory[] {
  if (categories.length > 0) {
    return [...categories]
  }
  if (isMockDataEnabled()) {
    return [...STATIC_SHOP_CONSUMER_CATEGORIES]
  }
  return []
}

export function useShopCategories(): UseShopCategoriesResult {
  const inventoryHydrated = useInventoryHydrated()
  const { productCategories } = useInventory()
  const { categories: schedulingCategories } = useScheduling()
  const [apiCategories, setApiCategories] = useState<ShopPublicCategory[]>([])
  const [apiReady, setApiReady] = useState(() => isMockDataEnabled() || !isApiEnabled)

  useEffect(() => {
    if (isMockDataEnabled() || !isApiEnabled) {
      setApiReady(true)
      return
    }

    fetchShopCategories()
      .then((categories) => {
        setApiCategories(categories)
      })
      .catch(() => {
        setApiCategories([])
      })
      .finally(() => {
        setApiReady(true)
      })
  }, [])

  const inventoryById = useMemo(
    () => buildProductCategoryById(productCategories),
    [productCategories],
  )

  const inventoryCategories = useMemo(
    () => collectShopConsumerCategories(productCategories),
    [productCategories],
  )

  const productCategoriesForExplore = useMemo((): ShopConsumerCategory[] => {
    if (isMockDataEnabled()) {
      return withMockStaticFallback(inventoryCategories)
    }

    if (!isApiEnabled) {
      return inventoryCategories
    }

    if (!apiReady) {
      return []
    }

    if (apiCategories.length === 0) {
      return inventoryCategories
    }

    return apiCategories
      .filter((category) => category.isActive !== false)
      .map((category) => mergeApiCategory(category, inventoryById))
      .sort((left, right) => left.displayOrder - right.displayOrder)
  }, [apiCategories, apiReady, inventoryById, inventoryCategories])

  const categories = useMemo(
    (): ShopExploreCategory[] =>
      buildProductMenuExploreCategories(
        'shop',
        productCategoriesForExplore,
        schedulingCategories,
        productCategories,
      ),
    [productCategories, productCategoriesForExplore, schedulingCategories],
  )

  const productOnlyCategories = useMemo(
    (): ShopConsumerCategory[] => categories.filter(isProductMenuExploreEntry),
    [categories],
  )

  const categoryById = useMemo(
    () => new Map(productOnlyCategories.map((category) => [category.id, category])),
    [productOnlyCategories],
  )

  const categoryBySlug = useMemo(
    () => new Map(productOnlyCategories.map((category) => [category.slug, category])),
    [productOnlyCategories],
  )

  const isLoading = !inventoryHydrated || (isApiEnabled && !apiReady)

  return {
    categories,
    categoryById,
    categoryBySlug,
    isLoading,
  }
}
