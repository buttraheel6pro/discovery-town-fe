/** Discovery Town homepage — hero, explore cards, values strip, and footer bar. */
'use client'

import { CustomerNavbar } from '@/components/customer/navbar'
import { CatalogListingHighlightCards } from '@/components/customer/catalog-listing-highlight-cards'
import { CustomerFooter } from '@/components/customer/footer'
import { HomeExploreGrid } from '@/components/customer/home-explore-grid'
import { HomeHeroSection } from '@/components/customer/home-hero-section'
import { HomeValuesStrip } from '@/components/customer/home-values-strip'
import { useCustomerNavLabels } from '@/hooks/use-customer-nav-labels'
import { isCustomerNavItemVisible } from '@/lib/customer-nav-labels'

export default function HomePage() {
  const { labels, hidden } = useCustomerNavLabels()
  const showPlayCta = isCustomerNavItemVisible('play', hidden)

  return (
    <div className="overflow-x-clip">
      <CustomerNavbar priority />
      <main className="w-full max-w-none overflow-x-clip bg-white p-0">
        <HomeHeroSection
          playLabel={labels.play}
          eventsLabel={labels.events}
          showPlayCta={showPlayCta}
        />
        <section className="bg-white px-4 py-8 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-7xl">
            <CatalogListingHighlightCards />
          </div>
        </section>
        <HomeExploreGrid />
        <HomeValuesStrip />
      </main>
      <CustomerFooter />
    </div>
  )
}
