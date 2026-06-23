/** Events sub-category card metadata — images, accents, and copy for the Events menu grid. */
import type { HomeExploreCardAccent } from '@/components/customer/home-explore-card'
import {
  resolveSchedulingCategoryDescription,
  resolveSchedulingCategoryImageSrc,
  SCHEDULING_CATEGORY_ACCENT_CYCLE,
  type SchedulingCategoryCardFields,
  type SchedulingCategoryCardMeta,
} from '@/lib/scheduling-category-card-meta'

export type EventsCategoryCardMeta = SchedulingCategoryCardMeta

export const EVENTS_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'cat-open-play':
    '2-hour, sibling, and multi-pass sessions plus membership and seasonal passes.',
  'cat-event-private-party-room-open-play':
    'Private party room packages with open play — Silver, Gold, and Platinum tiers.',
  'cat-event-whole-place-private-party-open-play':
    'Whole-venue private party packages with open play for larger celebrations.',
  'cat-special-play-events':
    'Character, holiday, fall/winter/spring seasonal festivals, and skill-building programmes.',
  'cat-summer-camp-play':
    'Themed summer camp weeks — register for a full week of supervised play and activities.',
}

export const EVENTS_CATEGORY_CARD_META: Record<
  string,
  { readonly description: string; readonly imageSrc: string; readonly accent: HomeExploreCardAccent }
> = {
  'cat-open-play': {
    description: EVENTS_CATEGORY_DESCRIPTIONS['cat-open-play'],
    imageSrc: '/play.png',
    accent: 'accent',
  },
  'cat-event-private-party-room-open-play': {
    description: EVENTS_CATEGORY_DESCRIPTIONS['cat-event-private-party-room-open-play'],
    imageSrc:
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=900&q=80',
    accent: 'primary',
  },
  'cat-event-whole-place-private-party-open-play': {
    description: EVENTS_CATEGORY_DESCRIPTIONS['cat-event-whole-place-private-party-open-play'],
    imageSrc:
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=900&q=80',
    accent: 'chart-4',
  },
  'cat-special-play-events': {
    description: EVENTS_CATEGORY_DESCRIPTIONS['cat-special-play-events'],
    imageSrc:
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=900&q=80',
    accent: 'chart-4',
  },
  'cat-summer-camp-play': {
    description: EVENTS_CATEGORY_DESCRIPTIONS['cat-summer-camp-play'],
    imageSrc:
      'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=900&q=80',
    accent: 'chart-5',
  },
}

export function resolveEventsCategoryCardMeta(
  category: SchedulingCategoryCardFields,
  index: number,
): EventsCategoryCardMeta {
  const known = EVENTS_CATEGORY_CARD_META[category.id]
  return {
    description: resolveSchedulingCategoryDescription(
      category,
      known?.description ?? EVENTS_CATEGORY_DESCRIPTIONS[category.id],
    ),
    imageSrc: resolveSchedulingCategoryImageSrc(category, known?.imageSrc),
    accent: known?.accent ?? SCHEDULING_CATEGORY_ACCENT_CYCLE[index % SCHEDULING_CATEGORY_ACCENT_CYCLE.length],
  }
}
