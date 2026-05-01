/** Unified Play page with sectioned, horizontally scrollable service rails. */
'use client'

import { useMemo } from 'react'

import { CustomerFooter } from '@/components/customer/footer'
import { HorizontalScrollSection } from '@/components/customer/horizontal-scroll-section'
import { CustomerNavbar } from '@/components/customer/navbar'
import { PromoLinkGridSection } from '@/components/customer/promo-link-grid-section'
import { ScrollableSectionBreadcrumbs } from '@/components/customer/scrollable-section-breadcrumbs'
import { ServiceScrollCard } from '@/components/customer/service-scroll-card'
import { hasAssignedConsumerSlot } from '@/lib/scheduling-visibility'
import { useScheduling } from '@/lib/scheduling-store'

const PLAY_CATEGORY_IDS = new Set<string>([
  'cat-open-play',
  'cat-private-play',
  'cat-special-play-events',
  'cat-camps-play',
  'cat-parents-night',
  'cat-field-trips',
])

const PLAY_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'cat-open-play': '2-hour pass, sibling pass, and multi-pass options for everyday play.',
  'cat-private-play': 'Private room, full venue takeover, and meeting-room conference options.',
  'cat-special-play-events':
    'Character, holiday, seasonal, and skill-building festival programmes.',
  'cat-camps-play': 'Summer, winter break, spring break, and MLK day camp options.',
  'cat-parents-night': 'Saturday 4-7 PM supervised care for ages 6 months to 7 years.',
  'cat-field-trips': 'Structured group experiences for schools and organizations.',
}

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
  const { categories, services, slots } = useScheduling()

  const sectionServices = useMemo(
    () =>
      categories
        .filter(
          (category) =>
            PLAY_CATEGORY_IDS.has(category.id) || category.id.startsWith('cat-play-'),
        )
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((category) => ({
          id: category.id,
          title: category.name,
          description: PLAY_CATEGORY_DESCRIPTIONS[category.id] ?? 'Discover play experiences.',
        services: services.filter(
          (service) =>
              service.isActive &&
              service.categoryId === category.id &&
            hasAssignedConsumerSlot(service, slots),
        ),
        }))
        .filter((section) => section.services.length > 0),
    [categories, services, slots],
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
                </HorizontalScrollSection>
              </div>
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
