/** Resolves gifts menu product categories in consumer display order. */
'use client'

import { useEffect, useMemo, useState } from 'react'

import { fetchGiftCategories, type GiftPublicCategory } from '@/lib/api/gifts.api'
import { isApiEnabled } from '@/lib/api/client'
import { isMockDataEnabled } from '@/lib/config/data-source'
import {
  buildProductMenuExploreCategories,
  isProductMenuExploreEntry,
} from '@/lib/product-menu-explore-hook-utils'
import type { ProductMenuExploreCategory } from '@/lib/product-menu-explore-categories'
import { collectGiftsConsumerCategories } from '@/lib/gifts-consumer-categories'
import type { GiftsConsumerCategory } from '@/lib/gifts-consumer-categories'
import { STATIC_GIFTS_CONSUMER_CATEGORIES } from '@/lib/gifts-static-categories'
import { buildProductCategoryById } from '@/lib/product-visibility'
import { useInventory } from '@/lib/inventory-store'
import { useInventoryHydrated } from '@/lib/redux/provider'
import { useScheduling } from '@/lib/scheduling-store'
import type { ProductCategory } from '@/lib/types'

export type GiftsExploreCategory = ProductMenuExploreCategory

export type { GiftsConsumerCategory } from '@/lib/gifts-consumer-categories'

export interface UseGiftsCategoriesResult {
  readonly categories: GiftsExploreCategory[]
  readonly categoryById: ReadonlyMap<string, GiftsConsumerCategory>
  readonly categoryBySlug: ReadonlyMap<string, GiftsConsumerCategory>
  readonly isLoading: boolean
}

function slugifyGiftsCategoryName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function mergeApiCategory(
  apiCategory: GiftPublicCategory,
  inventoryById: ReadonlyMap<string, ProductCategory>,
): GiftsConsumerCategory {
  const inventory = inventoryById.get(apiCategory.id) ?? null
  const displayOrder =
    typeof apiCategory.displayOrder === 'number'
      ? apiCategory.displayOrder
      : (inventory?.displayOrder ?? 0)

  return {
    id: apiCategory.id,
    name: apiCategory.name,
    slug: inventory?.slug ?? slugifyGiftsCategoryName(apiCategory.name),
    description: apiCategory.description ?? inventory?.description ?? undefined,
    imageUrl: apiCategory.imageUrl ?? inventory?.imageUrl ?? undefined,
    displayOrder,
  }
}

function withMockStaticFallback(
  categories: readonly GiftsConsumerCategory[],
): GiftsConsumerCategory[] {
  if (categories.length > 0) {
    return [...categories]
  }
  if (isMockDataEnabled()) {
    return [...STATIC_GIFTS_CONSUMER_CATEGORIES]
  }
  return []
}

export function useGiftsCategories(): UseGiftsCategoriesResult {
  const inventoryHydrated = useInventoryHydrated()
  const { productCategories } = useInventory()
  const { categories: schedulingCategories } = useScheduling()
  const [apiCategories, setApiCategories] = useState<GiftPublicCategory[]>([])
  const [apiReady, setApiReady] = useState(() => isMockDataEnabled() || !isApiEnabled)

  useEffect(() => {
    if (isMockDataEnabled() || !isApiEnabled) {
      setApiReady(true)
      return
    }

    fetchGiftCategories()
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
    () => collectGiftsConsumerCategories(productCategories),
    [productCategories],
  )

  const productCategoriesForExplore = useMemo((): GiftsConsumerCategory[] => {
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
    (): GiftsExploreCategory[] =>
      buildProductMenuExploreCategories(
        'gifts',
        productCategoriesForExplore,
        schedulingCategories,
        productCategories,
      ),
    [productCategories, productCategoriesForExplore, schedulingCategories],
  )

  const productOnlyCategories = useMemo(
    (): GiftsConsumerCategory[] => categories.filter(isProductMenuExploreEntry),
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
