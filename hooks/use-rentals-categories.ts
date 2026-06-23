/** Resolves rentals menu product categories in consumer display order. */
'use client'

import { useEffect, useMemo, useState } from 'react'

import { fetchRentalCategories, type RentalPublicCategory } from '@/lib/api/rentals.api'
import { isApiEnabled } from '@/lib/api/client'
import { isMockDataEnabled } from '@/lib/config/data-source'
import {
  buildProductMenuExploreCategories,
  isProductMenuExploreEntry,
} from '@/lib/product-menu-explore-hook-utils'
import type { ProductMenuExploreCategory } from '@/lib/product-menu-explore-categories'
import { collectRentalsConsumerCategories } from '@/lib/rentals-consumer-categories'
import type { RentalsConsumerCategory } from '@/lib/rentals-consumer-categories'
import { STATIC_RENTALS_CONSUMER_CATEGORIES } from '@/lib/rentals-static-categories'
import { buildProductCategoryById } from '@/lib/product-visibility'
import { useInventory } from '@/lib/inventory-store'
import { useInventoryHydrated } from '@/lib/redux/provider'
import { useScheduling } from '@/lib/scheduling-store'
import type { ProductCategory } from '@/lib/types'

export type RentalsExploreCategory = ProductMenuExploreCategory

export type { RentalsConsumerCategory } from '@/lib/rentals-consumer-categories'

export interface UseRentalsCategoriesResult {
  readonly categories: RentalsExploreCategory[]
  readonly categoryById: ReadonlyMap<string, RentalsConsumerCategory>
  readonly categoryBySlug: ReadonlyMap<string, RentalsConsumerCategory>
  readonly isLoading: boolean
}

function slugifyRentalsCategoryName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function mergeApiCategory(
  apiCategory: RentalPublicCategory,
  inventoryById: ReadonlyMap<string, ProductCategory>,
): RentalsConsumerCategory {
  const inventory = inventoryById.get(apiCategory.id) ?? null
  const displayOrder =
    typeof apiCategory.displayOrder === 'number'
      ? apiCategory.displayOrder
      : (inventory?.displayOrder ?? 0)

  return {
    id: apiCategory.id,
    name: apiCategory.name,
    slug: inventory?.slug ?? slugifyRentalsCategoryName(apiCategory.name),
    description: apiCategory.description ?? inventory?.description ?? undefined,
    imageUrl: apiCategory.imageUrl ?? inventory?.imageUrl ?? undefined,
    displayOrder,
  }
}

function withMockStaticFallback(
  categories: readonly RentalsConsumerCategory[],
): RentalsConsumerCategory[] {
  if (categories.length > 0) {
    return [...categories]
  }
  if (isMockDataEnabled()) {
    return [...STATIC_RENTALS_CONSUMER_CATEGORIES]
  }
  return []
}

export function useRentalsCategories(): UseRentalsCategoriesResult {
  const inventoryHydrated = useInventoryHydrated()
  const { productCategories } = useInventory()
  const { categories: schedulingCategories } = useScheduling()
  const [apiCategories, setApiCategories] = useState<RentalPublicCategory[]>([])
  const [apiReady, setApiReady] = useState(() => isMockDataEnabled() || !isApiEnabled)

  useEffect(() => {
    if (isMockDataEnabled() || !isApiEnabled) {
      setApiReady(true)
      return
    }

    fetchRentalCategories()
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
    () => collectRentalsConsumerCategories(productCategories),
    [productCategories],
  )

  const productCategoriesForExplore = useMemo((): RentalsConsumerCategory[] => {
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
    (): RentalsExploreCategory[] =>
      buildProductMenuExploreCategories(
        'rentals',
        productCategoriesForExplore,
        schedulingCategories,
        productCategories,
      ),
    [productCategories, productCategoriesForExplore, schedulingCategories],
  )

  const productOnlyCategories = useMemo(
    (): RentalsConsumerCategory[] => categories.filter(isProductMenuExploreEntry),
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
