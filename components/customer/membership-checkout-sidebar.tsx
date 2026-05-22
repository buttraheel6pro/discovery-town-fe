/** Promo code + mock payment sidebar for membership / pass plan checkout. */
'use client'

import { useMemo, useState } from 'react'

import Link from 'next/link'
import { CreditCard, Lock } from 'lucide-react'

import { CouponPanel } from '@/components/customer/coupon-panel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
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

export interface MembershipCheckoutSidebarProps {
  readonly plan: MembershipPlan
  readonly validFamilyIds?: readonly string[]
  readonly onActivated?: () => void
  readonly sticky?: boolean
  /** When true, always show promo + payment UI (pass detail). Skips the membership-blocker card. */
  readonly alwaysShowCheckoutUi?: boolean
}

export function MembershipCheckoutSidebar({
  plan,
  validFamilyIds = [],
  onActivated,
  sticky = true,
  alwaysShowCheckoutUi = false,
}: Readonly<MembershipCheckoutSidebarProps>) {
  const { toast } = useToast()
  const { contacts, enrollContact, subscriptions } = useClients()

  const primary =
    contacts.find((c) => c.contactType === 'CUSTOMER') ?? contacts[0] ?? null

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

  const familyRequiredInvalid =
    Boolean(plan.allowFamilyMember) && validFamilyIds.length === 0

  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [promoDiscount, setPromoDiscount] = useState(0)

  const price = plan.price
  const totalDue = useMemo(
    () => Math.max(0, Math.round((price - promoDiscount) * 100) / 100),
    [price, promoDiscount],
  )

  const hasBlockingMembership = Boolean(activeSub) && !alwaysShowCheckoutUi

  const canPay =
    Boolean(primary) &&
    !hasBlockingMembership &&
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
    if (!primary || !canPay) return

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
        plan.allowFamilyMember && validFamilyIds.length > 0
          ? [...validFamilyIds]
          : undefined,
      couponCode: promoCode && promoDiscount > 0 ? promoCode : undefined,
    }
    enrollContact(sub)
    toast({
      title: 'Membership activated',
      description: `${plan.name} is now active on your account.`,
    })
    onActivated?.()
  }

  if (hasBlockingMembership) {
    return (
      <Card className="border-amber-500/40 bg-amber-500/10">
        <CardContent className="py-6 text-sm">
          <p className="font-semibold text-foreground">You already have a membership.</p>
          <p className="mt-1 text-muted-foreground">
            Manage it from your account to change or cancel your current plan (mock).
          </p>
        </CardContent>
      </Card>
    )
  }

  const wrapperClass = sticky ? 'sticky top-24 space-y-4' : 'space-y-4'
  const showExistingMembershipHint = Boolean(activeSub) && alwaysShowCheckoutUi

  return (
    <div className={wrapperClass}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Promo code</CardTitle>
          <p className="text-xs text-muted-foreground">
            Codes must be marked for <strong className="text-foreground">membership</strong> in
            admin. Try <span className="font-mono">JOIN10</span> for new signups, or{' '}
            <span className="font-mono">MEMBER20</span> if you already have an active membership
            (e.g. second plan).
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
          <p className="text-sm font-medium text-foreground">{plan.name}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {showExistingMembershipHint ? (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-muted-foreground">
              You already have an active membership. Cancel it in{' '}
              <Link href="/account/membership" className="font-semibold text-accent underline">
                your account
              </Link>{' '}
              before purchasing a different plan (mock).
            </p>
          ) : null}
          {familyRequiredInvalid ? (
            <p className="text-xs text-destructive">
              Select children for this plan using Join on a plan card, then complete payment here.
            </p>
          ) : null}

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
              <Label htmlFor={`pass-cc-${plan.id}`}>Card number</Label>
              <Input
                id={`pass-cc-${plan.id}`}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="1234 5678 9012 3456"
                autoComplete="cc-number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`pass-exp-${plan.id}`}>Expiry</Label>
              <Input
                id={`pass-exp-${plan.id}`}
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="MM/YY"
                autoComplete="cc-exp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`pass-cvv-${plan.id}`}>CVV</Label>
              <Input
                id={`pass-cvv-${plan.id}`}
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
    </div>
  )
}
