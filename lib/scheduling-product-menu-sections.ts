/** Scheduling service rails on customer store menus (Gifts, Shop, Rentals, Cafe). */

import {
  buildProductRootIdsBySlug,
  repairSchedulingCategoryProductPlacement,
  usesEventStyleSchedulingListing,
} from '@/lib/catalog-placement'
import { catalogSlugFromProductType } from '@/lib/catalog-slugs'
import {
  buildEventCatalogScrollItems,
  type EventCatalogScrollItem,
} from '@/lib/event-catalog-display'
import {
  buildOpenPlayConsumerSection,
  isOpenPlaySchedulingCategory,
  type OpenPlayConsumerSection,
} from '@/lib/open-play-consumer-section'
import type { OpenPlayMembershipOffer } from '@/lib/open-play-membership-offers'
import { collectServicesForSchedulingConsumerMenu } from '@/lib/scheduling-consumer-menu-services'
import { filterConsumerSchedulingCategoriesForProductMenu } from '@/lib/scheduling-visibility'
import type {
  MembershipPlan,
  ProductCategory,
  SchedulingCategory,
  SchedulingService,
  SchedulingSlot,
  EventPackage,
} from '@/lib/types'

export interface SchedulingProductMenuSection {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly scrollItems: EventCatalogScrollItem[]
  readonly membershipOffers: readonly OpenPlayMembershipOffer[]
}

const DEFAULT_SCHEDULING_DESCRIPTION = 'Bookable experiences in this category.'

const OPEN_PLAY_PRODUCT_MENU_DESCRIPTION =
  '2-hour, sibling, and multi-pass sessions plus membership and seasonal passes.'

/** Match native menu: Play/Gym = one service card; Events = package tier cards. */
function buildListingScrollItemsForCategory(
  category: SchedulingCategory,
  listed: readonly SchedulingService[],
  packages: readonly EventPackage[],
): EventCatalogScrollItem[] {
  if (usesEventStyleSchedulingListing(category)) {
    return buildEventCatalogScrollItems(listed, packages)
  }
  return listed.map((service) => ({ kind: 'service' as const, service }))
}

export function buildSchedulingSectionsForProductMenu(params: {
  readonly productType: string
  readonly productCategories: readonly ProductCategory[]
  readonly schedulingCategories: readonly SchedulingCategory[]
  readonly services: readonly SchedulingService[]
  readonly slots: readonly SchedulingSlot[]
  readonly packages: readonly EventPackage[]
  readonly plans: readonly MembershipPlan[]
}): SchedulingProductMenuSection[] {
  const productRootIdsBySlug = buildProductRootIdsBySlug(params.productCategories)
  const menuSlug = catalogSlugFromProductType(params.productType)
  const repairedCategories = params.schedulingCategories.map((category) =>
    repairSchedulingCategoryProductPlacement(category, productRootIdsBySlug),
  )
  const categoryById = new Map(
    repairedCategories.map((category) => [category.id, category]),
  )

  const openPlaySection: OpenPlayConsumerSection | null = buildOpenPlayConsumerSection({
    menuSlug,
    categories: repairedCategories,
    services: params.services,
    slots: params.slots,
    plans: params.plans,
    categoryById,
    productRootIdsBySlug,
    productCategories: params.productCategories,
    description: OPEN_PLAY_PRODUCT_MENU_DESCRIPTION,
  })

  const otherCategories = filterConsumerSchedulingCategoriesForProductMenu(
    params.productType,
    repairedCategories,
    productRootIdsBySlug,
    params.productCategories,
  ).filter((category) => !isOpenPlaySchedulingCategory(category))

  const otherSections: SchedulingProductMenuSection[] = otherCategories.map((category) => {
    const listed = collectServicesForSchedulingConsumerMenu(
      category,
      menuSlug,
      params.services,
      params.slots,
      params.packages,
      categoryById,
    )
    return {
      id: category.id,
      title: category.name,
      description: category.description ?? DEFAULT_SCHEDULING_DESCRIPTION,
      scrollItems: buildListingScrollItemsForCategory(category, listed, params.packages),
      membershipOffers: [],
    }
  })

  const sections: SchedulingProductMenuSection[] = [
    ...(openPlaySection &&
    (openPlaySection.services.length > 0 || openPlaySection.membershipOffers.length > 0)
      ? [
          {
            id: openPlaySection.category.id,
            title: openPlaySection.category.name,
            description: openPlaySection.description,
            scrollItems: openPlaySection.services.map((service) => ({
              kind: 'service' as const,
              service,
            })),
            membershipOffers: openPlaySection.membershipOffers,
          },
        ]
      : []),
    ...otherSections,
  ]

  return sections.filter(
    (section) => section.scrollItems.length > 0 || section.membershipOffers.length > 0,
  )
}
