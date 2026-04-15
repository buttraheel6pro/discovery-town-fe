/** Account coupons — plan-linked perks and typed promo codes (accordion details). */
'use client'

import Link from 'next/link'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { useClients } from '@/lib/client-store'
import {
  buildMembershipCatalog,
  getLinkedCouponsForPlan,
} from '@/lib/membership-helpers'
import { coupons, getEligibleCoupons, shopCoupons } from '@/lib/mock-data'
import { formatPrice } from '@/lib/utils'
import type { Coupon, MembershipPlan } from '@/lib/types'

function couponScopeLabel(c: Coupon): string {
  const parts: string[] = []
  if (c.applicableTo.includes('MEMBERSHIP')) parts.push('Membership checkout')
  if (c.applicableTo.includes('SHOP')) parts.push('Shop')
  if (c.applicableTo.includes('BOOKING')) parts.push('Bookings')
  return parts.length > 0 ? parts.join(' · ') : '—'
}

/** One-line benefit for the collapsed row (description preferred, else derived). */
function couponBenefitLine(c: Coupon): string {
  const d = c.description?.trim()
  if (d) return d
  if (c.type === 'PERCENTAGE') {
    return `${c.value}% off where this code is accepted`
  }
  return `${formatPrice(c.value)} off where this code is accepted`
}

function formatCouponDate(iso: string): string {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function CouponDetailBody({
  coupon: c,
  extraNote,
}: Readonly<{ coupon: Coupon; extraNote?: string }>) {
  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/30 px-3 py-3 text-xs">
      <div>
        <p className="font-semibold text-foreground">{c.name}</p>
        {c.description?.trim() ? (
          <p className="mt-1 leading-relaxed text-muted-foreground">{c.description.trim()}</p>
        ) : null}
      </div>
      <dl className="grid gap-2 text-muted-foreground">
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="font-medium text-foreground">Discount</dt>
          <dd>
            {c.type === 'PERCENTAGE'
              ? `${c.value}% off subtotal`
              : `${formatPrice(c.value)} off (capped at subtotal)`}
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="font-medium text-foreground">Use at</dt>
          <dd>{couponScopeLabel(c)}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="font-medium text-foreground">Valid</dt>
          <dd>
            {formatCouponDate(c.validFrom)} → {formatCouponDate(c.validUntil)}
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="font-medium text-foreground">Members only</dt>
          <dd>{c.requiresSubscription ? 'Yes' : 'No'}</dd>
        </div>
        {c.minPurchase != null && c.minPurchase > 0 ? (
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="font-medium text-foreground">Min. spend</dt>
            <dd>{formatPrice(c.minPurchase)}</dd>
          </div>
        ) : null}
      </dl>
      {extraNote ? (
        <p className="border-t border-border pt-2 text-muted-foreground">{extraNote}</p>
      ) : null}
    </div>
  )
}

function CouponAccordionList({
  items,
  valuePrefix,
}: Readonly<{ items: readonly Coupon[]; valuePrefix: string }>) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">None right now.</p>
  }
  return (
    <Accordion type="single" collapsible className="w-full">
      {items.map((c) => (
        <AccordionItem key={`${valuePrefix}-${c.id}`} value={`${valuePrefix}-${c.id}`}>
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex min-w-0 flex-1 flex-col gap-1 text-left sm:flex-row sm:items-start sm:gap-4">
              <span className="shrink-0 font-mono text-sm font-bold text-foreground">
                {c.code}
              </span>
              <span className="line-clamp-2 text-xs leading-snug text-muted-foreground sm:min-w-0 sm:flex-1">
                {couponBenefitLine(c)}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <CouponDetailBody coupon={c} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export default function AccountCouponsPage() {
  const { contacts, membershipPlans, planCoupons, subscriptions } = useClients()

  const primary =
    contacts.find((c) => c.contactType === 'CUSTOMER') ?? contacts[0] ?? null

  const mergedCoupons: Coupon[] = [...coupons, ...shopCoupons]

  const activeSub = primary?.subscriptions?.find(
    (s) => s.status === 'ACTIVE' || s.status === 'TRIALING' || s.status === 'PAUSED',
  )

  const hasActiveSubscription = Boolean(
    primary &&
      subscriptions.some(
        (s) =>
          s.contactId === primary.id &&
          (s.status === 'ACTIVE' ||
            s.status === 'TRIALING' ||
            s.status === 'PAUSED'),
      ),
  )

  const catalogRows = buildMembershipCatalog(membershipPlans)

  const planSections = catalogRows
    .map((row) => {
      const plans = [row.standalonePlan, row.monthlyPlan, row.annualPlan].filter(
        Boolean,
      ) as MembershipPlan[]
      const seen = new Set<string>()
      const unique = plans.filter((p) => {
        if (seen.has(p.id)) return false
        seen.add(p.id)
        return true
      })
      if (unique.length === 0) return null
      return { row, unique }
    })
    .filter(Boolean) as { row: (typeof catalogRows)[0]; unique: MembershipPlan[] }[]

  const membershipForNew = getEligibleCoupons('MEMBERSHIP', 100, {
    hasActiveSubscription: false,
  })
  const membershipForMembers = getEligibleCoupons('MEMBERSHIP', 100, {
    hasActiveSubscription: true,
  })

  const shopOffers = getEligibleCoupons('ORDER', 100, {
    hasActiveSubscription,
  })
  const bookingOffers = getEligibleCoupons('BOOKING', 100, {
    hasActiveSubscription,
  })

  const activePlanId = activeSub?.planId
  const linkedToActivePlan =
    activePlanId != null
      ? getLinkedCouponsForPlan(activePlanId, planCoupons, mergedCoupons)
      : []

  return (
    <>
      <CustomerNavbar />
      <main className="py-10">
        <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" asChild>
              <Link href="/account">← Back to dashboard</Link>
            </Button>
            <div>
              <h1
                className="text-2xl font-black text-foreground"
                style={{ fontFamily: 'var(--font-barlow)' }}
              >
                Coupons & offers
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Tap a code to see full terms, where to use it, and validity dates.
              </p>
            </div>
          </div>

          {linkedToActivePlan.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Linked to your current plan</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Catalog codes attached to your active membership SKU in admin.
                </p>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {linkedToActivePlan.map((c) => (
                    <AccordionItem key={`active-${c.id}`} value={`active-${c.id}`}>
                      <AccordionTrigger className="py-3 hover:no-underline">
                        <div className="flex min-w-0 flex-1 flex-col gap-1 text-left sm:flex-row sm:items-start sm:gap-4">
                          <span className="shrink-0 font-mono text-sm font-bold text-foreground">
                            {c.code}
                          </span>
                          <span className="line-clamp-2 text-xs leading-snug text-muted-foreground sm:min-w-0 sm:flex-1">
                            {couponBenefitLine(c)}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <CouponDetailBody
                          coupon={c}
                          extraNote="Linked in Admin → Memberships to your current plan SKU. Enter this code at checkout where applicable."
                        />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Linked to plans you can buy</CardTitle>
              <p className="text-xs text-muted-foreground">
                Per-SKU links from admin (same mapping as Play coupons on plan cards).
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {planSections.map(({ row, unique }, idx) => (
                <div key={row.planGroupId}>
                  <p className="text-sm font-semibold text-foreground">{row.displayName}</p>
                  <ul className="mt-2 space-y-4">
                    {unique.map((p) => {
                      const linked = getLinkedCouponsForPlan(p.id, planCoupons, mergedCoupons)
                      if (linked.length === 0) {
                        return (
                          <li key={p.id} className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{p.name}</span> — no
                            linked coupons
                          </li>
                        )
                      }
                      return (
                        <li key={p.id} className="space-y-2">
                          <p className="text-xs font-medium text-foreground">{p.name}</p>
                          <Accordion type="single" collapsible className="w-full">
                            {linked.map((c) => (
                              <AccordionItem key={`${p.id}-${c.id}`} value={`${p.id}-${c.id}`}>
                                <AccordionTrigger className="py-3 hover:no-underline">
                                  <div className="flex min-w-0 flex-1 flex-col gap-1 text-left sm:flex-row sm:items-start sm:gap-4">
                                    <span className="shrink-0 font-mono text-sm font-bold text-foreground">
                                      {c.code}
                                    </span>
                                    <span className="line-clamp-2 text-xs leading-snug text-muted-foreground sm:min-w-0 sm:flex-1">
                                      {couponBenefitLine(c)}
                                    </span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <CouponDetailBody
                                    coupon={c}
                                    extraNote={`Attached in admin to plan: ${p.name}.`}
                                  />
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </li>
                      )
                    })}
                  </ul>
                  {idx < planSections.length - 1 ? <Separator className="mt-4" /> : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Membership checkout</CardTitle>
              <p className="text-xs text-muted-foreground">
                Codes to enter after you choose a plan and open membership checkout.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  New members (no active subscription)
                </p>
                <CouponAccordionList items={membershipForNew} valuePrefix="mem-new" />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  With an active membership
                </p>
                <CouponAccordionList items={membershipForMembers} valuePrefix="mem-sub" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Shop & bookings</CardTitle>
              <p className="text-xs text-muted-foreground">
                Use these in the shop cart or when booking, depending on each code.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Shop
                </p>
                <CouponAccordionList items={shopOffers} valuePrefix="shop" />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Bookings
                </p>
                <CouponAccordionList items={bookingOffers} valuePrefix="book" />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/cart">Open cart</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/classes">Book a class</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <CustomerFooter />
    </>
  )
}
