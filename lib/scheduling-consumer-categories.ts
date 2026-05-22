/** Gym / Play / Event grouping for consumer-aligned scheduling category ids. */

export const SCHEDULING_TOP_LEVEL_ORDER = ['GYM', 'PLAY', 'EVENT'] as const

export type SchedulingTopLevelId = (typeof SCHEDULING_TOP_LEVEL_ORDER)[number]

const PLAY_CATEGORY_IDS = new Set<string>([
  'cat-open-play',
  'cat-private-play',
  'cat-camps-play',
  'cat-special-play-events',
  'cat-parents-night',
  'cat-field-trips',
  'cat-we-bring-play',
])

export const CONSUMER_ALIGNED_CATEGORY_IDS = new Set<string>([
  'cat-open-play',
  'cat-private-play',
  'cat-special-play-events',
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
  'cat-5',
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
