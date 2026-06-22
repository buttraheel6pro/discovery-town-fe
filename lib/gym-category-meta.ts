/** Gym sub-category card metadata — images, accents, and copy for the Gym menu grid. */
import type { HomeExploreCardAccent } from '@/components/customer/home-explore-card'
import {
  resolveSchedulingCategoryDescription,
  resolveSchedulingCategoryImageSrc,
  SCHEDULING_CATEGORY_ACCENT_CYCLE,
  type SchedulingCategoryCardFields,
  type SchedulingCategoryCardMeta,
} from '@/lib/scheduling-category-card-meta'

export type GymCategoryCardMeta = SchedulingCategoryCardMeta

export const GYM_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'cat-open-play':
    '2-hour, sibling, and multi-pass sessions plus membership and seasonal passes.',
  'cat-gym-babies':
    'Sensory-rich exploration, soft surfaces, and early motor milestones for infants.',
  'cat-gym-toddlers':
    'Parent-guided movement, balance basics, and social play for toddlers.',
  'cat-gym-preschool':
    'Gymnastics vocabulary, agility, multi-sport sampling, and story-led movement for ages 3–5.',
  'cat-gym-kids':
    'Technique, discipline, teamwork, and confidence — gymnastics, ninja, sports skills, and interactive fitness.',
  'cat-gym-teens':
    'Athletic performance, stress relief, and functional strength — tumbling, ninja, and varsity prep.',
  'cat-gym-adults':
    'Cardiovascular health, mobility, and strength classes often scheduled alongside kid programmes.',
  'cat-gym-seniors':
    'Low-impact strength, cardio, and mobility programs for ages 65+.',
  'cat-gym-family':
    'Concurrent programming for parents and children training together.',
  'cat-gym-prenatal': 'Prenatal-safe and postnatal recovery focused classes.',
  'cat-gym-special-needs':
    'Inclusive, adaptive fitness sessions for every learner.',
  'cat-gym-parents':
    'Morning fitness and strength sessions designed for parents.',
  'cat-gym-after-school':
    'Structured after-school gym blocks by age wave, Mon–Thu afternoons.',
}

export const GYM_CATEGORY_CARD_META: Record<
  string,
  { readonly description: string; readonly imageSrc: string; readonly accent: HomeExploreCardAccent }
> = {
  'cat-open-play': {
    description: GYM_CATEGORY_DESCRIPTIONS['cat-open-play'],
    imageSrc: '/play.png',
    accent: 'accent',
  },
  'cat-gym-babies': {
    description: GYM_CATEGORY_DESCRIPTIONS['cat-gym-babies'],
    imageSrc:
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=900&q=80',
    accent: 'primary',
  },
  'cat-gym-toddlers': {
    description: GYM_CATEGORY_DESCRIPTIONS['cat-gym-toddlers'],
    imageSrc:
      'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=900&q=80',
    accent: 'chart-4',
  },
  'cat-gym-preschool': {
    description: GYM_CATEGORY_DESCRIPTIONS['cat-gym-preschool'],
    imageSrc:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
    accent: 'chart-5',
  },
  'cat-gym-kids': {
    description: GYM_CATEGORY_DESCRIPTIONS['cat-gym-kids'],
    imageSrc:
      'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=900&q=80',
    accent: 'accent',
  },
  'cat-gym-teens': {
    description: GYM_CATEGORY_DESCRIPTIONS['cat-gym-teens'],
    imageSrc:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=80',
    accent: 'primary',
  },
  'cat-gym-adults': {
    description: GYM_CATEGORY_DESCRIPTIONS['cat-gym-adults'],
    imageSrc:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=80',
    accent: 'chart-4',
  },
  'cat-gym-seniors': {
    description: GYM_CATEGORY_DESCRIPTIONS['cat-gym-seniors'],
    imageSrc:
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=900&q=80',
    accent: 'chart-5',
  },
  'cat-gym-family': {
    description: GYM_CATEGORY_DESCRIPTIONS['cat-gym-family'],
    imageSrc:
      'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=900&q=80',
    accent: 'accent',
  },
  'cat-gym-prenatal': {
    description: GYM_CATEGORY_DESCRIPTIONS['cat-gym-prenatal'],
    imageSrc: '/categories/gym-prenatal.jpg',
    accent: 'primary',
  },
  'cat-gym-special-needs': {
    description: GYM_CATEGORY_DESCRIPTIONS['cat-gym-special-needs'],
    imageSrc:
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&q=80',
    accent: 'chart-4',
  },
  'cat-gym-parents': {
    description: GYM_CATEGORY_DESCRIPTIONS['cat-gym-parents'],
    imageSrc:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=80',
    accent: 'chart-5',
  },
  'cat-gym-after-school': {
    description: GYM_CATEGORY_DESCRIPTIONS['cat-gym-after-school'],
    imageSrc:
      'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=900&q=80',
    accent: 'accent',
  },
}

export function resolveGymCategoryCardMeta(
  category: SchedulingCategoryCardFields,
  index: number,
): GymCategoryCardMeta {
  const known = GYM_CATEGORY_CARD_META[category.id]
  return {
    description: resolveSchedulingCategoryDescription(
      category,
      known?.description ?? GYM_CATEGORY_DESCRIPTIONS[category.id],
    ),
    imageSrc: resolveSchedulingCategoryImageSrc(category, known?.imageSrc),
    accent: known?.accent ?? SCHEDULING_CATEGORY_ACCENT_CYCLE[index % SCHEDULING_CATEGORY_ACCENT_CYCLE.length],
  }
}
