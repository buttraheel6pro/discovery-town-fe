/** Events page — Private Party Room & Open Play package cards. */
'use client'

import { useMemo } from 'react'

import { PrivateEventPackageCardsSection } from '@/components/customer/private-event-package-cards-section'
import {
  partyRoomPackagesFromCatalog,
  resolvePrivateEventBookingServiceId,
} from '@/lib/event-package-catalog'
import { useScheduling } from '@/lib/scheduling-store'

const PACKAGE_CARD_IMAGES: Record<string, string> = {
  'pkg-evt-room-001':
    'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1200&q=80',
  'pkg-evt-room-002':
    'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=1200&q=80',
  'pkg-evt-room-003':
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80',
}

const PACKAGE_PRICE_LABELS: Record<string, string> = {
  'pkg-evt-room-001': '$300',
  'pkg-evt-room-002': '$425 – $495',
  'pkg-evt-room-003': '$675 – $795',
}

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1200&q=80'

export function PrivatePartyRoomOpenPlaySection() {
  const { packages, services } = useScheduling()

  const bookingServiceId = useMemo(
    () => resolvePrivateEventBookingServiceId(services),
    [services],
  )

  const partyPackages = useMemo(
    () => partyRoomPackagesFromCatalog(packages),
    [packages],
  )

  if (partyPackages.length === 0 || bookingServiceId == null) {
    return null
  }

  return (
    <PrivateEventPackageCardsSection
      sectionId="private-party-room-open-play-heading"
      eyebrow="Private Party Room & Open Play"
      title="Private Party Room & Open Play"
      description="Choose a party room package with open play for every guest. Each tier includes setup, essentials, and general admission to the full play cafe."
      packages={partyPackages}
      bookingServiceId={bookingServiceId}
      cardImages={PACKAGE_CARD_IMAGES}
      priceLabels={PACKAGE_PRICE_LABELS}
      defaultImageUrl={DEFAULT_IMAGE}
    />
  )
}
