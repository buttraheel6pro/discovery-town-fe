/** Membership checkout — plan recap, promo code, mock payment, then enroll. */
'use client'

import { useMemo, useState } from 'react'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { ArrowLeft, CreditCard, Lock } from 'lucide-react'

import { CouponPanel } from '@/components/customer/coupon-panel'
import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { MembershipPlanExtrasCompact } from '@/components/customer/membership-plan-extras-compact'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useMembershipPlanExtras } from '@/hooks/use-membership-plan-extras'
import { formatPrice } from '@/lib/utils'
import { useClients } from '@/lib/client-store'
import type { ContactSubscription, Coupon, MembershipPlan } from '@/lib/types'

function subscriptionPeriodEndIso(plan: MembershipPlan): string {
  const periodEnd = new Date()
  if (plan.billingCycle === 'MONTHLY') {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  } else if (plan.billingCycle === 'ANNUAL') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  } else if (plan.billingCycle === 'WEEKLY') {
    periodEnd.setDate(periodEnd.getDate() + 7)
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 3)
  }
  return periodEnd.toISOString()
}

export function MembershipCheckoutClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { contacts, membershipPlans, enrollContact, subscriptions } = useClients()

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

  const hasActiveSubscriptionForPromos = Boolean(
    primary &&
      subscriptions.some(
        (s) =>
          s.contactId === primary.id &&
          (s.status === 'ACTIVE' || s.status === 'TRIALING' || s.status === 'PAUSED'),
      ),
  )

  const validFamilyIds = useMemo(
    () => familyIds.filter((id) => childIdSet.has(id)),
    [childIdSet, familyIds],
  )

  const { addOnLines, couponLines } = useMembershipPlanExtras(plan?.id ?? '__noop__')

  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [promoDiscount, setPromoDiscount] = useState(0)

  const price = plan?.price ?? 0
  const totalDue = Math.max(0, Math.round((price - promoDiscount) * 100) / 100)

  const familyRequiredInvalid =
    Boolean(plan?.allowFamilyMember) && validFamilyIds.length === 0

  const canPay =
    Boolean(plan) &&
    Boolean(primary) &&
    !activeSub &&
    !familyRequiredInvalid &&
    cardNumber.replaceAll(/\D/g, '').length >= 8 &&
    expiry.trim().length > 0 &&
    cvv.trim().length >= 3

  function handleCouponApplied(coupon: Coupon | null, discountAmount: number) {
    if (!coupon || discountAmount <= 0) {
      setPromoCode(null)
      setPromoDiscount(0)
      return
    }
    setPromoCode(coupon.code.trim().toUpperCase())
    setPromoDiscount(discountAmount)
  }

  function completeMembership() {
    if (!plan || !primary || !canPay) return

    const nowIso = new Date().toISOString()
    const sub: ContactSubscription = {
      id: `sub-${primary.id}-${plan.id}-${Date.now()}`,
      tenantId: primary.tenantId,
      contactId: primary.id,
      planId: plan.id,
      plan,
      status: 'ACTIVE',
      startedAt: nowIso,
      currentPeriodStart: nowIso,
      currentPeriodEnd: subscriptionPeriodEndIso(plan),
      familyMemberIds:
        plan.allowFamilyMember && validFamilyIds.length > 0 ? validFamilyIds : undefined,
      couponCode: promoCode && promoDiscount > 0 ? promoCode : undefined,
    }
    enrollContact(sub)
    toast({
      title: 'Membership activated',
      description: `${plan.name} is now active on your account.`,
    })
    router.push('/account/membership')
  }

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
                      <span className="font-bold text-foreground">{formatPrice(price)}</span>
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

              <aside className="space-y-4 lg:col-span-5">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Promo code</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Codes must be marked for <strong className="text-foreground">membership</strong>{' '}
                      in admin. Try <span className="font-mono">JOIN10</span> for new signups, or{' '}
                      <span className="font-mono">MEMBER20</span> if you already have an active
                      membership (e.g. second plan).
                    </p>
                  </CardHeader>
                  <CardContent>
                    <CouponPanel
                      context="MEMBERSHIP"
                      subtotal={price}
                      onCouponApplied={handleCouponApplied}
                      hasActiveSubscription={hasActiveSubscriptionForPromos}
                      contactId={primary?.id}
                      externalAppliedCode={promoCode}
                      externalDiscount={promoDiscount}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      Payment (mock)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Plan price</span>
                        <span>{formatPrice(price)}</span>
                      </div>
                      {promoDiscount > 0 ? (
                        <div className="flex justify-between text-sm font-semibold text-green-700">
                          <span>Promo</span>
                          <span>-{formatPrice(promoDiscount)}</span>
                        </div>
                      ) : null}
                      <Separator />
                      <div className="flex justify-between text-base font-black text-foreground">
                        <span>Due today</span>
                        <span className="text-accent">{formatPrice(totalDue)}</span>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="mem-cc">Card number</Label>
                        <Input
                          id="mem-cc"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="1234 5678 9012 3456"
                          autoComplete="cc-number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mem-exp">Expiry</Label>
                        <Input
                          id="mem-exp"
                          value={expiry}
                          onChange={(e) => setExpiry(e.target.value)}
                          placeholder="MM/YY"
                          autoComplete="cc-exp"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mem-cvv">CVV</Label>
                        <Input
                          id="mem-cvv"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value)}
                          placeholder="123"
                          autoComplete="cc-csc"
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      className="w-full bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
                      disabled={!canPay}
                      onClick={completeMembership}
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Pay {formatPrice(totalDue)} & activate
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      Mock payment — no real card is charged.
                    </p>
                  </CardContent>
                </Card>
              </aside>
            </div>
          ) : null}
        </div>
      </main>
      <CustomerFooter />
    </>
  )
}
