/** Unified Play page with sectioned, horizontally scrollable service rails. */
'use client'

import { useMemo } from 'react'

import { CustomerFooter } from '@/components/customer/footer'
import { HorizontalScrollSection } from '@/components/customer/horizontal-scroll-section'
import { CustomerNavbar } from '@/components/customer/navbar'
import { PromoLinkGridSection } from '@/components/customer/promo-link-grid-section'
import { ServiceScrollCard } from '@/components/customer/service-scroll-card'
import { useScheduling } from '@/lib/scheduling-store'
import type { SchedulingService } from '@/lib/types'

interface PlaySectionDefinition {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly match: (service: SchedulingService) => boolean
}

const PLAY_SECTIONS: readonly PlaySectionDefinition[] = [
  {
    id: 'open-play',
    title: 'Open Play',
    description: '2-hour pass, sibling pass, and multi-pass options for everyday play.',
    match: (service) => service.isActive && service.categoryId === 'cat-open-play',
  },
  {
    id: 'private-play',
    title: 'Private Play',
    description: 'Private room, full venue takeover, and meeting-room conference options.',
    match: (service) => service.isActive && service.categoryId === 'cat-private-play',
  },
  {
    id: 'special-play-events',
    title: 'Special Play Events',
    description: 'Character, holiday, seasonal, and skill-building festival programmes.',
    match: (service) => service.isActive && service.categoryId === 'cat-special-play-events',
  },
  {
    id: 'camps',
    title: 'CAMPS',
    description: 'Summer, winter break, spring break, and MLK day camp options.',
    match: (service) => service.isActive && service.categoryId === 'cat-camps-play',
  },
  {
    id: 'parents-night',
    title: 'Parents Night Out',
    description: 'Saturday 4-7 PM supervised care for ages 6 months to 7 years.',
    match: (service) => service.isActive && service.categoryId === 'cat-parents-night',
  },
  {
    id: 'field-trips',
    title: 'Field Trips',
    description: 'Structured group experiences for schools and organizations.',
    match: (service) => service.isActive && service.categoryId === 'cat-field-trips',
  },
]

const WE_BRING_PLAY_ITEMS = [
  {
    id: 'play-soft-play-zones',
    title: 'Soft Play Zones',
    imageUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=1200&q=80',
    href: '/we-bring-to-play',
  },
  {
    id: 'play-mobile-sensory-stations',
    title: 'Mobile Sensory Stations',
    imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1200&q=80',
    href: '/we-bring-to-play',
  },
  {
    id: 'play-active-game-coaches',
    title: 'Active Game Coaches',
    imageUrl: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=1200&q=80',
    href: '/we-bring-to-play',
  },
  {
    id: 'play-travel-play-kits',
    title: 'Travel Play Kits',
    imageUrl: 'https://images.unsplash.com/photo-1516626891537-bbfbbd5f6cdd?w=1200&q=80',
    href: '/we-bring-to-play',
  },
] as const

export default function PlayPage() {
  const { services } = useScheduling()

  const sectionServices = useMemo(
    () =>
      PLAY_SECTIONS.map((section) => ({
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
              Play
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-primary-foreground/80 md:text-base">
              Explore every way to play at Discovery Town, from open sessions to private experiences.
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
                    New experiences are coming soon for this section.
                  </div>
                ) : (
                  section.services.map((service) => (
                    <ServiceScrollCard key={service.id} service={service} />
                  ))
                )}
              </HorizontalScrollSection>
            ))}

            <PromoLinkGridSection
              eyebrow="We Bring Play To You"
              title="The Play Comes to You"
              description="Can’t come to us? We bring mobile play experiences to your home, school, or venue."
              items={WE_BRING_PLAY_ITEMS}
              ctaLabel="Book Now"
              ctaHref="/we-bring-to-play"
            />
          </div>
        </section>
      </main>
      <CustomerFooter />
    </>
  )
}
