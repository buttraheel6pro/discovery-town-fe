/** Where membership plans appear — gym / play / events pages and scheduling sub-categories. */
import { getCustomerSchedulingMenuSlug } from '@/lib/catalog-placement'
import type { SchedulingCatalogSlug } from '@/lib/catalog-slugs'
import {
  getSchedulingTopLevelLabel,
  type SchedulingTopLevelId,
} from '@/lib/scheduling-consumer-categories'
import { filterConsumerSchedulingCategoriesForMenu } from '@/lib/scheduling-visibility'
import type { MembershipPlan, SchedulingCategory } from '@/lib/types'

export type MembershipDisplayPage = 'gym' | 'play' | 'events' | 'membership'

export const MEMBERSHIP_DISPLAY_PAGE_OPTIONS: readonly {
  readonly value: MembershipDisplayPage
  readonly label: string
}[] = [
  { value: 'membership', label: 'Membership page (/membership)' },
  { value: 'gym', label: 'Gym (/gym)' },
  { value: 'play', label: 'Play (/play)' },
  { value: 'events', label: 'Events (/events)' },
] as const

function membershipPageFromMenuSlug(
  menuSlug: SchedulingCatalogSlug,
): MembershipDisplayPage {
  return menuSlug
}

export function resolveSchedulingCategoryPage(
  categoryId: string,
  category?: Pick<
    SchedulingCategory,
    'id' | 'catalogSlug' | 'placementCatalogSlug' | 'placementParentId'
  > | null,
): MembershipDisplayPage | null {
  const menuSlug = category
    ? getCustomerSchedulingMenuSlug(category)
    : null
  if (menuSlug) {
    return membershipPageFromMenuSlug(menuSlug)
  }
  if (categoryId.startsWith('cat-gym-')) {
    return 'gym'
  }
  if (categoryId.startsWith('cat-play') || categoryId === 'cat-open-play') {
    return 'play'
  }
  return 'events'
}

export interface MembershipPlacementDraft {
  readonly displayPages: MembershipDisplayPage[]
  readonly schedulingCategoryIds: string[]
}

export const EMPTY_MEMBERSHIP_PLACEMENT: MembershipPlacementDraft = {
  displayPages: [],
  schedulingCategoryIds: [],
}

export const DEFAULT_PLAY_OPEN_MEMBERSHIP_PLACEMENT: MembershipPlacementDraft = {
  displayPages: ['play'],
  schedulingCategoryIds: ['cat-open-play'],
}

/** Sentinel for sub-category select — plan appears on all sections of the page. */
export const MEMBERSHIP_PLACEMENT_ALL_SUBCATEGORIES = '__all__' as const

export function displayPageToTopLevel(
  page: MembershipDisplayPage,
): SchedulingTopLevelId | null {
  switch (page) {
    case 'gym':
      return 'GYM'
    case 'play':
      return 'PLAY'
    case 'events':
      return 'EVENT'
    default:
      return null
  }
}

export function getMembershipDisplayPageLabel(page: MembershipDisplayPage): string {
  const topLevel = displayPageToTopLevel(page)
  if (topLevel) {
    return getSchedulingTopLevelLabel(topLevel)
  }
  return 'Membership'
}

export function schedulingCategoriesForDisplayPage(
  categories: readonly SchedulingCategory[],
  page: MembershipDisplayPage,
): SchedulingCategory[] {
  if (page === 'membership') {
    return []
  }
  const menuSlug: SchedulingCatalogSlug | null =
    page === 'gym' ? 'gym' : page === 'play' ? 'play' : page === 'events' ? 'events' : null
  if (!menuSlug) {
    return []
  }
  return filterConsumerSchedulingCategoriesForMenu(menuSlug, categories)
}

export function primaryDisplayPageFromDraft(
  draft: MembershipPlacementDraft,
): MembershipDisplayPage | '' {
  const pages = draft.displayPages
  if (pages.length === 0) {
    return ''
  }
  const withSubCategory = pages.find((page) => page !== 'membership')
  return withSubCategory ?? pages[0]
}

export function primarySchedulingCategoryIdFromDraft(
  draft: MembershipPlacementDraft,
): string {
  return draft.schedulingCategoryIds[0] ?? ''
}

export function placementDraftFromPlan(plan: MembershipPlan): MembershipPlacementDraft {
  return {
    displayPages: [...(plan.displayPages ?? [])],
    schedulingCategoryIds: [...(plan.schedulingCategoryIds ?? [])],
  }
}

export function buildPlacementPatch(
  draft: MembershipPlacementDraft,
): Pick<MembershipPlan, 'displayPages' | 'schedulingCategoryIds'> {
  return {
    displayPages: draft.displayPages.length > 0 ? [...draft.displayPages] : undefined,
    schedulingCategoryIds:
      draft.schedulingCategoryIds.length > 0
        ? [...draft.schedulingCategoryIds]
        : undefined,
  }
}

export function groupSchedulingCategoriesByPage(
  categories: readonly SchedulingCategory[],
): Record<MembershipDisplayPage, SchedulingCategory[]> {
  const grouped: Record<MembershipDisplayPage, SchedulingCategory[]> = {
    gym: [],
    play: [],
    events: [],
    membership: [],
  }

  for (const category of categories) {
    if (!category.isActive) {
      continue
    }
    const page = resolveSchedulingCategoryPage(category.id)
    if (page) {
      grouped[page].push(category)
    }
  }

  for (const page of Object.keys(grouped) as MembershipDisplayPage[]) {
    grouped[page].sort((a, b) => a.displayOrder - b.displayOrder)
  }

  return grouped
}

/** Whether a plan should surface on a page (and optional sub-category section). */
export function planMatchesPlacement(
  plan: MembershipPlan,
  page: MembershipDisplayPage,
  categoryId?: string,
): boolean {
  if (!plan.isActive) {
    return false
  }

  const pages = plan.displayPages
  const categoryIds = plan.schedulingCategoryIds ?? []

  if (!pages?.length) {
    if (page === 'membership') {
      return true
    }
    if (page === 'play' && categoryId === 'cat-open-play') {
      return true
    }
    return false
  }

  if (!pages.includes(page)) {
    return false
  }

  if (!categoryId) {
    return true
  }

  if (categoryIds.length === 0) {
    return true
  }

  return categoryIds.includes(categoryId)
}

export function filterPlansForPlacement(
  plans: readonly MembershipPlan[],
  page: MembershipDisplayPage,
  categoryId?: string,
): MembershipPlan[] {
  return plans.filter((plan) => planMatchesPlacement(plan, page, categoryId))
}

export function formatPlacementSummary(
  plan: MembershipPlan,
  categories?: readonly SchedulingCategory[],
): string {
  const pages = plan.displayPages ?? []
  const cats = plan.schedulingCategoryIds ?? []
  if (pages.length === 0 && cats.length === 0) {
    return 'Membership + Open Play (legacy)'
  }
  const page = primaryDisplayPageFromDraft({
    displayPages: pages,
    schedulingCategoryIds: cats,
  })
  const pageLabel = page ? getMembershipDisplayPageLabel(page) : ''
  const catId = cats[0]
  const catName =
    catId && categories
      ? (categories.find((c) => c.id === catId)?.name ?? catId)
      : catId
  if (catName) {
    return `${pageLabel} · ${catName}`
  }
  if (pageLabel) {
    return `${pageLabel} · all sub-categories`
  }
  return 'Not configured'
}
