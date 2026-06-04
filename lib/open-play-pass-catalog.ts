/** Open Play pass catalog — membership & seasonal offers (no slot booking). */
import { filterPlansForPlacement } from '@/lib/membership-placement'
import type { MembershipDisplayPage } from '@/lib/membership-placement'
import type { MembershipPlan, SchedulingService } from '@/lib/types'

export const OPEN_PLAY_MEMBERSHIP_PASS_SERVICE_ID = 'svc-open-play-membership-pass' as const
export const OPEN_PLAY_SEASONAL_PASS_SERVICE_ID = 'svc-open-play-seasonal-pass' as const

export type OpenPlayPassCatalogKind = 'membership' | 'seasonal'

const PASS_SERVICE_ID_TO_KIND: Record<string, OpenPlayPassCatalogKind> = {
  [OPEN_PLAY_MEMBERSHIP_PASS_SERVICE_ID]: 'membership',
  [OPEN_PLAY_SEASONAL_PASS_SERVICE_ID]: 'seasonal',
}

export function getOpenPlayPassCatalogKind(
  service: SchedulingService,
): OpenPlayPassCatalogKind | null {
  return PASS_SERVICE_ID_TO_KIND[service.id] ?? null
}

export function isOpenPlayPassCatalogServiceId(serviceId: string): boolean {
  return serviceId in PASS_SERVICE_ID_TO_KIND
}

export function isOpenPlayPassCatalogService(service: SchedulingService): boolean {
  return isOpenPlayPassCatalogServiceId(service.id)
}

/** Membership / seasonal passes are not schedulable services — exclude from admin + session rails. */
export function withoutOpenPlayPassCatalogServices(
  services: readonly SchedulingService[],
): SchedulingService[] {
  return services.filter((service) => !isOpenPlayPassCatalogService(service))
}

export function filterMembershipPlansForPassKind(
  plans: readonly MembershipPlan[],
  kind: OpenPlayPassCatalogKind,
  page: MembershipDisplayPage = 'play',
  categoryId = 'cat-open-play',
): MembershipPlan[] {
  const placed = filterPlansForPlacement(plans, page, categoryId)
  if (kind === 'seasonal') {
    return placed.filter((plan) => plan.billingCycle === 'QUARTERLY')
  }
  return placed.filter(
    (plan) => plan.billingCycle === 'MONTHLY' || plan.billingCycle === 'ANNUAL',
  )
}
