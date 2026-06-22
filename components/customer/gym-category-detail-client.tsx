/** Gym category detail — hero and navigable class list (detail pages handle booking). */
'use client'

import { useMemo } from 'react'

import { PLAY_SERVICE_LIST_HEIGHT_CLASS } from '@/components/customer/play-facility-booking-provider'
import { SchedulingEmptyCartCard } from '@/components/customer/scheduling-empty-cart-card'
import { PlayServiceDetailHero } from '@/components/customer/play-service-detail-hero'
import {
  PlayServiceNameList,
  type PlayServiceListItem,
} from '@/components/customer/play-service-name-list'
import { useClients } from '@/lib/client-store'
import { isApiEnabled } from '@/lib/api/client'
import { useGymCategories } from '@/hooks/use-gym-categories'
import {
  buildOpenPlayConsumerSection,
  isOpenPlaySchedulingCategory,
} from '@/lib/open-play-consumer-section'
import { resolveOfferDisplayPrice, visibleOpenPlayMembershipOffers } from '@/lib/open-play-membership-offers'
import { collectServicesForSchedulingConsumerMenu } from '@/lib/scheduling-consumer-menu-services'
import {
  getOpenPlayMembershipOfferDetailHref,
  getSchedulingConsumerDetailHref,
} from '@/lib/scheduling-consumer-detail-href'
import {
  GYM_CATEGORY_DESCRIPTIONS,
  resolveGymCategoryCardMeta,
} from '@/lib/gym-category-meta'
import { getSchedulingCategoryMenuBackLink } from '@/lib/scheduling-consumer-categories'
import { useScheduling } from '@/lib/scheduling-store'
import { useCatalogPageServices, type SectionPageData } from '@/lib/hooks/use-catalog-page-services'
import type {
  EventPackage,
  SchedulingCategory,
  SchedulingService,
  SchedulingSlot,
} from '@/lib/types'

function getMockServicesForCategory(
  category: SchedulingCategory,
  services: readonly SchedulingService[],
  slots: readonly SchedulingSlot[],
  packages: readonly EventPackage[],
  categoryById: ReadonlyMap<string, SchedulingCategory>,
): SchedulingService[] {
  return collectServicesForSchedulingConsumerMenu(
    category,
    'gym',
    services,
    slots,
    packages,
    categoryById,
  )
}

function resolveSectionServices(
  categoryId: string,
  sectionData: Map<string, SectionPageData>,
  mockServices: SchedulingService[],
): { services: SchedulingService[]; isLoading: boolean } {
  if (!isApiEnabled) {
    return { services: mockServices, isLoading: false }
  }
  const data = sectionData.get(categoryId)
  return {
    services: data?.services ?? [],
    isLoading: data?.isLoading ?? true,
  }
}

export interface GymCategoryDetailClientProps {
  readonly category: SchedulingCategory
  readonly categoryIndex?: number
}

export function GymCategoryDetailClient({
  category,
  categoryIndex = 0,
}: Readonly<GymCategoryDetailClientProps>) {
  const { services, slots, packages } = useScheduling()
  const { membershipPlans } = useClients()
  const { categoryById } = useGymCategories()

  const categoryMeta = useMemo(
    () => resolveGymCategoryCardMeta(category, categoryIndex),
    [category, categoryIndex],
  )

  const categoryDescription =
    GYM_CATEGORY_DESCRIPTIONS[category.id] ??
    category.description ??
    'Discover gym classes and programs at Discovery Town.'

  const openPlaySection = useMemo(
    () =>
      buildOpenPlayConsumerSection({
        menuSlug: 'gym',
        categories: Array.from(categoryById.values()),
        services,
        slots,
        plans: membershipPlans,
        categoryById,
        description: categoryDescription,
      }),
    [categoryById, categoryDescription, membershipPlans, services, slots],
  )

  const { sectionMap } = useCatalogPageServices([category])

  const mockServices = useMemo(() => {
    if (openPlaySection && category.id === openPlaySection.category.id) {
      return openPlaySection.services
    }
    return getMockServicesForCategory(category, services, slots, packages, categoryById)
  }, [category, categoryById, openPlaySection, packages, services, slots])

  const membershipOffers = useMemo(
    () => visibleOpenPlayMembershipOffers(membershipPlans),
    [membershipPlans],
  )

  const listItems = useMemo((): PlayServiceListItem[] => {
    const { services: categoryServices, isLoading } = resolveSectionServices(
      category.id,
      sectionMap,
      mockServices,
    )

    if (isLoading) {
      return []
    }

    const serviceItems: PlayServiceListItem[] = categoryServices.map((service) => ({
      kind: 'service',
      id: service.id,
      service,
      href: getSchedulingConsumerDetailHref(service, packages),
    }))

    if (isOpenPlaySchedulingCategory(category)) {
      const offerItems: PlayServiceListItem[] = membershipOffers.map((offer) => {
        const pricing = resolveOfferDisplayPrice(membershipPlans, offer.kind)
        return {
          kind: 'membership-offer',
          id: offer.id,
          offer,
          displayPrice: pricing.price,
          href: getOpenPlayMembershipOfferDetailHref(offer.id),
        }
      })
      return [...serviceItems, ...offerItems]
    }

    return serviceItems
  }, [category, membershipOffers, membershipPlans, mockServices, packages, sectionMap])

  const backLink = useMemo(
    () => getSchedulingCategoryMenuBackLink(category.id, category),
    [category],
  )

  const listIsLoading = useMemo(() => {
    if (!isApiEnabled) {
      return false
    }
    const data = sectionMap.get(category.id)
    return data?.isLoading ?? true
  }, [category.id, sectionMap])

  return (
    <>
      <PlayServiceDetailHero
        service={null}
        category={category}
        categoryImageSrc={categoryMeta.imageSrc}
        categoryDescription={categoryDescription}
        backHref={backLink.href}
        backLabel={backLink.label}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
          <div className={`lg:col-span-2 ${PLAY_SERVICE_LIST_HEIGHT_CLASS}`}>
            <PlayServiceNameList
              items={listItems}
              isLoading={listIsLoading}
              categoryName={category.name}
              listHeadingSuffix="classes & programs"
              listDescription="Select a class to book. Hover the image for a preview."
              emptyMessage="No classes available in this category yet."
              listAriaLabel="Gym classes"
            />
          </div>

          <aside className="lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
            <SchedulingEmptyCartCard />
          </aside>
        </div>
      </div>
    </>
  )
}
