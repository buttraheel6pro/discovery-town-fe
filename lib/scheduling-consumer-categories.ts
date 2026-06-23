/** Gym / Play / Event grouping for consumer-aligned scheduling category ids. */

import {
  getCustomerSchedulingMenuSlug,
  type SchedulingCategoryPlacementFields,
} from '@/lib/catalog-placement'
import {
  catalogSlugToProductType,
  isProductCatalogSlug,
  normalizeCatalogSlug,
  type SchedulingCatalogSlug,
} from '@/lib/catalog-slugs'
import {
  CUSTOMER_NAV_LABEL_ROUTES,
  DEFAULT_CUSTOMER_NAV_LABELS,
  productTypeToNavLabelKey,
  type CustomerNavLabelKey,
} from '@/lib/customer-nav-labels'
import { getEventsCategoryHref } from '@/lib/events-category-routes'
import { getGymCategoryHref } from '@/lib/gym-category-routes'
import { getLearnCategoryHref } from '@/lib/learn-category-routes'
import { getPlayCategoryHref } from '@/lib/play-category-routes'

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
  'cat-camps-play',
  'cat-parents-night',
  'cat-field-trips',
  'cat-we-bring-play',
])

/** Scheduling categories listed under Events (not `cat-event-*` party rows). */
export const EVENTS_MENU_CATEGORY_IDS = new Set<string>([
  'cat-summer-camp-play',
  'cat-special-play-events',
])

/** Pre–consumer-catalog ids — admin/seed only, not customer menus. */
export const LEGACY_SCHEDULING_CATEGORY_IDS = new Set<string>([
  'cat-1',
  'cat-2',
  'cat-3',
  'cat-4',
  
  'cat-5',
  'cat-6',
  'cat-preschool',
])

export function isLegacySchedulingCategoryId(categoryId: string): boolean {
  return LEGACY_SCHEDULING_CATEGORY_IDS.has(categoryId)
}

export const CONSUMER_ALIGNED_CATEGORY_IDS = new Set<string>([
  'cat-open-play',
  'cat-private-play',
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
  'cat-special-play-events',
  'cat-summer-camp-play',
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
  if (
    EVENTS_MENU_CATEGORY_IDS.has(categoryId) ||
    categoryId.startsWith('cat-event-')
  ) {
    return 'EVENT'
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
      return { href: getPlayCategoryHref(categoryId), label: 'Back to Play' }
    case 'gym':
      return { href: getGymCategoryHref(categoryId), label: 'Back to Gym' }
    case 'events':
      return { href: getEventsCategoryHref(categoryId), label: 'Back to Events' }
    case 'learn':
    default:
      return { href: getLearnCategoryHref(categoryId), label: 'Back to Learn' }
  }
}

const SCHEDULING_MENU_NAV_KEYS: Record<SchedulingCatalogSlug, CustomerNavLabelKey> = {
  play: 'play',
  gym: 'gym',
  events: 'events',
  learn: 'learn',
}

function consumerMenuLandingBackLink(navKey: CustomerNavLabelKey): SchedulingConsumerBackLink {
  return {
    href: CUSTOMER_NAV_LABEL_ROUTES[navKey],
    label: `Back to ${DEFAULT_CUSTOMER_NAV_LABELS[navKey]}`,
  }
}

function consumerProductMenuBackLink(productType: string): SchedulingConsumerBackLink | null {
  const navKey = productTypeToNavLabelKey(productType)
  if (!navKey) {
    return null
  }
  return consumerMenuLandingBackLink(navKey)
}

/** Category detail hero — back to the menu landing where the category is listed. */
export function getSchedulingCategoryMenuBackLink(
  categoryId: string,
  category?: SchedulingCategoryPlacementFields | null,
): SchedulingConsumerBackLink {
  const productPlacement = normalizeCatalogSlug(category?.placementCatalogSlug ?? null)
  if (productPlacement && isProductCatalogSlug(productPlacement)) {
    const productBack = consumerProductMenuBackLink(
      catalogSlugToProductType(productPlacement),
    )
    if (productBack) {
      return productBack
    }
  }

  const schedulingMenu = category ? getCustomerSchedulingMenuSlug(category) : null
  if (schedulingMenu) {
    return consumerMenuLandingBackLink(SCHEDULING_MENU_NAV_KEYS[schedulingMenu])
  }

  const topLevel = getSchedulingTopLevelId(categoryId)
  switch (topLevel) {
    case 'PLAY':
      return consumerMenuLandingBackLink('play')
    case 'GYM':
      return consumerMenuLandingBackLink('gym')
    case 'LEARN':
      return consumerMenuLandingBackLink('learn')
    case 'EVENT':
    default:
      return consumerMenuLandingBackLink('events')
  }
}

/** Consumer detail hero — return link using placement when available. */
export function getSchedulingConsumerBackLink(
  categoryId: string,
  category?: SchedulingCategoryPlacementFields | null,
): SchedulingConsumerBackLink {
  const schedulingMenu = category ? getCustomerSchedulingMenuSlug(category) : null
  if (schedulingMenu) {
    return consumerBackLinkForMenuSlug(schedulingMenu, categoryId)
  }

  const topLevel = getSchedulingTopLevelId(categoryId)
  switch (topLevel) {
    case 'PLAY':
      return { href: getPlayCategoryHref(categoryId), label: 'Back to Play' }
    case 'GYM':
      return { href: getGymCategoryHref(categoryId), label: 'Back to Gym' }
    case 'LEARN':
      return { href: getLearnCategoryHref(categoryId), label: 'Back to Learn' }
    case 'EVENT':
    default:
      return {
        href: getEventsCategoryHref(categoryId),
        label: 'Back to Events',
      }
  }
}
