/** Unified Gym page with sectioned, horizontally scrollable service rails. */
'use client'

import { useMemo } from 'react'

import { CustomerFooter } from '@/components/customer/footer'
import { HorizontalScrollSection } from '@/components/customer/horizontal-scroll-section'
import { CustomerNavbar } from '@/components/customer/navbar'
import { ScrollableSectionBreadcrumbs } from '@/components/customer/scrollable-section-breadcrumbs'
import { ServiceScrollCard } from '@/components/customer/service-scroll-card'
import {
  buildSchedulingCategoryById,
  isConsumerListedSchedulingService,
  isConsumerVisibleSchedulingCategory,
} from '@/lib/scheduling-visibility'
import { useScheduling } from '@/lib/scheduling-store'

const GYM_CATEGORY_DESCRIPTIONS: Record<string, string> = {
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
}

export default function GymPage() {
  const { categories, services, slots } = useScheduling()

  const categoryById = useMemo(() => buildSchedulingCategoryById(categories), [categories])

  const sectionServices = useMemo(
    () =>
      categories
        .filter(
          (category) =>
            isConsumerVisibleSchedulingCategory(category) &&
            category.id.startsWith('cat-gym-'),
        )
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((category) => ({
          id: category.id,
          title: category.name,
          description: GYM_CATEGORY_DESCRIPTIONS[category.id] ?? 'Fitness experiences for every age.',
          services: services.filter(
            (service) =>
              service.categoryId === category.id &&
              isConsumerListedSchedulingService(service, categoryById, slots),
          ),
        }))
        .filter((section) => section.services.length > 0),
    [categories, categoryById, services, slots],
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
            {sectionServices.map((section) => (
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
