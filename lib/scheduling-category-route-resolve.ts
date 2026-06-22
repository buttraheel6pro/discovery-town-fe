/** Resolve a scheduling sub-category for native consumer detail routes. */
import { isConsumerVisibleSchedulingCategory } from '@/lib/scheduling-visibility'
import type { SchedulingCategory } from '@/lib/types'

export function resolveSchedulingCategoryForConsumerRoute(
  categoryId: string,
  categories: readonly SchedulingCategory[],
): SchedulingCategory | null {
  const category = categories.find((entry) => entry.id === categoryId) ?? null
  if (!category || !isConsumerVisibleSchedulingCategory(category)) {
    return null
  }
  return category
}
