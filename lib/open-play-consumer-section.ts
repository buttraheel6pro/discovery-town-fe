/** Open Play customer section — session passes + membership/seasonal offers move together. */

import { isOpenPlayPassCatalogService } from '@/lib/open-play-pass-catalog'
import { visibleOpenPlayMembershipOffers } from '@/lib/open-play-membership-offers'
import {
  getCustomerProductMenuSlug,
  getCustomerSchedulingMenuSlug,
  schedulingCategoryAppearsOnCustomerProductMenu,
} from '@/lib/catalog-placement'
import {
  catalogSlugToProductType,
  isProductCatalogSlug,
  isSchedulingCatalogSlug,
  type CatalogSlug,
} from '@/lib/catalog-slugs'
import { isConsumerListedSchedulingService } from '@/lib/scheduling-visibility'
import type { OpenPlayMembershipOffer } from '@/lib/open-play-membership-offers'
import type { MembershipDisplayPage } from '@/lib/membership-placement'
import type {
  MembershipPlan,
  ProductCategory,
  SchedulingCategory,
  SchedulingService,
  SchedulingSlot,
} from '@/lib/types'

export const OPEN_PLAY_CATEGORY_ID = 'cat-open-play' as const

const OPEN_PLAY_ALIAS_IDS = new Set<string>([
  OPEN_PLAY_CATEGORY_ID,
  'cat-play-open-play',
  'cat-event-open-play',
  'cat-gym-open-play',
])

export function resolveOpenPlayCustomerMenuSlug(
  category: SchedulingCategory,
  productRootIdsBySlug: Readonly<Record<string, string | undefined>> = {},
): CatalogSlug | null {
  const schedulingMenu = getCustomerSchedulingMenuSlug(category)
  if (schedulingMenu) {
    return schedulingMenu
  }
  return getCustomerProductMenuSlug(category, productRootIdsBySlug)
}

export function openPlayAppearsOnCustomerMenu(
  category: SchedulingCategory,
  menuSlug: CatalogSlug,
  productRootIdsBySlug: Readonly<Record<string, string | undefined>> = {},
  productCategories: readonly Pick<ProductCategory, 'id' | 'parentId' | 'productType'>[] = [],
): boolean {
  if (!isOpenPlaySchedulingCategory(category)) {
    return false
  }
  if (isSchedulingCatalogSlug(menuSlug)) {
    return getCustomerSchedulingMenuSlug(category) === menuSlug
  }
  if (isProductCatalogSlug(menuSlug)) {
    const productType = catalogSlugToProductType(menuSlug)
    return schedulingCategoryAppearsOnCustomerProductMenu(
      category,
      productType,
      productRootIdsBySlug,
      productCategories,
    )
  }
  return false
}

/** Open Play is native to Play; membership/seasonal follow placement on other menus. */
function openPlayPlacedAwayFromNativePlay(
  menuSlug: CatalogSlug,
  sectionCategory: SchedulingCategory,
  productRootIdsBySlug: Readonly<Record<string, string | undefined>>,
  productCategories: readonly Pick<ProductCategory, 'id' | 'parentId' | 'productType'>[] = [],
): boolean {
  return (
    menuSlug !== 'play' &&
    openPlayAppearsOnCustomerMenu(
      sectionCategory,
      menuSlug,
      productRootIdsBySlug,
      productCategories,
    )
  )
}

export function isOpenPlaySchedulingCategory(
  category: Pick<SchedulingCategory, 'id' | 'name'>,
): boolean {
  if (OPEN_PLAY_ALIAS_IDS.has(category.id)) {
    return true
  }
  return category.name.trim().toLowerCase() === 'open play'
}

export function isOpenPlaySchedulingSectionId(sectionId: string): boolean {
  return OPEN_PLAY_ALIAS_IDS.has(sectionId)
}

export function openPlayCategoryIds(
  categories: readonly Pick<SchedulingCategory, 'id' | 'name'>[],
): string[] {
  return categories.filter(isOpenPlaySchedulingCategory).map((row) => row.id)
}

export function primaryOpenPlayCategory(
  categories: readonly SchedulingCategory[],
): SchedulingCategory | null {
  const matches = categories.filter(isOpenPlaySchedulingCategory)
  if (matches.length === 0) {
    return null
  }
  return (
    matches.find((row) => row.id === OPEN_PLAY_CATEGORY_ID) ??
    matches.slice().sort((a, b) => a.displayOrder - b.displayOrder)[0] ??
    null
  )
}

/** Drop duplicate Open Play rows created by legacy id-rewrite moves. */
export function dedupeOpenPlayMenuCategories(
  categories: readonly SchedulingCategory[],
): SchedulingCategory[] {
  const openPlay = categories.filter(isOpenPlaySchedulingCategory)
  if (openPlay.length <= 1) {
    return categories.slice()
  }
  const primary = primaryOpenPlayCategory(categories)
  if (!primary) {
    return categories.slice()
  }
  return [
    ...categories.filter((row) => !isOpenPlaySchedulingCategory(row)),
    primary,
  ]
}

export function membershipCategoryMatchesOpenPlaySection(
  planCategoryId: string,
  sectionCategory: Pick<SchedulingCategory, 'id' | 'name'>,
  categories: readonly SchedulingCategory[],
): boolean {
  if (planCategoryId === sectionCategory.id) {
    return true
  }
  if (!isOpenPlaySchedulingCategory(sectionCategory)) {
    return false
  }
  if (planCategoryId === OPEN_PLAY_CATEGORY_ID) {
    return true
  }
  const planned = categories.find((row) => row.id === planCategoryId)
  return planned != null && isOpenPlaySchedulingCategory(planned)
}

export function filterPlansForOpenPlaySection(
  plans: readonly MembershipPlan[],
  menuSlug: CatalogSlug,
  sectionCategory: SchedulingCategory,
  categories: readonly SchedulingCategory[],
  productRootIdsBySlug: Readonly<Record<string, string | undefined>> = {},
  productCategories: readonly Pick<ProductCategory, 'id' | 'parentId' | 'productType'>[] = [],
): MembershipPlan[] {
  const onThisMenu = openPlayAppearsOnCustomerMenu(
    sectionCategory,
    menuSlug,
    productRootIdsBySlug,
    productCategories,
  )

  return plans.filter((plan) => {
    if (!plan.isActive) {
      return false
    }

    const pages = plan.displayPages
    const categoryIds = plan.schedulingCategoryIds ?? []

    const categoryMatch =
      categoryIds.length === 0 ||
      categoryIds.some((id) =>
        membershipCategoryMatchesOpenPlaySection(id, sectionCategory, categories),
      )

    if (
      openPlayPlacedAwayFromNativePlay(
        menuSlug,
        sectionCategory,
        productRootIdsBySlug,
        productCategories,
      )
    ) {
      return categoryMatch
    }

    if (!pages?.length) {
      if (!onThisMenu || menuSlug !== 'play') {
        return false
      }
      return categoryMatch
    }

    if (!isSchedulingCatalogSlug(menuSlug)) {
      return false
    }
    const page: MembershipDisplayPage = menuSlug
    if (!pages.includes(page)) {
      return false
    }

    if (categoryIds.length === 0) {
      return true
    }

    return categoryMatch
  })
}

export function visibleOpenPlayOffersForMenu(
  plans: readonly MembershipPlan[],
  menuSlug: CatalogSlug,
  sectionCategory: Pick<SchedulingCategory, 'id' | 'name'>,
  categories: readonly SchedulingCategory[],
  productRootIdsBySlug: Readonly<Record<string, string | undefined>> = {},
  productCategories: readonly Pick<ProductCategory, 'id' | 'parentId' | 'productType'>[] = [],
): OpenPlayMembershipOffer[] {
  const placed = filterPlansForOpenPlaySection(
    plans,
    menuSlug,
    sectionCategory as SchedulingCategory,
    categories,
    productRootIdsBySlug,
    productCategories,
  )

  return visibleOpenPlayMembershipOffers(plans).filter((offer) => {
    if (offer.kind === 'seasonal') {
      return placed.some((plan) => plan.billingCycle === 'QUARTERLY')
    }
    return placed.some(
      (plan) => plan.billingCycle === 'MONTHLY' || plan.billingCycle === 'ANNUAL',
    )
  })
}

export function collectOpenPlaySessionServices(
  categories: readonly SchedulingCategory[],
  services: readonly SchedulingService[],
  slots: readonly SchedulingSlot[],
  categoryById: ReadonlyMap<string, { readonly isActive: boolean }>,
): SchedulingService[] {
  const aliasIds = new Set(openPlayCategoryIds(categories))
  return services
    .filter(
      (service) =>
        aliasIds.has(service.categoryId) &&
        !isOpenPlayPassCatalogService(service) &&
        isConsumerListedSchedulingService(service, categoryById, slots),
    )
    .slice()
}

export interface OpenPlayConsumerSection {
  readonly category: SchedulingCategory
  readonly description: string
  readonly services: SchedulingService[]
  readonly membershipOffers: OpenPlayMembershipOffer[]
}

export function buildOpenPlayConsumerSection(params: {
  readonly menuSlug: CatalogSlug
  readonly categories: readonly SchedulingCategory[]
  readonly services: readonly SchedulingService[]
  readonly slots: readonly SchedulingSlot[]
  readonly plans: readonly MembershipPlan[]
  readonly categoryById: ReadonlyMap<string, { readonly isActive: boolean }>
  readonly description: string
  readonly productRootIdsBySlug?: Readonly<Record<string, string | undefined>>
  readonly productCategories?: readonly Pick<
    ProductCategory,
    'id' | 'parentId' | 'productType'
  >[]
}): OpenPlayConsumerSection | null {
  const productRootIdsBySlug = params.productRootIdsBySlug ?? {}
  const productCategories = params.productCategories ?? []
  const category = primaryOpenPlayCategory(params.categories)
  if (!category) {
    return null
  }
  if (
    !openPlayAppearsOnCustomerMenu(
      category,
      params.menuSlug,
      productRootIdsBySlug,
      productCategories,
    )
  ) {
    return null
  }

  return {
    category,
    description: params.description,
    services: collectOpenPlaySessionServices(
      params.categories,
      params.services,
      params.slots,
      params.categoryById,
    ),
    membershipOffers: visibleOpenPlayOffersForMenu(
      params.plans,
      params.menuSlug,
      category,
      params.categories,
      productRootIdsBySlug,
      productCategories,
    ),
  }
}

export function normalizeOpenPlaySchedulingCatalog<
  TService extends Pick<SchedulingService, 'categoryId'>,
>(params: {
  readonly categories: readonly SchedulingCategory[]
  readonly services: readonly TService[]
}): {
  readonly categories: SchedulingCategory[]
  readonly services: TService[]
} {
  const openPlay = params.categories.filter(isOpenPlaySchedulingCategory)
  if (openPlay.length <= 1) {
    return {
      categories: params.categories.map((row) => ({ ...row })),
      services: params.services.map((row) => ({ ...row })),
    }
  }

  const keeper =
    openPlay.find((row) => row.id === OPEN_PLAY_CATEGORY_ID) ??
    openPlay.slice().sort((a, b) => a.displayOrder - b.displayOrder)[0]
  if (!keeper) {
    return {
      categories: params.categories.map((row) => ({ ...row })),
      services: params.services.map((row) => ({ ...row })),
    }
  }

  const remap = new Map<string, string>()
  for (const row of openPlay) {
    if (row.id !== keeper.id) {
      remap.set(row.id, keeper.id)
    }
  }

  const mergedPlacement = openPlay.find(
    (row) => row.placementCatalogSlug != null,
  )?.placementCatalogSlug

  const mergedCategory: SchedulingCategory = {
    ...keeper,
    catalogSlug: keeper.catalogSlug ?? 'play',
    placementCatalogSlug: mergedPlacement ?? keeper.placementCatalogSlug,
    placementParentId: keeper.placementParentId ?? null,
  }

  const categories = [
    ...params.categories
      .filter((row) => !remap.has(row.id))
      .map((row) => ({ ...row })),
  ]
  const keeperIndex = categories.findIndex((row) => row.id === keeper.id)
  if (keeperIndex >= 0) {
    categories[keeperIndex] = mergedCategory
  } else {
    categories.push(mergedCategory)
  }

  const services = params.services.map((service) => {
    const nextCategoryId = remap.get(service.categoryId)
    if (!nextCategoryId) {
      return { ...service }
    }
    return { ...service, categoryId: nextCategoryId }
  })

  return { categories, services }
}
