/** Open Play membership / seasonal pass offers — driven by membership placement, not scheduling SKUs. */
import {
  filterMembershipPlansForPassKind,
  OPEN_PLAY_MEMBERSHIP_PASS_SERVICE_ID,
  OPEN_PLAY_SEASONAL_PASS_SERVICE_ID,
  type OpenPlayPassCatalogKind,
} from '@/lib/open-play-pass-catalog'
import type { MembershipPlan, SchedulingCategory, SchedulingService } from '@/lib/types'

export interface OpenPlayMembershipOffer {
  readonly id: string
  readonly kind: OpenPlayPassCatalogKind
  readonly name: string
  readonly description: string
  readonly imageUrl: string
  readonly categoryId: 'cat-open-play'
  readonly categoryName: string
  readonly amenities: readonly string[]
  readonly fallbackBasePrice: number
  readonly priceSuffix: string
}

export const OPEN_PLAY_MEMBERSHIP_OFFERS: readonly OpenPlayMembershipOffer[] = [
  {
    id: OPEN_PLAY_MEMBERSHIP_PASS_SERVICE_ID,
    kind: 'membership',
    name: 'Membership Pass',
    description:
      'Unlimited play with monthly or annual household membership plans. No time slots required — visit during open play hours anytime.',
    imageUrl:
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1200&q=80',
    categoryId: 'cat-open-play',
    categoryName: 'Open Play',
    amenities: [
      'Unlimited play',
      'Member party discounts',
      'Complimentary grip socks',
      'Merchandise discount',
      'Advance reservations',
    ],
    fallbackBasePrice: 45,
    priceSuffix: '/mo',
  },
  {
    id: OPEN_PLAY_SEASONAL_PASS_SERVICE_ID,
    kind: 'seasonal',
    name: 'Seasonal Pass',
    description:
      'Unlimited play for 3 months with seasonal household passes. No time slots required — visit during open play hours anytime.',
    imageUrl:
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
    categoryId: 'cat-open-play',
    categoryName: 'Open Play',
    amenities: [
      '3 months unlimited play',
      'Household children only',
      'Member party discounts',
      'Complimentary grip socks',
      'Advance reservations',
    ],
    fallbackBasePrice: 130,
    priceSuffix: '/season',
  },
] as const

export function getOpenPlayMembershipOffer(
  serviceId: string,
): OpenPlayMembershipOffer | undefined {
  return OPEN_PLAY_MEMBERSHIP_OFFERS.find((offer) => offer.id === serviceId)
}

export function isOpenPlayMembershipOfferId(serviceId: string): boolean {
  return getOpenPlayMembershipOffer(serviceId) != null
}

export function resolveOfferDisplayPrice(
  plans: readonly MembershipPlan[],
  kind: OpenPlayPassCatalogKind,
): { readonly price: number; readonly suffix: string } {
  const placed = filterMembershipPlansForPassKind(plans, kind, 'play', 'cat-open-play')
  if (placed.length === 0) {
    const offer = OPEN_PLAY_MEMBERSHIP_OFFERS.find((entry) => entry.kind === kind)
    return {
      price: offer?.fallbackBasePrice ?? 0,
      suffix: offer?.priceSuffix ?? '',
    }
  }
  if (kind === 'seasonal') {
    const min = Math.min(...placed.map((plan) => plan.price))
    return { price: min, suffix: '/season' }
  }
  const monthly = placed.filter((plan) => plan.billingCycle === 'MONTHLY')
  const pool = monthly.length > 0 ? monthly : placed
  const min = Math.min(...pool.map((plan) => plan.price))
  return { price: min, suffix: '/mo' }
}

/** Offers that have at least one active plan placed on Play → Open Play. */
export function visibleOpenPlayMembershipOffers(
  plans: readonly MembershipPlan[],
): OpenPlayMembershipOffer[] {
  return OPEN_PLAY_MEMBERSHIP_OFFERS.filter(
    (offer) =>
      filterMembershipPlansForPassKind(plans, offer.kind, 'play', 'cat-open-play').length > 0,
  )
}

export function buildPassCatalogSchedulingService(
  offer: OpenPlayMembershipOffer,
  category: SchedulingCategory,
  displayPrice: number,
): SchedulingService {
  return {
    id: offer.id,
    locationId: 'loc-1',
    categoryId: offer.categoryId,
    category,
    serviceType: 'OPEN_PLAY',
    bookingMode: 'OPEN',
    name: offer.name,
    description: offer.description,
    durationMinutes: 0,
    capacity: 40,
    basePrice: displayPrice,
    subscriptionPrice: null,
    requiresWaiver: false,
    ageMin: 0,
    ageMax: 12,
    isActive: true,
    minDurationMinutes: null,
    maxDurationMinutes: null,
    slotIncrementMinutes: null,
    maxConcurrent: null,
    minAdvanceHours: null,
    maxAdvanceHours: null,
    pricingModel: 'flat',
    imageUrl: offer.imageUrl,
    tags: [`open-play`, `${offer.kind}-pass`],
    sport: 'OPEN_PLAY',
    amenities: [...offer.amenities],
    addOns: [],
  }
}
