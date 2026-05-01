/** Admin coupon create page using the same fields as the previous create modal. */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { CouponForm, type CouponDraft, draftToCouponPatch } from '@/components/admin/coupon-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useInventory } from '@/lib/inventory-store'
import type { Coupon } from '@/lib/types'

function defaultCouponDraft(): CouponDraft {
  const now = new Date()
  const from = new Date(now.getTime() - 86400000).toISOString()
  const until = new Date(now.getTime() + 86400000 * 30).toISOString()
  return {
    code: '',
    name: '',
    description: '',
    type: 'PERCENTAGE',
    value: '',
    usageLimit: '',
    perContactLimit: '',
    validFrom: from,
    validUntil: until,
    requiresSubscription: false,
    isActive: true,
    applicableToShop: true,
    applicableToBooking: false,
    applicableToMembership: false,
  }
}

export default function AdminInventoryCouponsNewPage() {
  const router = useRouter()
  const { addCoupon } = useInventory()
  const [draft, setDraft] = useState<CouponDraft>(defaultCouponDraft)

  function persistCreate() {
    const patch = draftToCouponPatch(draft)
    const created: Coupon = {
      id: `coupon-admin-${Date.now()}`,
      tenantId: 'tenant-1',
      code: patch.code ?? 'NEW',
      name: patch.name ?? 'New coupon',
      description: patch.description,
      type: patch.type ?? 'PERCENTAGE',
      value: patch.value ?? 0,
      usageLimit: patch.usageLimit,
      usageCount: 0,
      validFrom: patch.validFrom ?? new Date().toISOString(),
      validUntil: patch.validUntil ?? new Date().toISOString(),
      requiresSubscription: patch.requiresSubscription ?? false,
      applicableTo: patch.applicableTo ?? ['SHOP'],
      isActive: patch.isActive ?? true,
      perContactLimit: patch.perContactLimit,
      restrictToTagId: patch.restrictToTagId,
    }
    addCoupon(created)
    router.push('/admin/inventory/coupons')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">New coupon</h1>
          <p className="text-muted-foreground mt-2">
            Create a coupon code for shop or booking discounts.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coupon details</CardTitle>
          <CardDescription>Use the same fields as the previous modal flow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <CouponForm value={draft} onChange={setDraft} />
          <div className="flex items-center justify-end gap-2">
            <Link href="/admin/inventory/coupons">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={persistCreate}>Create</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
