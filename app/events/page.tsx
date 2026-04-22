'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'

import { CustomerFooter } from '@/components/customer/footer'
import { HorizontalScrollSection } from '@/components/customer/horizontal-scroll-section'
import { CustomerNavbar } from '@/components/customer/navbar'
import { PromoLinkGridSection } from '@/components/customer/promo-link-grid-section'
import { ServiceScrollCard } from '@/components/customer/service-scroll-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { hasAssignedConsumerSlot, isEventCatalogService } from '@/lib/scheduling-visibility'
import { useScheduling } from '@/lib/scheduling-store'
import type { Event } from '@/lib/types'

const statuses: Array<'All' | Event['status']> = ['All', 'PUBLISHED', 'DRAFT']

const PLAY_CATEGORY_IDS = new Set<string>([
  'cat-open-play',
  'cat-private-play',
  'cat-camps-play',
  'cat-special-play-events',
  'cat-parents-night',
  'cat-field-trips',
  'cat-we-bring-play',
])

function isEventSectionCategory(categoryId: string): boolean {
  if (categoryId.startsWith('cat-gym-')) {
    return false
  }
  if (PLAY_CATEGORY_IDS.has(categoryId) || categoryId.startsWith('cat-play-')) {
    return false
  }
  return true
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
    imageUrl: 'https://images.unsplash.com/photo-1514517220031-58f8ff5d5d17?w=1200&q=80',
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
  const { categories, services, slots } = useScheduling()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'All' | Event['status']>('All')

  function handleClear() {
    setSearch('')
    setStatus('All')
  }

  const eventCatalog = useMemo(
    () =>
      services.filter(
        (service) =>
          isEventCatalogService(service) &&
          hasAssignedConsumerSlot(service, slots),
      ),
    [services, slots],
  )
  const featuredPartyServiceId = useMemo(
    () => eventCatalog.find((entry) => entry.serviceType === 'PARTY_PACKAGE')?.id ?? null,
    [eventCatalog],
  )

  const filtered = useMemo(() => {
    let result = [...eventCatalog]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.sport?.toLowerCase().includes(q) ?? false) ||
          (s.description?.toLowerCase().includes(q) ?? false),
      )
    }

    if (status !== 'All') {
      result = result.filter((s) => s.eventStatus === status)
    }

    return result
  }, [eventCatalog, search, status])

  const hasActiveFilters = Boolean(search) || status !== 'All'
  const groupedSections = useMemo(() => {
    const eventCategories = categories
      .filter((category) => isEventSectionCategory(category.id))
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)

    const sections = eventCategories.map((category) => ({
      key: category.id,
      title: category.name,
      description: category.description ?? 'Recently added events available for booking.',
      items: filtered.filter((service) => service.categoryId === category.id),
    }))

    const categoryIds = new Set(eventCategories.map((category) => category.id))
    const uncategorizedItems = filtered.filter((service) => !categoryIds.has(service.categoryId))
    if (uncategorizedItems.length > 0) {
      sections.push({
        key: 'other-events',
        title: 'Other Events',
        description: 'Recently added events that are available for booking.',
        items: uncategorizedItems,
      })
    }

    return sections
  }, [categories, filtered])

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

        <section className="bg-background pb-4 pt-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-border bg-gradient-to-r from-card to-secondary/50 p-5 shadow-sm md:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent">
                    Plan your celebration
                  </p>
                  <h2
                    className="text-2xl font-black text-foreground md:text-3xl"
                    style={{ fontFamily: 'var(--font-barlow)' }}
                  >
                    Book a Venue or Private Room
                  </h2>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Host unforgettable birthdays, school celebrations, and private events with
                    curated packages, guest planning, optional extras, and guided booking.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={
                      featuredPartyServiceId
                        ? `/events/${featuredPartyServiceId}?privateEvent=1`
                        : '/events'
                    }
                  >
                    <Button type="button" className="h-11 px-6">
                      Start private event booking
                    </Button>
                  </Link>
                  <Link href="/events">
                    <Button type="button" variant="outline" className="h-11 px-6">
                      Browse event options
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
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

        <section className="bg-background py-12" aria-live="polite" aria-label="Event results">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-6 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
              {filtered.length === 1 ? 'event' : 'events'}
            </p>
            {filtered.length === 0 ? (
              <div className="space-y-4 py-20 text-center">
                <p className="text-2xl font-bold text-muted-foreground">No events found</p>
                <Button type="button" onClick={handleClear}>
                  View all events
                </Button>
              </div>
            ) : (
              <div className="space-y-10">
                {groupedSections.map((section) =>
                  section.items.length > 0 ? (
                    <HorizontalScrollSection
                      key={section.key}
                      title={section.title}
                      description={section.description}
                    >
                      {section.items.map((service) => (
                        <ServiceScrollCard key={service.id} service={service} />
                      ))}
                    </HorizontalScrollSection>
                  ) : null,
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <CustomerFooter />
    </>
  )
}
