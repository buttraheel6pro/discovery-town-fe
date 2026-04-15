/** Client section for public /membership — catalog toggle and plan cards. */
'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

import { ListingCard } from '@/components/customer/listing-card'
import { MembershipPlanExtrasCompact } from '@/components/customer/membership-plan-extras-compact'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useClients } from '@/lib/client-store'
import { useInventory } from '@/lib/inventory-store'
import { coupons, membershipSchedulingAddonCatalog } from '@/lib/mock-data'
import {
  annualSavingsVsMonthly,
  buildMembershipCatalog,
  resolvePlanAddOnDisplayLines,
  resolvePlanCouponDisplayLines,
} from '@/lib/membership-helpers'
import { cn } from '@/lib/utils'

export function MembershipMarketingClient() {
  const { membershipPlans, planAddOns, planCoupons } = useClients()
  const { bookingAddOns } = useInventory()
  const [billingAnnual, setBillingAnnual] = useState(false)

  const catalog = useMemo(
    () => buildMembershipCatalog(membershipPlans),
    [membershipPlans],
  )

  const planExtrasByPlanId = useMemo(() => {
    const m = new Map<string, { addOnLines: string[]; couponLines: string[] }>()
    for (const p of membershipPlans) {
      m.set(p.id, {
        addOnLines: resolvePlanAddOnDisplayLines(
          p.id,
          planAddOns,
          bookingAddOns,
          membershipSchedulingAddonCatalog,
        ),
        couponLines: resolvePlanCouponDisplayLines(p.id, planCoupons, coupons),
      })
    }
    return m
  }, [bookingAddOns, membershipPlans, planAddOns, planCoupons])

  const displayCatalog = useMemo(() => {
    const featured = catalog.filter(
      (r) =>
        r.monthlyPlan?.isFeatured ||
        r.annualPlan?.isFeatured ||
        r.standalonePlan?.isFeatured,
    )
    return featured.length > 0 ? featured : catalog
  }, [catalog])

  const imageUrl =
    'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&q=80'

  return (
    <>
      <section className="bg-primary text-primary-foreground py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/70">
            Membership
          </p>
          <h1
            className="text-3xl md:text-4xl font-black tracking-tight"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            One membership, endless family adventures
          </h1>
          <p className="max-w-2xl mx-auto text-primary-foreground/80 text-sm md:text-base">
            Choose monthly, annual, or seasonal unlimited play plans with family-focused savings
            and everyday perks.
          </p>
          <Link href="/account/membership">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            >
              Manage membership in your account
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2
              className="text-xl font-bold text-foreground"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              Compare plans
            </h2>
            <div
              className="inline-flex rounded-full border border-border bg-muted/50 p-1"
              role="group"
              aria-label="Billing period"
            >
              <button
                type="button"
                onClick={() => setBillingAnnual(false)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  !billingAnnual
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground',
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingAnnual(true)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  billingAnnual
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground',
                )}
              >
                Annual
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayCatalog.map((row) => {
              if (row.standalonePlan) {
                const p = row.standalonePlan
                return (
                  <ListingCard
                    key={p.id}
                    href="/account/membership"
                    title={p.name}
                    description={p.description}
                    imageUrl={imageUrl}
                    topLeft={
                      <div className="flex flex-col gap-1">
                        {p.seasonalBadge ? (
                          <Badge className="w-fit border-sky-400/80 bg-sky-500/90 text-[10px] font-bold text-white">
                            {p.seasonalBadge}
                          </Badge>
                        ) : null}
                        {p.isHouseholdOnly ? (
                          <Badge className="w-fit border-amber-400/80 bg-amber-600/90 text-[10px] font-bold text-white">
                            Household children only
                          </Badge>
                        ) : null}
                      </div>
                    }
                    bottomRight={
                      <span className="rounded-full bg-foreground/90 px-2 py-1 text-xs font-bold text-background">
                        £{p.price}
                        {p.billingCycle === 'QUARTERLY' ? '/season' : ''}
                      </span>
                    }
                    meta={
                      <div className="space-y-1.5">
                        {p.maxChildren != null ? (
                          <p className="text-xs font-medium text-muted-foreground">
                            Covers up to {p.maxChildren} {p.maxChildren === 1 ? 'child' : 'children'}
                          </p>
                        ) : null}
                        <MembershipPlanExtrasCompact
                          showDescription={false}
                          benefits={p.benefits}
                          addOnLines={planExtrasByPlanId.get(p.id)?.addOnLines ?? []}
                          couponLines={planExtrasByPlanId.get(p.id)?.couponLines ?? []}
                          maxBenefits={3}
                        />
                      </div>
                    }
                    footer={
                      <span className="text-sm font-semibold text-accent">
                        Join via account →
                      </span>
                    }
                  />
                )
              }

              const monthly = row.monthlyPlan
              const annual = row.annualPlan
              const chosen = billingAnnual ? annual : monthly
              if (!chosen) return null

              const m = monthly?.monthlyPrice ?? monthly?.price ?? 0
              const a = annual?.annualPrice ?? annual?.price ?? 0
              const savings = annualSavingsVsMonthly(m, a)

              return (
                <ListingCard
                  key={row.planGroupId}
                  href="/account/membership"
                  title={row.displayName}
                  description={chosen.description}
                  imageUrl={imageUrl}
                  topLeft={
                    <div className="flex flex-col gap-1">
                      <Badge className="w-fit border-primary-foreground/40 bg-primary-foreground/20 text-[10px] font-bold text-primary-foreground">
                        {billingAnnual ? 'Annual' : 'Monthly'}
                      </Badge>
                      {chosen.allowFamilyMember ? (
                        <Badge className="w-fit border-violet-400/80 bg-violet-700/90 text-[10px] font-bold text-white">
                          Requires family member
                        </Badge>
                      ) : null}
                      {chosen.isHouseholdOnly ? (
                        <Badge className="w-fit border-amber-400/80 bg-amber-600/90 text-[10px] font-bold text-white">
                          Household children only
                        </Badge>
                      ) : null}
                    </div>
                  }
                  bottomRight={
                    <span className="rounded-full bg-foreground/90 px-2 py-1 text-xs font-bold text-background">
                      £{chosen.price}
                      {billingAnnual ? '/yr' : '/mo'}
                    </span>
                  }
                  meta={
                    <div className="space-y-1.5">
                      {billingAnnual && savings > 0 ? (
                        <span className="inline-block rounded-full border border-emerald-500/50 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-100">
                          Save £{savings}/year
                        </span>
                      ) : null}
                      {chosen.maxChildren != null ? (
                        <p className="text-xs font-medium text-muted-foreground">
                          Covers up to {chosen.maxChildren}{' '}
                          {chosen.maxChildren === 1 ? 'child' : 'children'}
                        </p>
                      ) : null}
                      <MembershipPlanExtrasCompact
                        showDescription={false}
                        benefits={chosen.benefits}
                        addOnLines={planExtrasByPlanId.get(chosen.id)?.addOnLines ?? []}
                        couponLines={planExtrasByPlanId.get(chosen.id)?.couponLines ?? []}
                        maxBenefits={3}
                      />
                    </div>
                  }
                  footer={
                    <span className="text-sm font-semibold text-accent">
                      Join via account →
                    </span>
                  }
                />
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-12 border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Why join?</CardTitle>
              <CardDescription>Built for busy families</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Membership plans include unlimited play, discounted birthday parties, 2 complimentary
                pairs of grip socks, 10% off merchandise purchases, and 1 free coffee each month.
              </p>
              <p>
                You can reserve up to 1 week in advance, and each reservation must be used before
                making the next one.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">FAQ</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                <strong className="text-foreground">How does the seasonal pass work?</strong> It is a
                3-month unlimited play pass for children from the same household.
              </p>
              <p>
                <strong className="text-foreground">What family options are available?</strong> Choose
                1-child and 2-children monthly/annual plans, plus seasonal 1-child, 2-children, and
                3+ children options.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  )
}
