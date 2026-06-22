/** Resolves learn menu scheduling categories in consumer display order. */
'use client'

import { useMemo } from 'react'

import { schedulingCategoriesForConsumerMenu } from '@/lib/scheduling-menu-browse'
import { buildSchedulingMenuExploreCategories } from '@/lib/scheduling-menu-explore-hook-utils'
import type { SchedulingMenuExploreCategory } from '@/lib/scheduling-menu-explore-categories'
import { buildSchedulingCategoryById } from '@/lib/scheduling-visibility'
import { useInventory } from '@/lib/inventory-store'
import { useScheduling } from '@/lib/scheduling-store'
import type { SchedulingCategory } from '@/lib/types'

export interface UseLearnCategoriesResult {
  readonly categories: SchedulingCategory[]
  readonly exploreCategories: SchedulingMenuExploreCategory[]
  readonly categoryById: ReadonlyMap<string, SchedulingCategory>
}

export function useLearnCategories(): UseLearnCategoriesResult {
  const { categories } = useScheduling()
  const { productCategories } = useInventory()

  const categoryById = useMemo(() => buildSchedulingCategoryById(categories), [categories])

  const learnCategories = useMemo(
    () =>
      schedulingCategoriesForConsumerMenu('learn', categories).filter((category) =>
        category.id.startsWith('cat-learn-'),
      ),
    [categories],
  )

  const exploreCategories = useMemo(
    () => buildSchedulingMenuExploreCategories('learn', learnCategories, productCategories),
    [learnCategories, productCategories],
  )

  return {
    categories: learnCategories,
    exploreCategories,
    categoryById,
  }
}
