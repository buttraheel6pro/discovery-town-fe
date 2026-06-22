/** Shared Play / Events sub-category card metadata — admin imageUrl overrides static fallbacks. */
import type { HomeExploreCardAccent } from '@/components/customer/home-explore-card'
import type { SchedulingCategory } from '@/lib/types'

export interface SchedulingCategoryCardMeta {
  readonly description: string
  readonly imageSrc: string
  readonly accent: HomeExploreCardAccent
}

export const SCHEDULING_CATEGORY_DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=900&q=80'

export const SCHEDULING_CATEGORY_ACCENT_CYCLE: HomeExploreCardAccent[] = [
  'accent',
  'primary',
  'chart-4',
  'chart-5',
]

export type SchedulingCategoryCardFields = Pick<
  SchedulingCategory,
  'id' | 'name' | 'description' | 'imageUrl'
>

export function resolveSchedulingCategoryImageSrc(
  category: SchedulingCategoryCardFields,
  staticFallbackImageSrc?: string,
): string {
  const configured = category.imageUrl?.trim()
  if (configured) {
    return configured
  }
  return staticFallbackImageSrc ?? SCHEDULING_CATEGORY_DEFAULT_IMAGE
}

export function resolveSchedulingCategoryDescription(
  category: SchedulingCategoryCardFields,
  staticFallbackDescription?: string,
): string {
  const configured = category.description?.trim()
  if (configured) {
    return configured
  }
  if (staticFallbackDescription) {
    return staticFallbackDescription
  }
  return `Discover ${category.name.toLowerCase()} at Discovery Town.`
}
