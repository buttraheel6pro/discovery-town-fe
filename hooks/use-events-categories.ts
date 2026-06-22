/** Resolves events menu scheduling categories in consumer display order. */
'use client'

import { useMemo } from 'react'

import { useClients } from '@/lib/client-store'
import {
  buildOpenPlayConsumerSection,
  dedupeOpenPlayMenuCategories,
  isOpenPlaySchedulingCategory,
} from '@/lib/open-play-consumer-section'
import {
  buildSchedulingCategoryById,
  filterConsumerSchedulingCategoriesForMenu,
} from '@/lib/scheduling-visibility'
import { buildSchedulingMenuExploreCategories } from '@/lib/scheduling-menu-explore-hook-utils'
import type { SchedulingMenuExploreCategory } from '@/lib/scheduling-menu-explore-categories'
import { useInventory } from '@/lib/inventory-store'
import { useScheduling } from '@/lib/scheduling-store'
import type { SchedulingCategory } from '@/lib/types'

const PRIORITIZED_EVENT_CATEGORY_NAMES = [
  'Private Party Room & Open Play',
  'The Whole Place Private Party & Open Play',
] as const

export interface UseEventsCategoriesResult {
  readonly categories: SchedulingCategory[]
  readonly exploreCategories: SchedulingMenuExploreCategory[]
  readonly categoryById: ReadonlyMap<string, SchedulingCategory>
  readonly openPlayCategory: SchedulingCategory | null
}

export function useEventsCategories(): UseEventsCategoriesResult {
  const { categories, services, slots } = useScheduling()
  const { membershipPlans } = useClients()
  const { productCategories } = useInventory()

  const categoryById = useMemo(() => buildSchedulingCategoryById(categories), [categories])

  const openPlaySection = useMemo(
    () =>
      buildOpenPlayConsumerSection({
        menuSlug: 'events',
        categories,
        services,
        slots,
        plans: membershipPlans,
        categoryById,
        description: '',
      }),
    [categories, categoryById, membershipPlans, services, slots],
  )

  const eventsCategories = useMemo(() => {
    const prioritizedCategoryOrder = new Map<string, number>(
      PRIORITIZED_EVENT_CATEGORY_NAMES.map((name, index) => [name, index]),
    )

    const eventCategories = dedupeOpenPlayMenuCategories(
      filterConsumerSchedulingCategoriesForMenu('events', categories),
    )
      .filter(
        (category) =>
          !isOpenPlaySchedulingCategory(category) &&
          category.id.startsWith('cat-event-'),
      )
      .sort((a, b) => {
        const aPriority = prioritizedCategoryOrder.get(a.name)
        const bPriority = prioritizedCategoryOrder.get(b.name)

        if (aPriority !== undefined && bPriority !== undefined) {
          return aPriority - bPriority
        }

        if (aPriority !== undefined) {
          return -1
        }

        if (bPriority !== undefined) {
          return 1
        }

        return a.displayOrder - b.displayOrder
      })

    const openCategory = openPlaySection?.category ?? null
    return openCategory ? [openCategory, ...eventCategories] : eventCategories
  }, [categories, openPlaySection])

  const exploreCategories = useMemo(
    () => buildSchedulingMenuExploreCategories('events', eventsCategories, productCategories),
    [eventsCategories, productCategories],
  )

  return {
    categories: eventsCategories,
    exploreCategories,
    categoryById,
    openPlayCategory: openPlaySection?.category ?? null,
  }
}
