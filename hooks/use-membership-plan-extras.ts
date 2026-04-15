/** Resolves play add-on and coupon display lines for a membership plan from the client store. */
'use client'

import { useMemo } from 'react'

import { useClients } from '@/lib/client-store'
import { useInventory } from '@/lib/inventory-store'
import { coupons, membershipSchedulingAddonCatalog } from '@/lib/mock-data'
import {
  resolvePlanAddOnDisplayLines,
  resolvePlanCouponDisplayLines,
} from '@/lib/membership-helpers'

export interface MembershipPlanExtrasLines {
  readonly addOnLines: string[]
  readonly couponLines: string[]
}

export function useMembershipPlanExtras(planId: string): MembershipPlanExtrasLines {
  const { planAddOns, planCoupons } = useClients()
  const { bookingAddOns } = useInventory()

  return useMemo(
    () => ({
      addOnLines: resolvePlanAddOnDisplayLines(
        planId,
        planAddOns,
        bookingAddOns,
        membershipSchedulingAddonCatalog,
      ),
      couponLines: resolvePlanCouponDisplayLines(planId, planCoupons, coupons),
    }),
    [bookingAddOns, planAddOns, planCoupons, planId],
  )
}
