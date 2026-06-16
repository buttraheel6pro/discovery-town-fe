/** Unified Gym page with sectioned, horizontally scrollable service rails. */
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
} from '@/lib/open-play-consumer-section'
import { buildProductSectionsForSchedulingMenu } from '@/lib/product-scheduling-menu-sections'
import { collectServicesForSchedulingConsumerMenu } from '@/lib/scheduling-consumer-menu-services'
import {
  buildSchedulingMenuPageBrowseCrumbs,
  schedulingCategoriesForConsumerMenu,
} from '@/lib/scheduling-menu-browse'
import { buildSchedulingCategoryById } from '@/lib/scheduling-visibility'
import { useScheduling } from '@/lib/scheduling-store'

const GYM_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'cat-open-play':
    '2-hour, sibling, and multi-pass sessions plus membership and seasonal passes.',
  'cat-gym-babies': 'Sensory-rich exploration, soft surfaces, and early motor milestones.',
  'cat-gym-toddlers': 'Parent-guided movement, balance basics, and social play routines.',
  'cat-gym-preschool':
    'Gymnastics vocabulary, agility, multi-sport sampling, and story-led movement.',
  'cat-gym-kids':
    'Focus: technique, discipline, teamwork, and confidence building. Gymnastics, ninja, sports skills, and interactive fitness.',
  'cat-gym-teens':
    'Focus: athletic performance, stress relief, and functional strength. Strength, tumbling, ninja, and varsity prep tracks.',
  'cat-gym-adults':
    'Focus: cardiovascular health, mobility, and strength. Classes are often scheduled concurrently with kid programmes.',
  'cat-gym-seniors': 'Low-impact strength, cardio, and mobility programs.',
  'cat-gym-family': 'Concurrent programming for parents and children together.',
  'cat-gym-prenatal': 'Prenatal-safe and postnatal recovery focused classes.',
  'cat-gym-special-needs': 'Inclusive, adaptive fitness sessions for every learner.',
  'cat-gym-parents': 'Morning fitness and strength sessions designed for parents.',
  'cat-gym-after-school': 'Structured after-school gym blocks by age wave, Mon–Thu afternoons.',
}

export default function GymPage() {
  const { categories, services, slots, packages } = useScheduling()
  const { products, productCategories } = useInventory()
  const { cafeProducts } = useCafe()
  const { membershipPlans } = useClients()

  const categoryById = useMemo(() => buildSchedulingCategoryById(categories), [categories])

  const gymSchedulingCategories = useMemo(
    () => schedulingCategoriesForConsumerMenu('gym', categories),
    [categories],
  )

  const openPlaySection = useMemo(
    () =>
      buildOpenPlayConsumerSection({
        menuSlug: 'gym',
        categories,
        services,
        slots,
        plans: membershipPlans,
        categoryById,
        description:
          GYM_CATEGORY_DESCRIPTIONS['cat-open-play'] ??
          '2-hour, sibling, and multi-pass sessions plus membership and seasonal passes.',
      }),
    [categories, categoryById, membershipPlans, services, slots],
  )

  const contentGymSections = useMemo(() => {
    const schedulingSections = gymSchedulingCategories.map((category) => ({
      id: category.id,
      title: category.name,
      description: GYM_CATEGORY_DESCRIPTIONS[category.id] ?? 'Fitness experiences for every age.',
      services: collectServicesForSchedulingConsumerMenu(
        category,
        'gym',
        services,
        slots,
        packages,
        categoryById,
      ),
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
    categoryById,
    gymSchedulingCategories,
    openPlaySection,
    packages,
    services,
    slots,
  ])

  const productSections = useMemo(
    () =>
      buildProductSectionsForSchedulingMenu({
        menuSlug: 'gym',
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
        contentSections: contentGymSections,
      }),
    [contentGymSections, productSections],
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
              Gym
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-primary-foreground/80 md:text-base">
              Explore age-based classes designed around real daily schedules for families.
            </p>
          </div>
        </section>

        <section className="bg-background py-10">
          <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-foreground">Browse gym categories</h2>
              <ScrollableSectionBreadcrumbs items={breadcrumbItems} />
            </section>
            <SchedulingMenuProductRails menuSlug="gym" />
            {contentGymSections.map((section) => (
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
