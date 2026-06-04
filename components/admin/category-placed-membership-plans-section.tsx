/** Admin — membership plans placed on a Play / Gym / Events sub-category. */
'use client'

import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useClients } from '@/lib/client-store'
import { filterPlansForPlacement } from '@/lib/membership-placement'
import type { MembershipDisplayPage } from '@/lib/membership-placement'
import { formatPrice } from '@/lib/utils'

export interface CategoryPlacedMembershipPlansSectionProps {
  readonly page: MembershipDisplayPage
  readonly categoryId: string
  readonly categoryName: string
  readonly className?: string
}

export function CategoryPlacedMembershipPlansSection({
  page,
  categoryId,
  categoryName,
  className,
}: Readonly<CategoryPlacedMembershipPlansSectionProps>) {
  const { membershipPlans } = useClients()

  const placedPlans = filterPlansForPlacement(membershipPlans, page, categoryId)

  if (placedPlans.length === 0) {
    return null
  }

  return (
    <section className={className}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">Membership plans</h3>
          <p className="text-xs text-muted-foreground">
            Plans with placement on {categoryName}. Managed in Memberships — not
            scheduling services.
          </p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/admin/memberships">Manage memberships</Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {placedPlans.map((plan) => (
          <Card key={plan.id}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-foreground">{plan.name}</p>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {plan.billingCycle}
                </Badge>
              </div>
              {plan.description ? (
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {plan.description}
                </p>
              ) : null}
              <p className="text-xs font-semibold text-muted-foreground">
                {formatPrice(plan.price)} / cycle
                {!plan.isActive ? ' · Inactive' : ''}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
