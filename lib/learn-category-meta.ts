/** Learn sub-category card metadata — images, accents, and copy for the Learn menu grid. */
import type { HomeExploreCardAccent } from '@/components/customer/home-explore-card'
import {
  resolveSchedulingCategoryDescription,
  resolveSchedulingCategoryImageSrc,
  SCHEDULING_CATEGORY_ACCENT_CYCLE,
  type SchedulingCategoryCardFields,
  type SchedulingCategoryCardMeta,
} from '@/lib/scheduling-category-card-meta'

export type LearnCategoryCardMeta = SchedulingCategoryCardMeta

export const LEARN_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'cat-learn-elementary':
    'Phonics, math foundations, handwriting, and supervised homework support.',
  'cat-learn-middle':
    'Pre-algebra, essay writing, science, and executive functioning skills.',
  'cat-learn-high-school':
    'STEM, humanities, and foreign language tracks for grades 9–12.',
  'cat-learn-test-prep-college':
    'SAT/ACT bootcamps and college essay writing intensives.',
  'cat-learn-test-prep-private-school':
    'ISEE, SSAT, HSPT, and COOP private school entrance prep.',
  'cat-learn-test-prep-adult':
    'GRE, GMAT, GED, HiSET, and ASVAB preparation for adults.',
  'cat-learn-enrichment-technology':
    'Coding for Kids, robotics clubs, and chess — logic and problem-solving beyond the classroom.',
  'cat-learn-enrichment-life-skills':
    'Financial literacy, public speaking, and debate for real-world confidence.',
  'cat-learn-enrichment-arts':
    'Creative writing and digital art workshops for young storytellers and designers.',
}

export const LEARN_CATEGORY_CARD_META: Record<
  string,
  { readonly description: string; readonly imageSrc: string; readonly accent: HomeExploreCardAccent }
> = {
  'cat-learn-elementary': {
    description: LEARN_CATEGORY_DESCRIPTIONS['cat-learn-elementary'],
    imageSrc:
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&q=80',
    accent: 'accent',
  },
  'cat-learn-middle': {
    description: LEARN_CATEGORY_DESCRIPTIONS['cat-learn-middle'],
    imageSrc: '/categories/learn-middle-school.jpg',
    accent: 'primary',
  },
  'cat-learn-high-school': {
    description: LEARN_CATEGORY_DESCRIPTIONS['cat-learn-high-school'],
    imageSrc:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900&q=80',
    accent: 'chart-4',
  },
  'cat-learn-test-prep-college': {
    description: LEARN_CATEGORY_DESCRIPTIONS['cat-learn-test-prep-college'],
    imageSrc: '/categories/learn-college-test-prep.jpg',
    accent: 'chart-5',
  },
  'cat-learn-test-prep-private-school': {
    description: LEARN_CATEGORY_DESCRIPTIONS['cat-learn-test-prep-private-school'],
    imageSrc: '/categories/learn-private-school.jpg',
    accent: 'accent',
  },
  'cat-learn-test-prep-adult': {
    description: LEARN_CATEGORY_DESCRIPTIONS['cat-learn-test-prep-adult'],
    imageSrc:
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=900&q=80',
    accent: 'primary',
  },
  'cat-learn-enrichment-technology': {
    description: LEARN_CATEGORY_DESCRIPTIONS['cat-learn-enrichment-technology'],
    imageSrc:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&q=80',
    accent: 'chart-4',
  },
  'cat-learn-enrichment-life-skills': {
    description: LEARN_CATEGORY_DESCRIPTIONS['cat-learn-enrichment-life-skills'],
    imageSrc:
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=900&q=80',
    accent: 'chart-5',
  },
  'cat-learn-enrichment-arts': {
    description: LEARN_CATEGORY_DESCRIPTIONS['cat-learn-enrichment-arts'],
    imageSrc: '/categories/learn-arts-creative.jpg',
    accent: 'accent',
  },
}

export function resolveLearnCategoryCardMeta(
  category: SchedulingCategoryCardFields,
  index: number,
): LearnCategoryCardMeta {
  const known = LEARN_CATEGORY_CARD_META[category.id]
  return {
    description: resolveSchedulingCategoryDescription(
      category,
      known?.description ?? LEARN_CATEGORY_DESCRIPTIONS[category.id],
    ),
    imageSrc: resolveSchedulingCategoryImageSrc(category, known?.imageSrc),
    accent: known?.accent ?? SCHEDULING_CATEGORY_ACCENT_CYCLE[index % SCHEDULING_CATEGORY_ACCENT_CYCLE.length],
  }
}
