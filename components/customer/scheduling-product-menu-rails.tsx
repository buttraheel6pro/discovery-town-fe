/** Horizontal scheduling sections for store / rentals menus (placement-aware). */
'use client'

import { useMemo } from 'react'

import { EventPackageScrollCard } from '@/components/customer/event-package-scroll-card'
import { HorizontalScrollSection } from '@/components/customer/horizontal-scroll-section'
import { OpenPlayMembershipOfferCard } from '@/components/customer/open-play-membership-offer-card'
import { ServiceScrollCard } from '@/components/customer/service-scroll-card'
import { useClients } from '@/lib/client-store'
import { useInventory } from '@/lib/inventory-store'
import { buildSchedulingSectionsForProductMenu } from '@/lib/scheduling-product-menu-sections'
import { useScheduling } from '@/lib/scheduling-store'

interface SchedulingProductMenuRailsProps {
  readonly productType: string
}

export function SchedulingProductMenuRails({
  productType,
}: SchedulingProductMenuRailsProps) {
  const { productCategories } = useInventory()
  const { categories, services, slots, packages } = useScheduling()
  const { membershipPlans } = useClients()

  const sections = useMemo(
    () =>
      buildSchedulingSectionsForProductMenu({
        productType,
        productCategories,
        schedulingCategories: categories,
        services,
        slots,
        packages,
        plans: membershipPlans,
      }),
    [
      categories,
      membershipPlans,
      packages,
      productCategories,
      productType,
      services,
      slots,
    ],
  )

  if (sections.length === 0) {
    return null
  }

  return (
    <>
      {sections.map((section) => (
        <div
          key={`scheduling-${section.id}`}
          id={`scheduling-${section.id}`}
          className="scroll-mt-32"
        >
          <HorizontalScrollSection title={section.title} description={section.description}>
            {section.scrollItems.map((item) =>
              item.kind === 'package' ? (
                <EventPackageScrollCard
                  key={item.pkg.id}
                  pkg={item.pkg}
                  bookingService={item.bookingService}
                />
              ) : (
                <ServiceScrollCard key={item.service.id} service={item.service} />
              ),
            )}
            {section.membershipOffers.map((offer) => (
              <OpenPlayMembershipOfferCard key={offer.id} offer={offer} />
            ))}
          </HorizontalScrollSection>
        </div>
      ))}
    </>
  )
}
