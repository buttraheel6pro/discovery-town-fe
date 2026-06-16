/** Where event packages appear — gym / play / events pages and scheduling sub-categories. */
import {
  EVENT_PARTY_BOOKING_SERVICE_ID,
  EVENT_PRIVATE_PARTY_ROOM_SUBCATEGORY_ID,
  EVENT_WHOLE_PLACE_SUBCATEGORY_ID,
  isEventCatalogPackage,
} from '@/lib/event-package-catalog'

export {
  EVENT_PRIVATE_PARTY_ROOM_SUBCATEGORY_ID,
  EVENT_WHOLE_PLACE_SUBCATEGORY_ID,
} from '@/lib/event-package-catalog'
import {
  getSchedulingTopLevelId,
  getSchedulingTopLevelLabel,
  isConsumerAlignedCategoryId,
  type SchedulingTopLevelId,
} from '@/lib/scheduling-consumer-categories'
import {
  groupSchedulingCategoriesByPage,
  primaryDisplayPageFromDraft,
  primarySchedulingCategoryIdFromDraft,
  resolveSchedulingCategoryPage,
  type MembershipDisplayPage,
} from '@/lib/membership-placement'
import type { EventPackage, SchedulingCategory } from '@/lib/types'

export type PackageDisplayPage = 'gym' | 'play' | 'events' | 'learn'

export const PACKAGE_DISPLAY_PAGE_OPTIONS: readonly {
  readonly value: PackageDisplayPage
  readonly label: string
}[] = [
  { value: 'gym', label: 'Gym (/gym)' },
  { value: 'play', label: 'Play (/play)' },
  { value: 'events', label: 'Events (/events)' },
] as const

export interface PackagePlacementDraft {
  readonly displayPages: PackageDisplayPage[]
  readonly schedulingCategoryIds: string[]
}

export const EMPTY_PACKAGE_PLACEMENT: PackagePlacementDraft = {
  displayPages: [],
  schedulingCategoryIds: [],
}

export const DEFAULT_PRIVATE_PLAY_PACKAGE_PLACEMENT: PackagePlacementDraft = {
  displayPages: ['play'],
  schedulingCategoryIds: ['cat-private-play'],
}

export const DEFAULT_EVENT_PRIVATE_PARTY_PACKAGE_PLACEMENT: PackagePlacementDraft = {
  displayPages: ['events'],
  schedulingCategoryIds: [EVENT_PRIVATE_PARTY_ROOM_SUBCATEGORY_ID],
}

export const DEFAULT_EVENT_WHOLE_PLACE_PACKAGE_PLACEMENT: PackagePlacementDraft = {
  displayPages: ['events'],
  schedulingCategoryIds: [EVENT_WHOLE_PLACE_SUBCATEGORY_ID],
}

export const PACKAGE_PLACEMENT_ALL_SUBCATEGORIES = '__all__' as const

/**
 * Admin services catalog — sub-categories that show the placed-packages panel.
 * Events sub-categories are excluded; tier packages are managed per service (Link package).
 */
export function resolveAdminCategoryPlacedPackages(
  _categoryId: string,
): { page: PackageDisplayPage; categoryId: string } | null {
  return null
}

const PRIVATE_PLAY_SERVICE_IDS = new Set<string>([
  'svc-private-play-room-open-play',
  'svc-private-play-full-venue',
  'svc-private-play-meeting-rooms',
  'svc-event-party-room-packages',
  'svc-event-whole-venue-packages',
])

export function displayPageFromTopLevel(topLevel: SchedulingTopLevelId): PackageDisplayPage {
  switch (topLevel) {
    case 'GYM':
      return 'gym'
    case 'PLAY':
      return 'play'
    case 'EVENT':
      return 'events'
    case 'LEARN':
      return 'learn'
    default:
      return 'play'
  }
}

export function displayPageToTopLevel(
  page: PackageDisplayPage,
): SchedulingTopLevelId | null {
  switch (page) {
    case 'gym':
      return 'GYM'
    case 'play':
      return 'PLAY'
    case 'events':
      return 'EVENT'
    case 'learn':
      return 'LEARN'
    default:
      return null
  }
}

export function getPackageDisplayPageLabel(page: PackageDisplayPage): string {
  const topLevel = displayPageToTopLevel(page)
  if (topLevel) {
    return getSchedulingTopLevelLabel(topLevel)
  }
  return page
}

export function placementDraftFromPackage(pkg: EventPackage): PackagePlacementDraft {
  return {
    displayPages: [...(pkg.displayPages ?? [])],
    schedulingCategoryIds: [...(pkg.schedulingCategoryIds ?? [])],
  }
}

export function buildPackagePlacementPatch(
  draft: PackagePlacementDraft,
): Pick<EventPackage, 'displayPages' | 'schedulingCategoryIds'> {
  return {
    displayPages: draft.displayPages.length > 0 ? [...draft.displayPages] : undefined,
    schedulingCategoryIds:
      draft.schedulingCategoryIds.length > 0
        ? [...draft.schedulingCategoryIds]
        : undefined,
  }
}

export function placementDraftFromSubCategory(
  subCategoryId: string,
): PackagePlacementDraft {
  const page = resolveSchedulingCategoryPage(subCategoryId)
  if (!page || page === 'membership') {
    return EMPTY_PACKAGE_PLACEMENT
  }
  return {
    displayPages: [page as PackageDisplayPage],
    schedulingCategoryIds: [subCategoryId],
  }
}

export function groupPackageCategoriesByPage(
  categories: readonly SchedulingCategory[],
): Record<PackageDisplayPage, SchedulingCategory[]> {
  const grouped = groupSchedulingCategoriesByPage(categories)
  return {
    gym: grouped.gym,
    play: grouped.play,
    events: grouped.events,
    learn: grouped.learn,
  }
}

export function primaryPackageDisplayPageFromDraft(
  draft: PackagePlacementDraft,
): PackageDisplayPage | '' {
  return primaryDisplayPageFromDraft({
    displayPages: draft.displayPages as MembershipDisplayPage[],
    schedulingCategoryIds: draft.schedulingCategoryIds,
  }) as PackageDisplayPage | ''
}

export function primaryPackageSchedulingCategoryIdFromDraft(
  draft: PackagePlacementDraft,
): string {
  return primarySchedulingCategoryIdFromDraft({
    displayPages: draft.displayPages as MembershipDisplayPage[],
    schedulingCategoryIds: draft.schedulingCategoryIds,
  })
}

export function topLevelFromPlacementDraft(draft: PackagePlacementDraft): SchedulingTopLevelId {
  const page = primaryPackageDisplayPageFromDraft(draft)
  if (!page) {
    return 'PLAY'
  }
  return displayPageToTopLevel(page) ?? 'PLAY'
}

export function isLegacyPrivatePlayCatalogPackage(
  pkg: Pick<EventPackage, 'id' | 'serviceId'>,
): boolean {
  if (!isEventCatalogPackage(pkg)) {
    return false
  }
  if (PRIVATE_PLAY_SERVICE_IDS.has(pkg.serviceId)) {
    return true
  }
  return pkg.serviceId === EVENT_PARTY_BOOKING_SERVICE_ID
}

export function packageMatchesPlacement(
  pkg: EventPackage,
  page: PackageDisplayPage,
  categoryId?: string,
): boolean {
  if (!pkg.isActive) {
    return false
  }

  const pages = pkg.displayPages
  const categoryIds = pkg.schedulingCategoryIds ?? []

  if (!pages?.length) {
    if (page === 'play' && categoryId === 'cat-private-play') {
      return isLegacyPrivatePlayCatalogPackage(pkg)
    }
    if (
      page === 'events' &&
      (categoryId === EVENT_PRIVATE_PARTY_ROOM_SUBCATEGORY_ID ||
        categoryId === EVENT_WHOLE_PLACE_SUBCATEGORY_ID)
    ) {
      return isEventCatalogPackage(pkg)
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

export function filterPackagesForPlacement(
  packages: readonly EventPackage[],
  page: PackageDisplayPage,
  categoryId?: string,
): EventPackage[] {
  return packages.filter((pkg) => packageMatchesPlacement(pkg, page, categoryId))
}

export function formatPackagePlacementSummary(
  pkg: EventPackage,
  categories?: readonly SchedulingCategory[],
): string {
  const pages = pkg.displayPages ?? []
  const cats = pkg.schedulingCategoryIds ?? []
  if (pages.length === 0 && cats.length === 0) {
    if (isLegacyPrivatePlayCatalogPackage(pkg)) {
      return 'Play · Private Play (legacy catalog)'
    }
    return 'Not configured'
  }
  const page = primaryPackageDisplayPageFromDraft({
    displayPages: pages,
    schedulingCategoryIds: cats,
  })
  const pageLabel = page ? getPackageDisplayPageLabel(page) : ''
  const catId = cats[0]
  const catName =
    catId && categories
      ? (categories.find((entry) => entry.id === catId)?.name ?? catId)
      : catId
  if (catName) {
    return `${pageLabel} · ${catName}`
  }
  if (pageLabel) {
    return `${pageLabel} · all sub-categories`
  }
  return 'Not configured'
}

function sanitizeAdminReturnTo(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed.startsWith('/admin/')) {
    return fallback
  }
  return trimmed
}

export function packagesListHref(categoryId?: string | null): string {
  if (categoryId) {
    return `/admin/scheduling/packages?category=${encodeURIComponent(categoryId)}`
  }
  return '/admin/scheduling/packages'
}

export function servicesListHref(categoryId?: string | null): string {
  if (categoryId) {
    const params = new URLSearchParams({ serviceCategoryFilterId: categoryId })
    return `/admin/scheduling/services?${params.toString()}`
  }
  return '/admin/scheduling/services'
}

export interface ResolvePackageEditBackHrefInput {
  readonly returnTo: string | null
  readonly returnServiceId: string | null
  readonly category: string | null
}

export function resolvePackageEditBackHref(input: ResolvePackageEditBackHrefInput): string {
  const fallback = packagesListHref(input.category)

  if (input.returnTo) {
    return sanitizeAdminReturnTo(input.returnTo, fallback)
  }

  if (input.returnServiceId) {
    return servicesListHref(input.category)
  }

  return fallback
}

export interface BuildPackageEditHrefOptions {
  readonly returnTo?: string
  readonly category?: string
  readonly returnServiceId?: boolean
}

export function buildPackageEditHref(
  packageId: string,
  options?: BuildPackageEditHrefOptions,
): string {
  const search = new URLSearchParams()
  if (options?.returnTo) {
    search.set('returnTo', options.returnTo)
  }
  if (options?.category) {
    search.set('category', options.category)
  }
  if (options?.returnServiceId) {
    search.set('returnServiceId', '1')
  }
  const query = search.toString()
  return `/admin/scheduling/packages/${packageId}/edit${query ? `?${query}` : ''}`
}

export { isConsumerAlignedCategoryId, resolveSchedulingCategoryPage }
