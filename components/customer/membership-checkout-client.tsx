/** Membership checkout — plan recap, promo code, mock payment, then enroll. */
'use client'

import { useMemo } from 'react'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { ArrowLeft } from 'lucide-react'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { MembershipCheckoutSidebar } from '@/components/customer/membership-checkout-sidebar'
import { MembershipPlanExtrasCompact } from '@/components/customer/membership-plan-extras-compact'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMembershipPlanExtras } from '@/hooks/use-membership-plan-extras'
import { formatPrice } from '@/lib/utils'
import { useClients } from '@/lib/client-store'

export function MembershipCheckoutClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { contacts, membershipPlans } = useClients()

  const planId = searchParams.get('planId')?.trim() ?? ''
  const familyParam = searchParams.get('family')?.trim() ?? ''
  const familyIds = useMemo(
    () => familyParam.split(',').map((s) => s.trim()).filter(Boolean),
    [familyParam],
  )

  const primary =
    contacts.find((c) => c.contactType === 'CUSTOMER') ?? contacts[0] ?? null

  const childIdSet = useMemo(
    () => new Set(contacts.filter((c) => c.contactType === 'CHILD').map((c) => c.id)),
    [contacts],
  )

  const plan = useMemo(
    () => membershipPlans.find((p) => p.id === planId && p.isActive) ?? null,
    [membershipPlans, planId],
  )

  const activeSub = primary?.subscriptions?.find(
    (s) => s.status === 'ACTIVE' || s.status === 'TRIALING' || s.status === 'PAUSED',
  )

  const validFamilyIds = useMemo(
    () => familyIds.filter((id) => childIdSet.has(id)),
    [childIdSet, familyIds],
  )

  const { addOnLines, couponLines } = useMembershipPlanExtras(plan?.id ?? '__noop__')

  return (
    <>
      <CustomerNavbar />
      <main className="bg-background py-10">
        <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/account/membership" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to plans
              </Link>
            </Button>
          </div>

          {!planId ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                <p>No plan selected.</p>
                <Button className="mt-4" asChild>
                  <Link href="/account/membership">Choose a membership</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {planId && !plan ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                <p>This plan is not available.</p>
                <Button className="mt-4" asChild>
                  <Link href="/account/membership">Back to memberships</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {plan && !activeSub ? (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <section className="space-y-4 lg:col-span-7">
                <div>
                  <h1
                    className="text-2xl font-black text-foreground"
                    style={{ fontFamily: 'var(--font-barlow)' }}
                  >
                    Complete your membership
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Review what is included, apply a promo if you have one, then pay (mock).
                  </p>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">{plan.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {plan.billingCycle.toLowerCase()} ·{' '}
                      <span className="font-bold text-foreground">{formatPrice(plan.price)}</span>
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <MembershipPlanExtrasCompact
                      description={plan.description}
                      benefits={plan.benefits}
                      addOnLines={addOnLines}
                      couponLines={couponLines}
                    />
                    {plan.allowFamilyMember ? (
                      <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                        <p className="font-semibold text-foreground">Family coverage</p>
                        {validFamilyIds.length > 0 ? (
                          <p className="mt-1">
                            {validFamilyIds.length} child profile
                            {validFamilyIds.length === 1 ? '' : 's'} selected for this plan.
                          </p>
                        ) : (
                          <p className="mt-1 text-destructive">
                            No valid family members in this checkout link. Go back and choose
                            children from the membership page.
                          </p>
                        )}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </section>

              <aside className="lg:col-span-5">
                <MembershipCheckoutSidebar
                  plan={plan}
                  validFamilyIds={validFamilyIds}
                  onActivated={() => router.push('/account/membership')}
                />
              </aside>
            </div>
          ) : null}

          {activeSub ? (
            <Card className="border-amber-500/40 bg-amber-500/10">
              <CardContent className="py-6 text-sm">
                <p className="font-semibold text-foreground">You already have a membership.</p>
                <p className="mt-1 text-muted-foreground">
                  Manage it from your membership page. To switch plans, cancel the current one
                  first (mock).
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/account/membership">Go to membership</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </main>
      <CustomerFooter />
    </>
  )
}
