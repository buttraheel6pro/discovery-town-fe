/** Gym / Play / Event grouping for consumer-aligned scheduling category ids. */

import {
  getCustomerSchedulingMenuSlug,
  type SchedulingCategoryPlacementFields,
} from '@/lib/catalog-placement'
import type { SchedulingCatalogSlug } from '@/lib/catalog-slugs'

export const SCHEDULING_TOP_LEVEL_ORDER = ['GYM', 'PLAY', 'EVENT'] as const

export type SchedulingTopLevelId = (typeof SCHEDULING_TOP_LEVEL_ORDER)[number]

const PLAY_CATEGORY_IDS = new Set<string>([
  'cat-open-play',
  'cat-private-play',
  'cat-summer-camp-play',
  'cat-camps-play',
  'cat-special-play-events',
  'cat-parents-night',
  'cat-field-trips',
  'cat-we-bring-play',
])

/** Pre–consumer-catalog ids (cat-1 … cat-6) — admin/seed only, not customer menus. */
export const LEGACY_SCHEDULING_CATEGORY_IDS = new Set<string>([
  'cat-1',
  'cat-2',
  'cat-3',
  'cat-4',
  'cat-5',
  'cat-6',
])

export function isLegacySchedulingCategoryId(categoryId: string): boolean {
  return LEGACY_SCHEDULING_CATEGORY_IDS.has(categoryId)
}

export const CONSUMER_ALIGNED_CATEGORY_IDS = new Set<string>([
  'cat-open-play',
  'cat-private-play',
  'cat-special-play-events',
  'cat-summer-camp-play',
  'cat-camps-play',
  'cat-parents-night',
  'cat-field-trips',
  'cat-we-bring-play',
  'cat-gym-babies',
  'cat-gym-toddlers',
  'cat-gym-preschool',
  'cat-gym-kids',
  'cat-gym-teens',
  'cat-gym-adults',
  'cat-gym-seniors',
  'cat-gym-family',
  'cat-gym-prenatal',
  'cat-gym-special-needs',
  'cat-event-private-party-room-open-play',
  'cat-event-whole-place-private-party-open-play',
])

export function isConsumerAlignedCategoryId(categoryId: string): boolean {
  if (CONSUMER_ALIGNED_CATEGORY_IDS.has(categoryId)) {
    return true
  }
  return (
    categoryId.startsWith('cat-gym-') ||
    categoryId.startsWith('cat-play-') ||
    categoryId.startsWith('cat-event-')
  )
}

export function getSchedulingTopLevelId(categoryId: string): SchedulingTopLevelId {
  if (isLegacySchedulingCategoryId(categoryId)) {
    return 'EVENT'
  }
  if (categoryId.startsWith('cat-gym-')) {
    return 'GYM'
  }
  if (PLAY_CATEGORY_IDS.has(categoryId) || categoryId.startsWith('cat-play-')) {
    return 'PLAY'
  }
  return 'EVENT'
}

export function getSchedulingTopLevelLabel(topLevelId: SchedulingTopLevelId): string {
  switch (topLevelId) {
    case 'GYM':
      return 'Gym'
    case 'PLAY':
      return 'Play'
    case 'EVENT':
      return 'Event'
    default:
      return 'Event'
  }
}

export interface SchedulingConsumerBackLink {
  readonly href: string
  readonly label: string
}

function consumerBackLinkForMenuSlug(
  menuSlug: SchedulingCatalogSlug,
  categoryId: string,
): SchedulingConsumerBackLink {
  switch (menuSlug) {
    case 'play':
      return { href: `/play#${categoryId}`, label: 'Back to Play' }
    case 'gym':
      return { href: `/gym#${categoryId}`, label: 'Back to Gym' }
    case 'events':
    default:
      return {
        href: `/events#events-section-${categoryId}`,
        label: 'Back to Events',
      }
  }
}

/** Consumer detail hero — return link using placement when available. */
export function getSchedulingConsumerBackLink(
  categoryId: string,
  category?: SchedulingCategoryPlacementFields | null,
): SchedulingConsumerBackLink {
  const menuSlug = category
    ? getCustomerSchedulingMenuSlug(category)
    : null
  if (menuSlug) {
    return consumerBackLinkForMenuSlug(menuSlug, categoryId)
  }
  const topLevel = getSchedulingTopLevelId(categoryId)
  switch (topLevel) {
    case 'PLAY':
      return { href: `/play#${categoryId}`, label: 'Back to Play' }
    case 'GYM':
      return { href: `/gym#${categoryId}`, label: 'Back to Gym' }
    case 'EVENT':
    default:
      return {
        href: `/events#events-section-${categoryId}`,
        label: 'Back to Events',
      }
  }
}
