/** Consumer scheduling detail page URLs — shared by rails, play list, and cards. */
import { getCustomerEventScheduleDetailHref } from '@/lib/event-booking-schedule'
import { isLearnSchedulingService } from '@/lib/learn-catalog'
import { shouldUsePrivatePlayDetailLayout } from '@/lib/private-play-packages'
import { isPassOffering } from '@/lib/scheduling-listing-kind'
import { usesEventTicketBookingSidebar } from '@/lib/scheduling-slot-availability'
import type { EventPackage, SchedulingService } from '@/lib/types'

export function getSchedulingConsumerDetailHref(
  service: SchedulingService,
  packages: readonly EventPackage[],
): string {
  if (isPassOffering(service)) {
    return `/facilities/${service.id}`
  }
  if (shouldUsePrivatePlayDetailLayout(service, packages)) {
    return `/facilities/${service.id}`
  }
  if (usesEventTicketBookingSidebar(service)) {
    return `/events/${service.id}`
  }
  if (service.categoryId === 'cat-we-bring-play') {
    return '/play#product-menu-pcat-we-bring-party'
  }

  const eventScheduleHref = getCustomerEventScheduleDetailHref(service)
  if (
    eventScheduleHref &&
    !isPassOffering(service) &&
    !shouldUsePrivatePlayDetailLayout(service, packages)
  ) {
    return eventScheduleHref
  }

  if (
    service.serviceType === 'OPEN_PLAY' ||
    service.serviceType === 'COURT_BOOKING' ||
    service.serviceType === 'PRIVATE_HIRE'
  ) {
    return `/facilities/${service.id}`
  }

  if (isLearnSchedulingService(service)) {
    return `/learn/${service.id}`
  }

  if (
    service.serviceType === 'GYM_CLASS' ||
    service.serviceType === 'SWIM_CLASS' ||
    service.serviceType === 'COACHING_SESSION' ||
    service.serviceType === 'FITNESS_ASSESSMENT'
  ) {
    return `/classes/${service.id}`
  }

  return `/events/${service.id}`
}

/** Membership / seasonal catalog entries use the same facility detail route. */
export function getOpenPlayMembershipOfferDetailHref(offerId: string): string {
  return `/facilities/${offerId}`
}
