/** Learn catalog — tutoring, test prep, and enrichment programs by grade tier. */
'use client'

import { useMemo } from 'react'

import { CustomerFooter } from '@/components/customer/footer'
import { HorizontalScrollSection } from '@/components/customer/horizontal-scroll-section'
import { CustomerNavbar } from '@/components/customer/navbar'
import { SchedulingMenuProductRails } from '@/components/customer/scheduling-menu-product-rails'
import { ScrollableSectionBreadcrumbs } from '@/components/customer/scrollable-section-breadcrumbs'
import { ServiceScrollCard } from '@/components/customer/service-scroll-card'
import { useCafe } from '@/lib/cafe-store'
import { useInventory } from '@/lib/inventory-store'
import { buildProductSectionsForSchedulingMenu } from '@/lib/product-scheduling-menu-sections'
import { collectServicesForSchedulingConsumerMenu } from '@/lib/scheduling-consumer-menu-services'
import {
  buildSchedulingMenuPageBrowseCrumbs,
  schedulingCategoriesForConsumerMenu,
} from '@/lib/scheduling-menu-browse'
import { buildSchedulingCategoryById } from '@/lib/scheduling-visibility'
import { useScheduling } from '@/lib/scheduling-store'

const LEARN_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'cat-learn-elementary':
    'Phonics, math foundations, handwriting, and supervised homework support.',
  'cat-learn-middle':
    'Pre-algebra, essay writing, science, and executive functioning skills.',
  'cat-learn-high-school':
    'STEM, humanities, and foreign language tracks for grades 9–12.',
  'cat-learn-test-prep-college':
    'SAT/ACT bootcamps and college essay writing intensives.',
  'cat-learn-test-prep-private-school':
    'ISEE, SSAT, HSPT, and COOP private school entrance prep.',
  'cat-learn-test-prep-adult':
    'GRE, GMAT, GED, HiSET, and ASVAB preparation for adults.',
  'cat-learn-enrichment-technology':
    'Coding for Kids, robotics clubs, and chess — logic and problem-solving beyond the classroom.',
  'cat-learn-enrichment-life-skills':
    'Financial literacy, public speaking, and debate for real-world confidence.',
  'cat-learn-enrichment-arts':
    'Creative writing and digital art workshops for young storytellers and designers.',
}

export default function LearnPage() {
  const { categories, services, slots, packages } = useScheduling()
  const { products, productCategories } = useInventory()
  const { cafeProducts } = useCafe()

  const categoryById = useMemo(() => buildSchedulingCategoryById(categories), [categories])

  const learnSchedulingCategories = useMemo(
    () => schedulingCategoriesForConsumerMenu('learn', categories),
    [categories],
  )

  const contentLearnSections = useMemo(() => {
    return learnSchedulingCategories
      .map((category) => ({
        id: category.id,
        title: category.name,
        description:
          LEARN_CATEGORY_DESCRIPTIONS[category.id] ??
          'Expert-led academic and enrichment programs.',
        services: collectServicesForSchedulingConsumerMenu(
          category,
          'learn',
          services,
          slots,
          packages,
          categoryById,
        ),
        membershipOffers: [] as const,
      }))
      .filter((section) => section.services.length > 0)
  }, [categoryById, learnSchedulingCategories, packages, services, slots])

  const productSections = useMemo(
    () =>
      buildProductSectionsForSchedulingMenu({
        menuSlug: 'learn',
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
        contentSections: contentLearnSections,
      }),
    [contentLearnSections, productSections],
  )

  return (
    <>
      <CustomerNavbar />
      <main>
        <section className="bg-primary py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">
              Discover
            </p>
            <h1
              className="text-4xl font-black tracking-tight text-primary-foreground sm:text-5xl"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              Learn
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-primary-foreground/80 md:text-base">
              Expert-led tutoring, test prep, and enrichment for every age — from K–12 core
              academics to adult graduate exams.
            </p>
          </div>
        </section>

        <section className="bg-background py-10">
          <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-foreground">Browse learn programs</h2>
              <ScrollableSectionBreadcrumbs items={breadcrumbItems} />
            </section>
            <SchedulingMenuProductRails menuSlug="learn" />
            {contentLearnSections.map((section) => (
              <div key={section.id} id={section.id}>
                <HorizontalScrollSection
                  title={section.title}
                  description={section.description}
                >
                  {section.services.map((service) => (
                    <ServiceScrollCard key={service.id} service={service} />
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
