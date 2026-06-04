'use client'

import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'

import { CustomerFooter } from '@/components/customer/footer'
import { HorizontalScrollSection } from '@/components/customer/horizontal-scroll-section'
import { CustomerNavbar } from '@/components/customer/navbar'
import { SchedulingMenuProductRails } from '@/components/customer/scheduling-menu-product-rails'
import { OpenPlayMembershipOfferCard } from '@/components/customer/open-play-membership-offer-card'
import { ScrollableSectionBreadcrumbs } from '@/components/customer/scrollable-section-breadcrumbs'
import { EventPackageScrollCard } from '@/components/customer/event-package-scroll-card'
import { ServiceScrollCard } from '@/components/customer/service-scroll-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useClients } from '@/lib/client-store'
import { useCafe } from '@/lib/cafe-store'
import { useInventory } from '@/lib/inventory-store'
import { buildProductSectionsForSchedulingMenu } from '@/lib/product-scheduling-menu-sections'
import { partitionProductSectionsForEventsPage } from '@/lib/take-out-party-catalog'
import {
  buildSchedulingMenuBrowseCrumbsFromPageOrder,
  eventsMenuSectionCrumbs,
  schedulingMenuProductRailsCrumbs,
} from '@/lib/scheduling-menu-browse'
import {
  buildEventCatalogScrollItems,
  eventCatalogItemMatchesSearch,
} from '@/lib/event-catalog-display'
import {
  buildOpenPlayConsumerSection,
  dedupeOpenPlayMenuCategories,
  isOpenPlaySchedulingCategory,
  openPlayCategoryIds,
} from '@/lib/open-play-consumer-section'
import {
  buildSchedulingCategoryById,
  filterConsumerSchedulingCategoriesForMenu,
  hasAssignedConsumerSlot,
  isConsumerEventCatalogService,
} from '@/lib/scheduling-visibility'
import { useScheduling } from '@/lib/scheduling-store'
import type { Event, SchedulingService } from '@/lib/types'
import type { OpenPlayMembershipOffer } from '@/lib/open-play-membership-offers'
import type { EventCatalogScrollItem } from '@/lib/event-catalog-display'

interface EventsGroupedSection {
  readonly key: string
  readonly title: string
  readonly description: string
  readonly items: EventCatalogScrollItem[]
  readonly openPlayServices: SchedulingService[]
  readonly membershipOffers: OpenPlayMembershipOffer[]
}

const statuses: Array<'All' | Event['status']> = ['All', 'PUBLISHED', 'DRAFT']
const PRIORITIZED_EVENT_CATEGORY_NAMES = [
  'Private Party Room & Open Play',
  'The Whole Place Private Party & Open Play',
] as const

const OPEN_PLAY_EVENTS_DESCRIPTION =
  '2-hour, sibling, and multi-pass sessions plus membership and seasonal passes.'

function eventsSectionHasContent(section: EventsGroupedSection): boolean {
  return (
    section.items.length > 0 ||
    section.openPlayServices.length > 0 ||
    section.membershipOffers.length > 0
  )
}

export default function EventsPage() {
  const { categories, services, slots, packages } = useScheduling()
  const { products, productCategories } = useInventory()
  const { cafeProducts } = useCafe()
  const { membershipPlans } = useClients()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'All' | Event['status']>('All')

  const categoryById = useMemo(() => buildSchedulingCategoryById(categories), [categories])

  const openPlayAliasIds = useMemo(
    () => new Set(openPlayCategoryIds(categories)),
    [categories],
  )

  const openPlaySection = useMemo(
    () =>
      buildOpenPlayConsumerSection({
        menuSlug: 'events',
        categories,
        services,
        slots,
        plans: membershipPlans,
        categoryById,
        description: OPEN_PLAY_EVENTS_DESCRIPTION,
      }),
    [categories, categoryById, membershipPlans, services, slots],
  )

  function handleClear() {
    setSearch('')
    setStatus('All')
  }

  const eventCatalog = useMemo(
    () =>
      services.filter(
        (service) =>
          isConsumerEventCatalogService(service, categoryById) &&
          hasAssignedConsumerSlot(service, slots),
      ),
    [categoryById, services, slots],
  )
  const filteredServices = useMemo(() => {
    let result = [...eventCatalog]

    if (status !== 'All') {
      result = result.filter((s) => s.eventStatus === status)
    }

    return result
  }, [eventCatalog, status])

  const catalogScrollItems = useMemo(
    () => buildEventCatalogScrollItems(filteredServices, packages),
    [filteredServices, packages],
  )

  const filteredScrollItems = useMemo(() => {
    if (!search) {
      return catalogScrollItems
    }
    const q = search.toLowerCase()
    return catalogScrollItems.filter((item) => eventCatalogItemMatchesSearch(item, q))
  }, [catalogScrollItems, search])

  const scrollItemsExcludingOpenPlay = useMemo(
    () =>
      filteredScrollItems.filter((item) => {
        const categoryId =
          item.kind === 'package'
            ? item.bookingService.categoryId
            : item.service.categoryId
        return !openPlayAliasIds.has(categoryId)
      }),
    [filteredScrollItems, openPlayAliasIds],
  )

  const hasActiveFilters = Boolean(search) || status !== 'All'
  const groupedSections = useMemo(() => {
    const prioritizedCategoryOrder = new Map<string, number>(
      PRIORITIZED_EVENT_CATEGORY_NAMES.map((name, index) => [name, index]),
    )
    const eventCategories = dedupeOpenPlayMenuCategories(
      filterConsumerSchedulingCategoriesForMenu('events', categories),
    )
      .filter((category) => !isOpenPlaySchedulingCategory(category))
      .sort((a, b) => {
        const aPriority = prioritizedCategoryOrder.get(a.name)
        const bPriority = prioritizedCategoryOrder.get(b.name)

        if (aPriority !== undefined && bPriority !== undefined) {
          return aPriority - bPriority
        }

        if (aPriority !== undefined) {
          return -1
        }

        if (bPriority !== undefined) {
          return 1
        }

        return a.displayOrder - b.displayOrder
      })

    const sections: EventsGroupedSection[] = eventCategories.map((category) => ({
      key: category.id,
      title: category.name,
      description: category.description ?? 'Recently added events available for booking.',
      items: scrollItemsExcludingOpenPlay.filter((item) =>
        item.kind === 'package'
          ? item.bookingService.categoryId === category.id
          : item.service.categoryId === category.id,
      ),
      openPlayServices: [],
      membershipOffers: [],
    }))

    if (
      openPlaySection &&
      (openPlaySection.services.length > 0 || openPlaySection.membershipOffers.length > 0)
    ) {
      sections.unshift({
        key: openPlaySection.category.id,
        title: openPlaySection.category.name,
        description: openPlaySection.description,
        items: [],
        openPlayServices: openPlaySection.services,
        membershipOffers: openPlaySection.membershipOffers,
      })
    }

    const categoryIds = new Set(eventCategories.map((category) => category.id))
    if (openPlaySection) {
      categoryIds.add(openPlaySection.category.id)
    }
    const uncategorizedItems = scrollItemsExcludingOpenPlay.filter((item) => {
      const categoryId =
        item.kind === 'package' ? item.bookingService.categoryId : item.service.categoryId
      return !categoryIds.has(categoryId)
    })
    if (uncategorizedItems.length > 0) {
      sections.push({
        key: 'other-events',
        title: 'Other Events',
        description: 'Recently added events that are available for booking.',
        items: uncategorizedItems,
        openPlayServices: [],
        membershipOffers: [],
      })
    }

    return sections
  }, [categories, openPlaySection, scrollItemsExcludingOpenPlay])

  const visibleListingCount = useMemo(() => {
    const scrollCount = scrollItemsExcludingOpenPlay.length
    const openPlayCount =
      (openPlaySection?.services.length ?? 0) + (openPlaySection?.membershipOffers.length ?? 0)
    return scrollCount + openPlayCount
  }, [openPlaySection, scrollItemsExcludingOpenPlay.length])

  const productSections = useMemo(
    () =>
      buildProductSectionsForSchedulingMenu({
        menuSlug: 'events',
        productCategories,
        products,
        cafeProducts,
      }),
    [cafeProducts, productCategories, products],
  )

  const { beforeTakeOutPartySections, takeOutPartySections } = useMemo(() => {
    const partitioned = partitionProductSectionsForEventsPage(productSections)
    return {
      beforeTakeOutPartySections: partitioned.beforeTakeOutParty,
      takeOutPartySections: partitioned.takeOutParty,
    }
  }, [productSections])

  const visibleEventSections = useMemo(
    () => groupedSections.filter(eventsSectionHasContent),
    [groupedSections],
  )

  const breadcrumbItems = useMemo(
    () =>
      buildSchedulingMenuBrowseCrumbsFromPageOrder([
        ...schedulingMenuProductRailsCrumbs(beforeTakeOutPartySections),
        ...eventsMenuSectionCrumbs(visibleEventSections),
        ...schedulingMenuProductRailsCrumbs(takeOutPartySections),
      ]),
    [beforeTakeOutPartySections, takeOutPartySections, visibleEventSections],
  )

  const hasVisibleSections =
    productSections.length > 0 ||
    visibleEventSections.length > 0 ||
    takeOutPartySections.length > 0

  return (
    <>
      <CustomerNavbar />
      <main>
        <section className="bg-primary py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-accent">
              Compete &amp; Celebrate
            </p>
            <h1
              className="text-balance text-4xl font-black text-white sm:text-5xl"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              SPORTS EVENTS
            </h1>
            <p className="mt-3 max-w-xl leading-relaxed text-white/70">
              Tournaments, galas, wellness retreats, and more. Register today and be part of the
              action.
            </p>
          </div>
        </section>

        <section
          className="sticky top-16 z-40 border-b border-border bg-card py-4"
          aria-label="Search events"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 sm:px-6 lg:px-8">
            <div className="relative min-w-[220px] max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="pl-9"
                aria-label="Search events"
              />
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
              {statuses.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    status === s
                      ? 'border-accent bg-accent text-accent-foreground'
                      : 'border-border bg-background text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {s === 'All' ? 'All Events' : s === 'PUBLISHED' ? 'Open' : 'Coming Soon'}
                </button>
              ))}
            </div>
            {hasActiveFilters ? (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={handleClear}
                className="gap-1 text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            ) : null}
          </div>
        </section>

        <section className="bg-background py-12" aria-live="polite" aria-label="Event results">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-6 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{visibleListingCount}</span>{' '}
              {visibleListingCount === 1 ? 'listing' : 'listings'}
            </p>
            {!hasVisibleSections ? (
              <div className="space-y-4 py-20 text-center">
                <p className="text-2xl font-bold text-muted-foreground">No events found</p>
                <Button type="button" onClick={handleClear}>
                  View all events
                </Button>
              </div>
            ) : (
              <div className="space-y-10">
                <section className="space-y-4">
                  <h2 className="text-2xl font-black text-foreground">Browse event categories</h2>
                  <ScrollableSectionBreadcrumbs items={breadcrumbItems} />
                </section>
                {beforeTakeOutPartySections.length > 0 ? (
                  <SchedulingMenuProductRails
                    menuSlug="events"
                    sections={beforeTakeOutPartySections}
                  />
                ) : null}
                {groupedSections.map((section) => {
                  if (!eventsSectionHasContent(section)) {
                    return null
                  }
                  return (
                    <div key={section.key} id={`events-section-${section.key}`}>
                      <HorizontalScrollSection
                        title={section.title}
                        description={section.description}
                      >
                        {section.openPlayServices.map((service) => (
                          <ServiceScrollCard key={service.id} service={service} />
                        ))}
                        {section.membershipOffers.map((offer) => (
                          <OpenPlayMembershipOfferCard key={offer.id} offer={offer} />
                        ))}
                        {section.items.map((item) =>
                          item.kind === 'package' ? (
                            <EventPackageScrollCard
                              key={item.pkg.id}
                              pkg={item.pkg}
                              bookingService={item.bookingService}
                            />
                          ) : (
                            <ServiceScrollCard key={item.service.id} service={item.service} />
                          ),
                        )}
                      </HorizontalScrollSection>
                    </div>
                  )
                })}
                {takeOutPartySections.length > 0 ? (
                  <SchedulingMenuProductRails
                    menuSlug="events"
                    sections={takeOutPartySections}
                  />
                ) : null}
              </div>
            )}
          </div>
        </section>
      </main>
      <CustomerFooter />
    </>
  )
}
