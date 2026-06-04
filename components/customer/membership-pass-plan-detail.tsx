/** Full-size membership plan detail panel for pass checkout (after radio selection). */
'use client'

import { ArrowRight, CheckCircle2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useMembershipPlanExtras } from '@/hooks/use-membership-plan-extras'
import { annualSavingsVsMonthly } from '@/lib/membership-helpers'
import { cn } from '@/lib/utils'
import type { MembershipPlan } from '@/lib/types'

export interface MembershipPassPlanDetailProps {
  readonly plan: MembershipPlan
  readonly billingLabel: string
  readonly showAnnualSavings: boolean
  readonly onContinue: () => void
  readonly continueDisabled?: boolean
}

export function MembershipPassPlanDetail({
  plan,
  billingLabel,
  showAnnualSavings,
  onContinue,
  continueDisabled = false,
}: Readonly<MembershipPassPlanDetailProps>) {
  const { addOnLines, couponLines } = useMembershipPlanExtras(plan.id)

  const displayTitle = plan.name.replace(/\s+-\s+(Monthly|Annual)$/i, '').trim()
  const monthlyRef = plan.monthlyPrice ?? plan.price
  const annualRef = plan.annualPrice ?? plan.price
  const savings =
    showAnnualSavings && plan.billingCycle === 'ANNUAL'
      ? annualSavingsVsMonthly(monthlyRef, annualRef)
      : 0

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-3 min-w-0 flex-1">
          <h3
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            {displayTitle}
          </h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs uppercase tracking-wide">
              {plan.billingCycle.toLowerCase()}
            </Badge>
            {plan.seasonalBadge ? (
              <Badge className="border-sky-500/50 bg-sky-500/15 text-xs font-semibold text-sky-950 dark:text-sky-100">
                {plan.seasonalBadge}
              </Badge>
            ) : null}
            {plan.allowFamilyMember ? (
              <Badge className="border-violet-500/50 bg-violet-500/15 text-xs font-semibold text-violet-950 dark:text-violet-100">
                Requires family member
              </Badge>
            ) : null}
            {plan.isHouseholdOnly ? (
              <Badge className="border-amber-500/50 bg-amber-500/15 text-xs font-semibold text-amber-950 dark:text-amber-100">
                Household children only
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-4xl font-black text-foreground sm:text-5xl">${plan.price}</p>
          <p className="mt-1 text-sm font-medium text-muted-foreground">{billingLabel}</p>
          {savings > 0 ? (
            <p
              className={cn(
                'mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                'border-emerald-500/50 bg-emerald-500/15 text-emerald-950 dark:text-emerald-100',
              )}
            >
              Save ${savings}/year vs monthly
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-8 pt-6">
        {plan.description?.trim() ? (
          <section className="space-y-2">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              About this plan
            </h4>
            <p className="text-base leading-relaxed text-foreground md:text-lg">
              {plan.description.trim()}
            </p>
          </section>
        ) : null}

        {plan.benefits.length > 0 ? (
          <section className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              What&apos;s included
            </h4>
            <ul className="grid gap-2 sm:grid-cols-2">
              {plan.benefits.map((benefit, index) => (
                <li
                  key={`${benefit}-${index}`}
                  className="flex items-start gap-3 text-sm text-foreground md:text-base"
                >
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                    aria-hidden
                  />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {addOnLines.length > 0 ? (
          <section className="space-y-2">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Included play add-ons
            </h4>
            <ul className="flex flex-wrap gap-2">
              {addOnLines.map((line, index) => (
                <li key={`${line}-${index}`}>
                  <Badge variant="outline" className="px-3 py-1 text-sm font-normal">
                    {line}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {couponLines.length > 0 ? (
          <section className="space-y-2">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Member coupons
            </h4>
            <ul className="flex flex-wrap gap-2">
              {couponLines.map((line, index) => (
                <li key={`${line}-${index}`}>
                  <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
                    {line}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {plan.maxChildren != null ? (
          <p className="text-sm font-medium text-muted-foreground md:text-base">
            Covers up to {plan.maxChildren}{' '}
            {plan.maxChildren === 1 ? 'child' : 'children'} in your household.
          </p>
        ) : null}

        <Button
          type="button"
          size="lg"
          className="h-12 w-full bg-accent text-base font-semibold text-accent-foreground hover:bg-accent/90 sm:w-auto sm:min-w-[240px]"
          disabled={continueDisabled}
          onClick={onContinue}
        >
          Continue with this plan
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
