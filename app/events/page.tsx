'use client'

import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'

import { CustomerFooter } from '@/components/customer/footer'
import { HorizontalScrollSection } from '@/components/customer/horizontal-scroll-section'
import { CustomerNavbar } from '@/components/customer/navbar'
import { PromoLinkGridSection } from '@/components/customer/promo-link-grid-section'
import { ScrollableSectionBreadcrumbs } from '@/components/customer/scrollable-section-breadcrumbs'
import { EventPackageScrollCard } from '@/components/customer/event-package-scroll-card'
import { ServiceScrollCard } from '@/components/customer/service-scroll-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  buildEventCatalogScrollItems,
  eventCatalogItemMatchesSearch,
} from '@/lib/event-catalog-display'
import {
  buildSchedulingCategoryById,
  hasAssignedConsumerSlot,
  isConsumerEventCatalogService,
  isConsumerVisibleSchedulingCategory,
} from '@/lib/scheduling-visibility'
import { useScheduling } from '@/lib/scheduling-store'
import type { Event } from '@/lib/types'

const statuses: Array<'All' | Event['status']> = ['All', 'PUBLISHED', 'DRAFT']
const PRIORITIZED_EVENT_CATEGORY_NAMES = [
  'Private Party Room & Open Play',
  'The Whole Place Private Party & Open Play',
] as const

/** Consumer events browse — only the dedicated event sub-categories (not legacy cat-5). */
function isEventSectionCategory(categoryId: string): boolean {
  return categoryId.startsWith('cat-event-')
}

const TAKE_OUT_PARTY_ITEMS = [
  {
    id: 'takeout-pizza',
    title: 'Pizza Trays',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=80',
    href: '/events/take-out-party',
  },
  {
    id: 'takeout-cupcakes',
    title: 'Cupcakes',
    imageUrl: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=1200&q=80',
    href: '/events/take-out-party',
  },
  {
    id: 'takeout-snacks',
    title: 'Party Snacks',
    imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=1200&q=80',
    href: '/events/take-out-party',
  },
  {
    id: 'takeout-drinks',
    title: 'Drinks & Supplies',
    imageUrl: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=1200&q=80',
    href: '/events/take-out-party',
  },
] as const

const WE_BRING_PARTY_ITEMS = [
  {
    id: 'bring-inflatables',
    title: 'Inflatables',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80',
    href: '/we-bring-the-party',
  },
  {
    id: 'bring-games',
    title: 'Interactive Games',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80',
    href: '/we-bring-the-party',
  },
  {
    id: 'bring-entertainers',
    title: 'Entertainers',
    imageUrl: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=1200&q=80',
    href: '/we-bring-the-party',
  },
  {
    id: 'bring-catering',
    title: 'Party Catering',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
    href: '/we-bring-the-party',
  },
] as const

export default function EventsPage() {
  const { categories, services, slots, packages } = useScheduling()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'All' | Event['status']>('All')

  const categoryById = useMemo(() => buildSchedulingCategoryById(categories), [categories])

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

  const hasActiveFilters = Boolean(search) || status !== 'All'
  const groupedSections = useMemo(() => {
    const prioritizedCategoryOrder = new Map<string, number>(
      PRIORITIZED_EVENT_CATEGORY_NAMES.map((name, index) => [name, index]),
    )
    const eventCategories = categories
      .filter(
        (category) =>
          isConsumerVisibleSchedulingCategory(category) &&
          isEventSectionCategory(category.id),
      )
      .slice()
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

    const sections = eventCategories.map((category) => ({
      key: category.id,
      title: category.name,
      description: category.description ?? 'Recently added events available for booking.',
      items: filteredScrollItems.filter((item) =>
        item.kind === 'package'
          ? item.bookingService.categoryId === category.id
          : item.service.categoryId === category.id,
      ),
    }))

    const categoryIds = new Set(eventCategories.map((category) => category.id))
    const uncategorizedItems = filteredScrollItems.filter((item) => {
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
      })
    }

    return sections
  }, [categories, filteredScrollItems])
  const breadcrumbItems = useMemo(
    () =>
      groupedSections
        .filter((section) => section.items.length > 0)
        .map((section) => ({
          id: section.key,
          label: section.title,
          href: `#events-section-${section.key}`,
        })),
    [groupedSections],
  )

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
              <span className="font-semibold text-foreground">{filteredScrollItems.length}</span>{' '}
              {filteredScrollItems.length === 1 ? 'listing' : 'listings'}
            </p>
            {filteredScrollItems.length === 0 ? (
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
                {groupedSections.map((section) =>
                  section.items.length > 0 ? (
                    <div key={section.key} id={`events-section-${section.key}`}>
                      <HorizontalScrollSection
                        title={section.title}
                        description={section.description}
                      >
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
                  ) : null,
                )}
              </div>
            )}
          </div>
        </section>

        <section className="bg-background pb-4">
          <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
            <PromoLinkGridSection
              eyebrow="Take Out Party"
              title="Take Out Party"
              description="Pick up party-ready food, drinks, and essentials curated for your event."
              items={TAKE_OUT_PARTY_ITEMS}
              ctaLabel="View Take Out Party"
              ctaHref="/events/take-out-party"
            />

            <PromoLinkGridSection
              eyebrow="We Bring The Party To You"
              title="We Bring The Party To You"
              description="Off-site setup, entertainment, and party equipment brought directly to your venue."
              items={WE_BRING_PARTY_ITEMS}
              ctaLabel="Plan Off-Site Party"
              ctaHref="/we-bring-the-party"
            />
          </div>
        </section>
      </main>
      <CustomerFooter />
    </>
  )
}
