/** MembershipCard — displays membership plan details and actions. */
'use client'

import { ArrowRight, PauseCircle, PlayCircle, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MembershipPlanExtrasCompact } from '@/components/customer/membership-plan-extras-compact'
import { SubscriptionStatusBadge } from '@/components/customer/subscription-status-badge'
import { useMembershipPlanExtras } from '@/hooks/use-membership-plan-extras'
import { cn } from '@/lib/utils'
import type { ContactSubscription, MembershipPlan } from '@/lib/types'

interface MembershipCardProps {
  readonly plan: MembershipPlan
  readonly subscription?: ContactSubscription
  readonly onPause?: (subscriptionId: string) => void
  readonly onResume?: (subscriptionId: string) => void
  readonly onCancel?: (subscriptionId: string) => void
  readonly onJoin?: () => void
  readonly joinDisabled?: boolean
  /** Overrides `plan.price` when billing toggle or preview supplies a value. */
  readonly displayPrice?: number
  /** Overrides per-cycle label (e.g. "per month" / "per year"). */
  readonly billingLabelOverride?: string
  /** When set with `annualSavingsAmount > 0`, shows a green savings chip. */
  readonly showAnnualSavings?: boolean
  readonly annualSavingsAmount?: number
}

export function MembershipCard({
  plan,
  subscription,
  onPause,
  onResume,
  onCancel,
  onJoin,
  joinDisabled = false,
  displayPrice,
  billingLabelOverride,
  showAnnualSavings = false,
  annualSavingsAmount,
}: Readonly<MembershipCardProps>) {
  const { addOnLines, couponLines } = useMembershipPlanExtras(plan.id)
  const isActive = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING'
  const isPaused = subscription?.status === 'PAUSED'

  const priceShown = displayPrice ?? plan.price

  const billingLabel =
    billingLabelOverride ??
    (plan.billingCycle === 'MONTHLY'
      ? 'per month'
      : plan.billingCycle === 'ANNUAL'
        ? 'per year'
        : plan.billingCycle === 'WEEKLY'
          ? 'per week'
          : plan.billingCycle === 'QUARTERLY'
            ? 'per quarter'
            : '')

  const savingsPositive =
    showAnnualSavings &&
    annualSavingsAmount != null &&
    annualSavingsAmount > 0

  const titleName = subscription
    ? plan.name
    : plan.name.replace(/\s+-\s+(Monthly|Annual)$/i, '').trim()

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle
            className="text-base font-semibold"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            {titleName}
          </CardTitle>
          <div className="flex flex-wrap items-center justify-end gap-1">
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
              {plan.billingCycle.toLowerCase()}
            </Badge>
            {plan.seasonalBadge ? (
              <Badge className="border-sky-500/50 bg-sky-500/15 text-[10px] font-semibold text-sky-950 dark:text-sky-100">
                {plan.seasonalBadge}
              </Badge>
            ) : null}
            {plan.allowFamilyMember ? (
              <Badge className="border-violet-500/50 bg-violet-500/15 text-[10px] font-semibold text-violet-950 dark:text-violet-100">
                Requires family member
              </Badge>
            ) : null}
            {plan.isHouseholdOnly ? (
              <Badge className="border-amber-500/50 bg-amber-500/15 text-[10px] font-semibold text-amber-950 dark:text-amber-100">
                Household children only
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-xl font-bold">${priceShown}</span>
          <span className="text-xs text-muted-foreground">{billingLabel}</span>
          {savingsPositive ? (
            <span
              className={cn(
                'rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                'border-emerald-500/50 bg-emerald-500/15 text-emerald-950 dark:text-emerald-100',
              )}
            >
              Save ${annualSavingsAmount}/year
            </span>
          ) : null}
        </div>
        {subscription ? (
          <SubscriptionStatusBadge status={subscription.status} />
        ) : (
          <span className="text-xs text-muted-foreground">Not subscribed</span>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-2">
        <MembershipPlanExtrasCompact
          description={plan.description}
          benefits={plan.benefits}
          addOnLines={addOnLines}
          couponLines={couponLines}
        />
        {plan.maxChildren != null ? (
          <p className="text-xs font-medium text-muted-foreground">
            Covers up to {plan.maxChildren} {plan.maxChildren === 1 ? 'child' : 'children'}
          </p>
        ) : null}

        <div className="mt-auto flex flex-col gap-2 pt-2">
          {subscription && isActive && onPause ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="justify-center"
              onClick={() => onPause(subscription.id)}
            >
              <PauseCircle className="mr-2 h-4 w-4" />
              Pause membership
            </Button>
          ) : null}

          {subscription && isPaused && onResume ? (
            <Button
              type="button"
              size="sm"
              className="justify-center"
              onClick={() => onResume(subscription.id)}
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Resume membership
            </Button>
          ) : null}

          {subscription && onCancel ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onCancel(subscription.id)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel membership
            </Button>
          ) : null}

          {!subscription && onJoin ? (
            <Button
              type="button"
              size="sm"
              className="justify-center"
              disabled={joinDisabled}
              onClick={onJoin}
            >
              Join now
              <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
