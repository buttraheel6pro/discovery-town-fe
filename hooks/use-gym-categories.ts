/** Resolves gym menu scheduling categories in consumer display order. */
'use client'

import { useMemo } from 'react'

import { useClients } from '@/lib/client-store'
import {
  buildOpenPlayConsumerSection,
  isOpenPlaySchedulingCategory,
} from '@/lib/open-play-consumer-section'
import { schedulingCategoriesForConsumerMenu } from '@/lib/scheduling-menu-browse'
import { buildSchedulingMenuExploreCategories } from '@/lib/scheduling-menu-explore-hook-utils'
import type { SchedulingMenuExploreCategory } from '@/lib/scheduling-menu-explore-categories'
import { buildSchedulingCategoryById } from '@/lib/scheduling-visibility'
import { useInventory } from '@/lib/inventory-store'
import { useScheduling } from '@/lib/scheduling-store'
import type { SchedulingCategory } from '@/lib/types'

export interface UseGymCategoriesResult {
  readonly categories: SchedulingCategory[]
  readonly exploreCategories: SchedulingMenuExploreCategory[]
  readonly categoryById: ReadonlyMap<string, SchedulingCategory>
  readonly openPlayCategory: SchedulingCategory | null
}

export function useGymCategories(): UseGymCategoriesResult {
  const { categories, services, slots } = useScheduling()
  const { membershipPlans } = useClients()
  const { productCategories } = useInventory()

  const categoryById = useMemo(() => buildSchedulingCategoryById(categories), [categories])

  const gymSchedulingCategories = useMemo(
    () => schedulingCategoriesForConsumerMenu('gym', categories),
    [categories],
  )

  const openPlaySection = useMemo(
    () =>
      buildOpenPlayConsumerSection({
        menuSlug: 'gym',
        categories,
        services,
        slots,
        plans: membershipPlans,
        categoryById,
        description: '',
      }),
    [categories, categoryById, membershipPlans, services, slots],
  )

  const gymCategories = useMemo(() => {
    const openCategory = openPlaySection?.category ?? null
    const rest = gymSchedulingCategories.filter(
      (category) => !isOpenPlaySchedulingCategory(category),
    )
    return openCategory ? [openCategory, ...rest] : rest
  }, [gymSchedulingCategories, openPlaySection])

  const exploreCategories = useMemo(
    () => buildSchedulingMenuExploreCategories('gym', gymCategories, productCategories),
    [gymCategories, productCategories],
  )

  return {
    categories: gymCategories,
    exploreCategories,
    categoryById,
    openPlayCategory: openPlaySection?.category ?? null,
  }
}
