/** Unified Gym page with sectioned, horizontally scrollable service rails. */
'use client'

import { useMemo } from 'react'

import { CustomerFooter } from '@/components/customer/footer'
import { HorizontalScrollSection } from '@/components/customer/horizontal-scroll-section'
import { CustomerNavbar } from '@/components/customer/navbar'
import { ServiceScrollCard } from '@/components/customer/service-scroll-card'
import { useScheduling } from '@/lib/scheduling-store'
import type { SchedulingService } from '@/lib/types'

interface GymSectionDefinition {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly match: (service: SchedulingService) => boolean
}

const GYM_SECTIONS: readonly GymSectionDefinition[] = [
  {
    id: 'gym-babies',
    title: 'Babies',
    description: 'Sensory-rich exploration, soft surfaces, and early motor milestones.',
    match: (service) => service.isActive && service.categoryId === 'cat-gym-babies',
  },
  {
    id: 'gym-toddlers',
    title: 'Toddlers',
    description: 'Parent-guided movement, balance basics, and social play routines.',
    match: (service) => service.isActive && service.categoryId === 'cat-gym-toddlers',
  },
  {
    id: 'gym-preschool',
    title: 'Preschool (3–5 years)',
    description: 'Gymnastics vocabulary, agility, multi-sport sampling, and story-led movement.',
    match: (service) => service.isActive && service.categoryId === 'cat-gym-preschool',
  },
  {
    id: 'gym-kids',
    title: 'Grade School (6–12 years)',
    description:
      'Focus: technique, discipline, teamwork, and confidence building. Gymnastics, ninja, sports skills, and interactive fitness.',
    match: (service) => service.isActive && service.categoryId === 'cat-gym-kids',
  },
  {
    id: 'gym-teens',
    title: 'Teens (13–17)',
    description:
      'Focus: athletic performance, stress relief, and functional strength. Strength, tumbling, ninja, and varsity prep tracks.',
    match: (service) => service.isActive && service.categoryId === 'cat-gym-teens',
  },
  {
    id: 'gym-adults',
    title: 'Adults (18–65 years)',
    description:
      'Focus: cardiovascular health, mobility, and strength. Classes are often scheduled concurrently with kid programmes.',
    match: (service) => service.isActive && service.categoryId === 'cat-gym-adults',
  },
  {
    id: 'gym-seniors',
    title: 'Seniors (65+)',
    description: 'Low-impact strength, cardio, and mobility programs.',
    match: (service) => service.isActive && service.categoryId === 'cat-gym-seniors',
  },
  {
    id: 'gym-family',
    title: 'Family Fitness',
    description: 'Concurrent programming for parents and children together.',
    match: (service) => service.isActive && service.categoryId === 'cat-gym-family',
  },
  {
    id: 'gym-prenatal',
    title: 'Pregnant & Nursing Mother',
    description: 'Prenatal-safe and postnatal recovery focused classes.',
    match: (service) => service.isActive && service.categoryId === 'cat-gym-prenatal',
  },
  {
    id: 'gym-special-needs',
    title: 'Special Needs Classes',
    description: 'Inclusive, adaptive fitness sessions for every learner.',
    match: (service) => service.isActive && service.categoryId === 'cat-gym-special-needs',
  },
]

export default function GymPage() {
  const { services } = useScheduling()

  const sectionServices = useMemo(
    () =>
      GYM_SECTIONS.map((section) => ({
        ...section,
        services: services.filter(section.match),
      })),
    [services],
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
            {sectionServices.map((section) => (
              <HorizontalScrollSection
                key={section.id}
                title={section.title}
                description={section.description}
              >
                {section.services.length === 0 ? (
                  <div className="flex h-[240px] w-full min-w-[280px] items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 text-center text-sm text-muted-foreground">
                    New gym sessions are coming soon for this section.
                  </div>
                ) : (
                  section.services.map((service) => (
                    <ServiceScrollCard key={service.id} service={service} />
                  ))
                )}
              </HorizontalScrollSection>
            ))}
          </div>
        </section>
      </main>
      <CustomerFooter />
    </>
  )
}
