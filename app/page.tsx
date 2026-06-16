/** Discovery Town homepage — hero, explore cards, values strip, and footer bar. */
'use client'

import { CustomerNavbar } from '@/components/customer/navbar'
import { HomeExploreGrid } from '@/components/customer/home-explore-grid'
import { HomeHeroSection } from '@/components/customer/home-hero-section'
import { HomeValuesStrip } from '@/components/customer/home-values-strip'
import { useCustomerNavLabels } from '@/hooks/use-customer-nav-labels'
import { isCustomerNavItemVisible } from '@/lib/customer-nav-labels'

export default function HomePage() {
  const { labels, hidden } = useCustomerNavLabels()
  const showPlayCta = isCustomerNavItemVisible('play', hidden)

  return (
    <>
      <CustomerNavbar priority />
      <main className="w-full max-w-none overflow-x-hidden bg-white p-0">
        <HomeHeroSection
          playLabel={labels.play}
          eventsLabel={labels.events}
          showPlayCta={showPlayCta}
        />
        <HomeExploreGrid />
        <HomeValuesStrip />
      </main>
    </>
  )
}
