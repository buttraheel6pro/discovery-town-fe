/** Events page — Whole Place Private Party & Open Play package cards. */
'use client'

import { useMemo } from 'react'

import { PrivateEventPackageCardsSection } from '@/components/customer/private-event-package-cards-section'
import {
  resolveWholeVenuePrivateEventBookingServiceId,
  wholeVenuePackagesFromCatalog,
} from '@/lib/event-package-catalog'
import { useScheduling } from '@/lib/scheduling-store'

const PACKAGE_CARD_IMAGES: Record<string, string> = {
  'pkg-004':
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=80',
  'pkg-005':
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=80',
  'pkg-006':
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&q=80',
}

const PACKAGE_PRICE_LABELS: Record<string, string> = {
  'pkg-004': '$2,095 – $2,395',
  'pkg-005': '$3,100 – $3,500',
  'pkg-006': '$4,500 – $4,995',
}

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=80'

export function WholePlacePrivatePartyOpenPlaySection() {
  const { packages, services } = useScheduling()

  const bookingServiceId = useMemo(
    () => resolveWholeVenuePrivateEventBookingServiceId(services),
    [services],
  )

  const venuePackages = useMemo(
    () => wholeVenuePackagesFromCatalog(packages),
    [packages],
  )

  if (venuePackages.length === 0 || bookingServiceId == null) {
    return null
  }

  return (
    <PrivateEventPackageCardsSection
      sectionId="whole-place-private-party-open-play-heading"
      eyebrow="The Whole Place Private Party & Open Play"
      title="The Whole Place Private Party & Open Play"
      description="Reserve the entire facility with dedicated staff, premium catering options, and exclusive access for your whole group."
      packages={venuePackages}
      bookingServiceId={bookingServiceId}
      cardImages={PACKAGE_CARD_IMAGES}
      priceLabels={PACKAGE_PRICE_LABELS}
      defaultImageUrl={DEFAULT_IMAGE}
    />
  )
}
