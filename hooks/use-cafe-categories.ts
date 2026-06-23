/** Resolves cafe & food menu product categories in consumer display order. */
'use client'

import { useEffect, useMemo, useState } from 'react'

import { fetchCafeCategories, type PublicProductCategory } from '@/lib/api/cafe.api'
import { isApiEnabled } from '@/lib/api/client'
import { collectCafeConsumerCategories } from '@/lib/cafe-consumer-categories'
import type { CafeConsumerCategory } from '@/lib/cafe-consumer-categories'
import { STATIC_CAFE_CONSUMER_CATEGORIES } from '@/lib/cafe-static-categories'
import { isMockDataEnabled } from '@/lib/config/data-source'
import {
  buildProductMenuExploreCategories,
  isProductMenuExploreEntry,
} from '@/lib/product-menu-explore-hook-utils'
import type { ProductMenuExploreCategory } from '@/lib/product-menu-explore-categories'
import { buildProductCategoryById } from '@/lib/product-visibility'
import { useInventory } from '@/lib/inventory-store'
import { useInventoryHydrated } from '@/lib/redux/provider'
import { useScheduling } from '@/lib/scheduling-store'
import type { ProductCategory } from '@/lib/types'

export type CafeExploreCategory = ProductMenuExploreCategory

export type { CafeConsumerCategory } from '@/lib/cafe-consumer-categories'

export interface UseCafeCategoriesResult {
  readonly categories: CafeExploreCategory[]
  readonly categoryById: ReadonlyMap<string, CafeConsumerCategory>
  readonly categoryBySlug: ReadonlyMap<string, CafeConsumerCategory>
  readonly isLoading: boolean
}

function slugifyCafeCategoryName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function mergeApiCategory(
  apiCategory: PublicProductCategory,
  inventoryById: ReadonlyMap<string, ProductCategory>,
): CafeConsumerCategory {
  const inventory = inventoryById.get(apiCategory.id) ?? null
  const displayOrder =
    typeof apiCategory.displayOrder === 'number'
      ? apiCategory.displayOrder
      : (inventory?.displayOrder ?? 0)

  return {
    id: apiCategory.id,
    name: apiCategory.name,
    slug: inventory?.slug ?? slugifyCafeCategoryName(apiCategory.name),
    description: apiCategory.description ?? inventory?.description ?? undefined,
    imageUrl: apiCategory.imageUrl ?? inventory?.imageUrl ?? undefined,
    displayOrder,
  }
}

function withMockStaticFallback(
  categories: readonly CafeConsumerCategory[],
): CafeConsumerCategory[] {
  if (categories.length > 0) {
    return [...categories]
  }
  if (isMockDataEnabled()) {
    return [...STATIC_CAFE_CONSUMER_CATEGORIES]
  }
  return []
}

export function useCafeCategories(): UseCafeCategoriesResult {
  const inventoryHydrated = useInventoryHydrated()
  const { productCategories } = useInventory()
  const { categories: schedulingCategories } = useScheduling()
  const [apiCategories, setApiCategories] = useState<PublicProductCategory[]>([])
  const [apiReady, setApiReady] = useState(() => isMockDataEnabled() || !isApiEnabled)

  useEffect(() => {
    if (isMockDataEnabled() || !isApiEnabled) {
      setApiReady(true)
      return
    }

    fetchCafeCategories()
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
    () => collectCafeConsumerCategories(productCategories),
    [productCategories],
  )

  const productCategoriesForExplore = useMemo((): CafeConsumerCategory[] => {
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
    (): CafeExploreCategory[] =>
      buildProductMenuExploreCategories(
        'cafe-food',
        productCategoriesForExplore,
        schedulingCategories,
        productCategories,
      ),
    [productCategories, productCategoriesForExplore, schedulingCategories],
  )

  const productOnlyCategories = useMemo(
    (): CafeConsumerCategory[] => categories.filter(isProductMenuExploreEntry),
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
