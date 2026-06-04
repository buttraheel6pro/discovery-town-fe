/** Unified Play page with sectioned, horizontally scrollable service rails. */
'use client'

import { useMemo } from 'react'

import { CustomerFooter } from '@/components/customer/footer'
import { HorizontalScrollSection } from '@/components/customer/horizontal-scroll-section'
import { CustomerNavbar } from '@/components/customer/navbar'
import { SchedulingMenuProductRails } from '@/components/customer/scheduling-menu-product-rails'
import { OpenPlayMembershipOfferCard } from '@/components/customer/open-play-membership-offer-card'
import { ScrollableSectionBreadcrumbs } from '@/components/customer/scrollable-section-breadcrumbs'
import { ServiceScrollCard } from '@/components/customer/service-scroll-card'
import { useClients } from '@/lib/client-store'
import { useCafe } from '@/lib/cafe-store'
import { useInventory } from '@/lib/inventory-store'
import {
  buildOpenPlayConsumerSection,
  isOpenPlaySchedulingCategory,
} from '@/lib/open-play-consumer-section'
import { collectServicesForSchedulingConsumerMenu } from '@/lib/scheduling-consumer-menu-services'
import { buildProductSectionsForSchedulingMenu } from '@/lib/product-scheduling-menu-sections'
import {
  buildSchedulingMenuPageBrowseCrumbs,
  schedulingCategoriesForConsumerMenu,
} from '@/lib/scheduling-menu-browse'
import { buildSchedulingCategoryById } from '@/lib/scheduling-visibility'
import { SPECIAL_PLAY_EVENTS_CATEGORY_ID } from '@/lib/scheduling-slot-availability'
import { sortSpecialPlayServices } from '@/lib/special-play-service-order'
import { useScheduling } from '@/lib/scheduling-store'
import type { EventPackage, SchedulingCategory, SchedulingService, SchedulingSlot } from '@/lib/types'

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
}

function servicesForPlayCategory(
  category: SchedulingCategory,
  services: readonly SchedulingService[],
  slots: readonly SchedulingSlot[],
  packages: readonly EventPackage[],
  categoryById: ReadonlyMap<string, SchedulingCategory>,
): SchedulingService[] {
  const matched = collectServicesForSchedulingConsumerMenu(
    category,
    'play',
    services,
    slots,
    packages,
    categoryById,
  )
  if (category.id === SPECIAL_PLAY_EVENTS_CATEGORY_ID) {
    return sortSpecialPlayServices(matched)
  }
  return matched
}

export default function PlayPage() {
  const { categories, services, slots, packages } = useScheduling()
  const { products, productCategories } = useInventory()
  const { cafeProducts } = useCafe()
  const { membershipPlans } = useClients()

  const categoryById = useMemo(() => buildSchedulingCategoryById(categories), [categories])

  const playSchedulingCategories = useMemo(
    () => schedulingCategoriesForConsumerMenu('play', categories),
    [categories],
  )

  const openPlaySection = useMemo(
    () =>
      buildOpenPlayConsumerSection({
        menuSlug: 'play',
        categories,
        services,
        slots,
        plans: membershipPlans,
        categoryById,
        description:
          PLAY_CATEGORY_DESCRIPTIONS['cat-open-play'] ??
          '2-hour, sibling, and multi-pass session bookings. Membership and seasonal passes are listed below.',
      }),
    [categories, categoryById, membershipPlans, services, slots],
  )

  const contentPlaySections = useMemo(() => {
    const schedulingSections = playSchedulingCategories.map((category) => ({
      id: category.id,
      title: category.name,
      description: PLAY_CATEGORY_DESCRIPTIONS[category.id] ?? 'Discover play experiences.',
      services: servicesForPlayCategory(category, services, slots, packages, categoryById),
      membershipOffers: [] as const,
    }))

    const openPlayBlock =
      openPlaySection &&
      (openPlaySection.services.length > 0 || openPlaySection.membershipOffers.length > 0)
        ? [
            {
              id: openPlaySection.category.id,
              title: openPlaySection.category.name,
              description: openPlaySection.description,
              services: openPlaySection.services,
              membershipOffers: openPlaySection.membershipOffers,
            },
          ]
        : []

    return [...openPlayBlock, ...schedulingSections].filter(
      (section) => section.services.length > 0 || section.membershipOffers.length > 0,
    )
  }, [
    categories,
    categoryById,
    openPlaySection,
    packages,
    playSchedulingCategories,
    services,
    slots,
  ])

  const productSections = useMemo(
    () =>
      buildProductSectionsForSchedulingMenu({
        menuSlug: 'play',
        productCategories,
        products,
        cafeProducts,
      }),
    [cafeProducts, productCategories, products],
  )

  const breadcrumbItems = useMemo(
    () =>
      buildSchedulingMenuPageBrowseCrumbs({
        productSections,
        contentSections: contentPlaySections,
        productSectionsLast: true,
      }),
    [contentPlaySections, productSections],
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
            {contentPlaySections.map((section) => (
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
            <SchedulingMenuProductRails menuSlug="play" />
          </div>
        </section>
      </main>
      <CustomerFooter />
    </>
  )
}
