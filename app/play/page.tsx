/** Unified Play page with sectioned, horizontally scrollable service rails. */
'use client'

import { useMemo } from 'react'

import { CustomerFooter } from '@/components/customer/footer'
import { HorizontalScrollSection } from '@/components/customer/horizontal-scroll-section'
import { CustomerNavbar } from '@/components/customer/navbar'
import { OpenPlayMembershipOfferCard } from '@/components/customer/open-play-membership-offer-card'
import { ScrollableSectionBreadcrumbs } from '@/components/customer/scrollable-section-breadcrumbs'
import { ServiceScrollCard } from '@/components/customer/service-scroll-card'
import { visibleOpenPlayMembershipOffers } from '@/lib/open-play-membership-offers'
import { useClients } from '@/lib/client-store'
import { isOpenPlayPassCatalogService } from '@/lib/open-play-pass-catalog'
import {
  buildSchedulingCategoryById,
  isConsumerListedSchedulingService,
  isConsumerVisibleSchedulingCategory,
} from '@/lib/scheduling-visibility'
import { SPECIAL_PLAY_EVENTS_CATEGORY_ID } from '@/lib/scheduling-slot-availability'
import { sortSpecialPlayServices } from '@/lib/special-play-service-order'
import { useScheduling } from '@/lib/scheduling-store'
import {
  WE_BRING_PLAY_CATEGORY_ID,
  WE_BRING_PLAY_SERVICE_IDS,
} from '@/lib/we-bring-play-offerings'
import type { SchedulingService, SchedulingSlot } from '@/lib/types'

const WE_BRING_PLAY_SERVICE_ORDER = new Map(
  WE_BRING_PLAY_SERVICE_IDS.map((id, index) => [id, index]),
)

const OPEN_PLAY_CATEGORY_ID = 'cat-open-play'

function servicesForPlayCategory(
  categoryId: string,
  services: readonly SchedulingService[],
  slots: readonly SchedulingSlot[],
  categoryById: ReadonlyMap<string, { readonly isActive: boolean }>,
): SchedulingService[] {
  const matched = services.filter(
    (service) =>
      !isOpenPlayPassCatalogService(service) &&
      service.categoryId === categoryId &&
      isConsumerListedSchedulingService(service, categoryById, slots),
  )
  if (categoryId === SPECIAL_PLAY_EVENTS_CATEGORY_ID) {
    return sortSpecialPlayServices(matched)
  }
  if (categoryId === WE_BRING_PLAY_CATEGORY_ID) {
    return matched
      .filter((service) => WE_BRING_PLAY_SERVICE_ORDER.has(service.id))
      .sort(
        (a, b) =>
          (WE_BRING_PLAY_SERVICE_ORDER.get(a.id) ?? 0) -
          (WE_BRING_PLAY_SERVICE_ORDER.get(b.id) ?? 0),
      )
  }
  return matched
}

const PLAY_CATEGORY_IDS = new Set<string>([
  OPEN_PLAY_CATEGORY_ID,
  'cat-private-play',
  'cat-special-play-events',
  'cat-summer-camp-play',
  'cat-camps-play',
  'cat-parents-night',
  'cat-field-trips',
  'cat-we-bring-play',
])

const PLAY_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'cat-open-play':
    '2-hour, sibling, and multi-pass session bookings. Membership and seasonal passes are listed below.',
  'cat-private-play': 'Private room, full venue takeover, and meeting-room conference options.',
  'cat-special-play-events':
    'Character, holiday, fall/winter/spring seasonal festivals, and skill-building programmes.',
  'cat-summer-camp-play':
    'Themed summer camp weeks — register for a full week of supervised play and activities.',
  'cat-camps-play': 'Winter break, spring break, and MLK day camp options.',
  'cat-parents-night': 'Saturday 4-7 PM supervised care for ages 6 months to 7 years.',
  'cat-field-trips': 'Structured group experiences for schools and organizations.',
  'cat-we-bring-play':
    'Mobile inflatables, games, entertainment, and party setup brought to your venue.',
}

export default function PlayPage() {
  const { categories, services, slots } = useScheduling()
  const { membershipPlans } = useClients()

  const categoryById = useMemo(() => buildSchedulingCategoryById(categories), [categories])

  const openPlayMembershipOffers = useMemo(
    () => visibleOpenPlayMembershipOffers(membershipPlans),
    [membershipPlans],
  )

  const sectionServices = useMemo(
    () =>
      categories
        .filter(
          (category) =>
            isConsumerVisibleSchedulingCategory(category) &&
            (PLAY_CATEGORY_IDS.has(category.id) || category.id.startsWith('cat-play-')),
        )
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((category) => ({
          id: category.id,
          title: category.name,
          description: PLAY_CATEGORY_DESCRIPTIONS[category.id] ?? 'Discover play experiences.',
          services: servicesForPlayCategory(category.id, services, slots, categoryById),
          membershipOffers:
            category.id === OPEN_PLAY_CATEGORY_ID ? openPlayMembershipOffers : [],
        }))
        .filter(
          (section) =>
            section.services.length > 0 || section.membershipOffers.length > 0,
        ),
    [categories, categoryById, openPlayMembershipOffers, services, slots],
  )
  const breadcrumbItems = useMemo(
    () =>
      sectionServices.map((section) => ({
        id: section.id,
        label: section.title,
        href: `#${section.id}`,
      })),
    [sectionServices],
  )

  return (
    <>
      <CustomerNavbar />
      <main>
        <section className="bg-primary py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">Discover</p>
            <h1
              className="text-4xl font-black tracking-tight text-primary-foreground sm:text-5xl"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              Play
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-primary-foreground/80 md:text-base">
              Explore every way to play at Discovery Town, from open sessions to private experiences.
            </p>
          </div>
        </section>

        <section className="bg-background py-10">
          <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-foreground">Browse play categories</h2>
              <ScrollableSectionBreadcrumbs items={breadcrumbItems} />
            </section>
            {sectionServices.map((section) => (
              <div key={section.id} id={section.id}>
                <HorizontalScrollSection
                  title={section.title}
                  description={section.description}
                >
                  {section.services.map((service) => (
                    <ServiceScrollCard key={service.id} service={service} />
                  ))}
                  {section.membershipOffers.map((offer) => (
                    <OpenPlayMembershipOfferCard key={offer.id} offer={offer} />
                  ))}
                </HorizontalScrollSection>
              </div>
            ))}
          </div>
        </section>
      </main>
      <CustomerFooter />
    </>
  )
}
