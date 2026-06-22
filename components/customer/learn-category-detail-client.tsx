/** Learn category detail — hero and navigable program list (detail pages handle booking). */
'use client'

import { useMemo } from 'react'

import { PLAY_SERVICE_LIST_HEIGHT_CLASS } from '@/components/customer/play-facility-booking-provider'
import { SchedulingEmptyCartCard } from '@/components/customer/scheduling-empty-cart-card'
import { PlayServiceDetailHero } from '@/components/customer/play-service-detail-hero'
import {
  PlayServiceNameList,
  type PlayServiceListItem,
} from '@/components/customer/play-service-name-list'
import { isApiEnabled } from '@/lib/api/client'
import { useLearnCategories } from '@/hooks/use-learn-categories'
import { collectServicesForSchedulingConsumerMenu } from '@/lib/scheduling-consumer-menu-services'
import { getSchedulingConsumerDetailHref } from '@/lib/scheduling-consumer-detail-href'
import {
  LEARN_CATEGORY_DESCRIPTIONS,
  resolveLearnCategoryCardMeta,
} from '@/lib/learn-category-meta'
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
    'learn',
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

export interface LearnCategoryDetailClientProps {
  readonly category: SchedulingCategory
  readonly categoryIndex?: number
}

export function LearnCategoryDetailClient({
  category,
  categoryIndex = 0,
}: Readonly<LearnCategoryDetailClientProps>) {
  const { services, slots, packages } = useScheduling()
  const { categoryById } = useLearnCategories()

  const categoryMeta = useMemo(
    () => resolveLearnCategoryCardMeta(category, categoryIndex),
    [category, categoryIndex],
  )

  const categoryDescription =
    LEARN_CATEGORY_DESCRIPTIONS[category.id] ??
    category.description ??
    'Discover academic and enrichment programs at Discovery Town.'

  const { sectionMap } = useCatalogPageServices([category])

  const mockServices = useMemo(
    () => getMockServicesForCategory(category, services, slots, packages, categoryById),
    [category, categoryById, packages, services, slots],
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

    return categoryServices.map((service) => ({
      kind: 'service',
      id: service.id,
      service,
      href: getSchedulingConsumerDetailHref(service, packages),
    }))
  }, [category.id, mockServices, packages, sectionMap])

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
        backHref="/learn"
        backLabel="Back to Learn"
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
          <div className={`lg:col-span-2 ${PLAY_SERVICE_LIST_HEIGHT_CLASS}`}>
            <PlayServiceNameList
              items={listItems}
              isLoading={listIsLoading}
              categoryName={category.name}
              listHeadingSuffix="programs & services"
              listDescription="Select a program to enroll. Hover the image for a preview."
              emptyMessage="No programs available in this category yet."
              listAriaLabel="Learn programs"
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
