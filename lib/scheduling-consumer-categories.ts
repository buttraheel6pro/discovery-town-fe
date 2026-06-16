/** Gym / Play / Event grouping for consumer-aligned scheduling category ids. */

import {
  getCustomerSchedulingMenuSlug,
  type SchedulingCategoryPlacementFields,
} from '@/lib/catalog-placement'
import type { SchedulingCatalogSlug } from '@/lib/catalog-slugs'

export const SCHEDULING_TOP_LEVEL_ORDER = ['GYM', 'PLAY', 'EVENT', 'LEARN'] as const

export type SchedulingTopLevelId = (typeof SCHEDULING_TOP_LEVEL_ORDER)[number]

const LEARN_CATEGORY_IDS = new Set<string>([
  'cat-learn-elementary',
  'cat-learn-middle',
  'cat-learn-high-school',
  'cat-learn-test-prep-college',
  'cat-learn-test-prep-private-school',
  'cat-learn-test-prep-adult',
  'cat-learn-enrichment-technology',
  'cat-learn-enrichment-life-skills',
  'cat-learn-enrichment-arts',
])

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
  'cat-gym-parents',
  'cat-gym-after-school',
  'cat-event-private-party-room-open-play',
  'cat-event-whole-place-private-party-open-play',
  'cat-learn-elementary',
  'cat-learn-middle',
  'cat-learn-high-school',
  'cat-learn-test-prep-college',
  'cat-learn-test-prep-private-school',
  'cat-learn-test-prep-adult',
  'cat-learn-enrichment-technology',
  'cat-learn-enrichment-life-skills',
  'cat-learn-enrichment-arts',
])

export function isConsumerAlignedCategoryId(categoryId: string): boolean {
  if (CONSUMER_ALIGNED_CATEGORY_IDS.has(categoryId)) {
    return true
  }
  return (
    categoryId.startsWith('cat-gym-') ||
    categoryId.startsWith('cat-play-') ||
    categoryId.startsWith('cat-event-') ||
    categoryId.startsWith('cat-learn-')
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
  if (LEARN_CATEGORY_IDS.has(categoryId) || categoryId.startsWith('cat-learn-')) {
    return 'LEARN'
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
    case 'LEARN':
      return 'Learn'
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
      return {
        href: `/events#events-section-${categoryId}`,
        label: 'Back to Events',
      }
    case 'learn':
    default:
      return { href: `/learn#${categoryId}`, label: 'Back to Learn' }
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
    case 'LEARN':
      return { href: `/learn#${categoryId}`, label: 'Back to Learn' }
    case 'EVENT':
    default:
      return {
        href: `/events#events-section-${categoryId}`,
        label: 'Back to Events',
      }
  }
}
