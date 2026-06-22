/** Resolves play menu scheduling categories in consumer display order. */
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

export interface UsePlayCategoriesResult {
  readonly categories: SchedulingCategory[]
  readonly exploreCategories: SchedulingMenuExploreCategory[]
  readonly categoryById: ReadonlyMap<string, SchedulingCategory>
  readonly openPlayCategory: SchedulingCategory | null
}

export function usePlayCategories(): UsePlayCategoriesResult {
  const { categories, services, slots } = useScheduling()
  const { membershipPlans } = useClients()
  const { productCategories } = useInventory()

  const categoryById = useMemo(() => buildSchedulingCategoryById(categories), [categories])

  const playSchedulingCategories = useMemo(
    () => schedulingCategoriesForConsumerMenu('play', categories),
    [categories],
  )

  const openPlaySection = useMemo(
    () =>
      buildOpenPlayConsumerSection({
        menuSlug: 'play',
        categories,
        services,
        slots,
        plans: membershipPlans,
        categoryById,
        description: '',
      }),
    [categories, categoryById, membershipPlans, services, slots],
  )

  const playCategories = useMemo(() => {
    const openCategory = openPlaySection?.category ?? null
    const rest = playSchedulingCategories.filter(
      (category) => !isOpenPlaySchedulingCategory(category),
    )
    return openCategory ? [openCategory, ...rest] : rest
  }, [openPlaySection, playSchedulingCategories])

  const exploreCategories = useMemo(
    () => buildSchedulingMenuExploreCategories('play', playCategories, productCategories),
    [playCategories, productCategories],
  )

  return {
    categories: playCategories,
    exploreCategories,
    categoryById,
    openPlayCategory: openPlaySection?.category ?? null,
  }
}
