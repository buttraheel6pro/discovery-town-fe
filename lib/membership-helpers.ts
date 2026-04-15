/** Helpers for grouping dual-billing membership plans and resolving add-on labels. */
import type {
  AddOn,
  Coupon,
  MembershipPlan,
  PlanAddOn,
  PlanCoupon,
  SchedulingServiceAddOn,
} from '@/lib/types'

export interface MembershipCatalogEntry {
  readonly planGroupId: string
  readonly displayName: string
  readonly monthlyPlan: MembershipPlan | null
  readonly annualPlan: MembershipPlan | null
  readonly standalonePlan: MembershipPlan | null
}

function baseDisplayName(plan: MembershipPlan): string {
  return plan.name.replace(/\s+-\s+(Monthly|Annual)$/i, '').trim()
}

/**
 * One row per product: paired monthly/annual share planGroupId; otherwise standalone.
 */
export function buildMembershipCatalog(plans: MembershipPlan[]): MembershipCatalogEntry[] {
  const active = plans.filter((p) => p.isActive)
  const byGroup = new Map<string, MembershipPlan[]>()
  const ungrouped: MembershipPlan[] = []

  for (const p of active) {
    if (p.planGroupId) {
      const list = byGroup.get(p.planGroupId) ?? []
      list.push(p)
      byGroup.set(p.planGroupId, list)
    } else {
      ungrouped.push(p)
    }
  }

  const rows: MembershipCatalogEntry[] = []

  for (const [groupId, groupPlans] of byGroup) {
    const monthlyPlan = groupPlans.find((p) => p.billingCycle === 'MONTHLY') ?? null
    const annualPlan = groupPlans.find((p) => p.billingCycle === 'ANNUAL') ?? null
    const canonical = monthlyPlan ?? annualPlan ?? groupPlans[0]
    rows.push({
      planGroupId: groupId,
      displayName: baseDisplayName(canonical),
      monthlyPlan,
      annualPlan,
      standalonePlan: null,
    })
  }

  for (const p of ungrouped) {
    rows.push({
      planGroupId: p.id,
      displayName: p.name,
      monthlyPlan: null,
      annualPlan: null,
      standalonePlan: p,
    })
  }

  return rows
}

export function annualSavingsVsMonthly(monthlyPrice: number, annualPrice: number): number {
  return Math.round((monthlyPrice * 12 - annualPrice) * 100) / 100
}

export interface MembershipAddonCatalogItem {
  readonly id: string
  readonly name: string
}

export function resolveMembershipAddonName(
  addOnId: string,
  bookingAddOns: readonly AddOn[],
  schedulingAddOns: readonly SchedulingServiceAddOn[],
): string {
  const fromBooking = bookingAddOns.find((a) => a.id === addOnId)
  if (fromBooking) return fromBooking.name
  const fromScheduling = schedulingAddOns.find((a) => a.id === addOnId)
  if (fromScheduling) return fromScheduling.name
  return addOnId
}

/** Single-line label for a plan add-on row (included / discount hints). */
export function formatPlanAddOnDisplay(row: PlanAddOn, resolvedName: string): string {
  const bits: string[] = []
  if (row.isIncluded) {
    bits.push('included')
  }
  if (row.discountPercent != null && row.discountPercent > 0) {
    bits.push(`${row.discountPercent}% off`)
  }
  if (bits.length === 0) {
    return resolvedName
  }
  return `${resolvedName} (${bits.join(' · ')})`
}

/** Display lines for play add-ons linked to a plan SKU. */
export function resolvePlanAddOnDisplayLines(
  planId: string,
  planAddOns: readonly PlanAddOn[],
  bookingAddOns: readonly AddOn[],
  schedulingAddOns: readonly SchedulingServiceAddOn[],
): string[] {
  return planAddOns
    .filter((r) => r.planId === planId)
    .map((r) => {
      const name = resolveMembershipAddonName(r.addOnId, bookingAddOns, schedulingAddOns)
      return formatPlanAddOnDisplay(r, name)
    })
}

/** Short coupon labels (code preferred) for plan-linked coupons. */
export function resolvePlanCouponDisplayLines(
  planId: string,
  planCoupons: readonly PlanCoupon[],
  couponCatalog: readonly Coupon[],
): string[] {
  return planCoupons
    .filter((r) => r.planId === planId)
    .map((r) => {
      const c = couponCatalog.find((x) => x.id === r.couponId)
      if (!c) {
        return r.couponId
      }
      return c.code || c.name
    })
}

/** Catalog coupons linked to a membership plan SKU (admin `planCoupons`). */
export function getLinkedCouponsForPlan(
  planId: string,
  planCoupons: readonly PlanCoupon[],
  couponCatalog: readonly Coupon[],
): Coupon[] {
  const seen = new Set<string>()
  const out: Coupon[] = []
  for (const row of planCoupons) {
    if (row.planId !== planId || seen.has(row.couponId)) {
      continue
    }
    seen.add(row.couponId)
    const c = couponCatalog.find((x) => x.id === row.couponId)
    if (c) {
      out.push(c)
    }
  }
  return out
}
