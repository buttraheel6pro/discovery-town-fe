/** Play sub-category card metadata — images, accents, and copy for the Play menu grid. */
import type { HomeExploreCardAccent } from '@/components/customer/home-explore-card'
import {
  resolveSchedulingCategoryDescription,
  resolveSchedulingCategoryImageSrc,
  SCHEDULING_CATEGORY_ACCENT_CYCLE,
  type SchedulingCategoryCardFields,
  type SchedulingCategoryCardMeta,
} from '@/lib/scheduling-category-card-meta'

export type PlayCategoryCardMeta = SchedulingCategoryCardMeta

export const PLAY_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'cat-open-play':
    '2-hour, sibling, and multi-pass session bookings. Membership and seasonal passes are listed below.',
  'cat-private-play': 'Private room, full venue takeover, and meeting-room conference options.',
  'cat-special-play-events':
    'Character, holiday, fall/winter/spring seasonal festivals, and skill-building programmes.',
  'cat-summer-camp-play':
    'Themed summer camp weeks — register for a full week of supervised play and activities.',
  'cat-camps-play': 'Winter break, spring break, and MLK day camp options.',
  'cat-parents-night': 'Saturday 4-7 PM supervised care for ages 6 months to 7 years.',
  'cat-field-trips': 'Structured group experiences for schools and organizations.',
}

export const PLAY_CATEGORY_CARD_META: Record<
  string,
  { readonly description: string; readonly imageSrc: string; readonly accent: HomeExploreCardAccent }
> = {
  'cat-open-play': {
    description: PLAY_CATEGORY_DESCRIPTIONS['cat-open-play'],
    imageSrc: '/play.png',
    accent: 'accent',
  },
  'cat-private-play': {
    description: PLAY_CATEGORY_DESCRIPTIONS['cat-private-play'],
    imageSrc:
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=900&q=80',
    accent: 'primary',
  },
  'cat-special-play-events': {
    description: PLAY_CATEGORY_DESCRIPTIONS['cat-special-play-events'],
    imageSrc:
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=900&q=80',
    accent: 'chart-4',
  },
  'cat-summer-camp-play': {
    description: PLAY_CATEGORY_DESCRIPTIONS['cat-summer-camp-play'],
    imageSrc:
      'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=900&q=80',
    accent: 'chart-5',
  },
  'cat-camps-play': {
    description: PLAY_CATEGORY_DESCRIPTIONS['cat-camps-play'],
    imageSrc:
      'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=900&q=80',
    accent: 'accent',
  },
  'cat-parents-night': {
    description: PLAY_CATEGORY_DESCRIPTIONS['cat-parents-night'],
    imageSrc:
      'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=900&q=80',
    accent: 'primary',
  },
  'cat-field-trips': {
    description: PLAY_CATEGORY_DESCRIPTIONS['cat-field-trips'],
    imageSrc:
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&q=80',
    accent: 'chart-4',
  },
}

export function resolvePlayCategoryCardMeta(
  category: SchedulingCategoryCardFields,
  index: number,
): PlayCategoryCardMeta {
  const known = PLAY_CATEGORY_CARD_META[category.id]
  return {
    description: resolveSchedulingCategoryDescription(
      category,
      known?.description ?? PLAY_CATEGORY_DESCRIPTIONS[category.id],
    ),
    imageSrc: resolveSchedulingCategoryImageSrc(category, known?.imageSrc),
    accent: known?.accent ?? SCHEDULING_CATEGORY_ACCENT_CYCLE[index % SCHEDULING_CATEGORY_ACCENT_CYCLE.length],
  }
}
