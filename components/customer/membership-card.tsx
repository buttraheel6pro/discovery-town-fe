/** MembershipCard — displays membership plan details and actions. */
'use client'

import { ArrowRight, PauseCircle, PlayCircle, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SubscriptionStatusBadge } from '@/components/customer/subscription-status-badge'
import type { ContactSubscription, MembershipPlan } from '@/lib/types'

interface MembershipCardProps {
  readonly plan: MembershipPlan
  readonly subscription?: ContactSubscription
  readonly onPause?: (subscriptionId: string) => void
  readonly onResume?: (subscriptionId: string) => void
  readonly onCancel?: (subscriptionId: string) => void
  readonly onJoin?: () => void
  readonly joinDisabled?: boolean
}

export function MembershipCard({
  plan,
  subscription,
  onPause,
  onResume,
  onCancel,
  onJoin,
  joinDisabled = false,
}: Readonly<MembershipCardProps>) {
  const isActive = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING'
  const isPaused = subscription?.status === 'PAUSED'

  const billingLabel =
    plan.billingCycle === 'MONTHLY'
      ? 'per month'
      : plan.billingCycle === 'ANNUAL'
        ? 'per year'
        : plan.billingCycle === 'WEEKLY'
          ? 'per week'
          : plan.billingCycle === 'QUARTERLY'
            ? 'per quarter'
            : ''

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle
            className="text-base font-semibold"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            {plan.name}
          </CardTitle>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
            {plan.billingCycle.toLowerCase()}
          </Badge>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold">£{plan.price}</span>
          <span className="text-xs text-muted-foreground">{billingLabel}</span>
        </div>
        {subscription ? (
          <SubscriptionStatusBadge status={subscription.status} />
        ) : (
          <span className="text-xs text-muted-foreground">Not subscribed</span>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        {plan.description ? (
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        ) : null}
        {plan.benefits.length ? (
          <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
            {plan.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-1.5">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 flex flex-col gap-2">
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

