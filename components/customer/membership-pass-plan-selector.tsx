/** Radio list + full detail panel for membership / seasonal pass plan selection. */
'use client'

import { useEffect, useMemo, useState } from 'react'

import { MembershipPassPlanDetail } from '@/components/customer/membership-pass-plan-detail'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { MembershipCatalogEntry } from '@/lib/membership-helpers'
import { cn } from '@/lib/utils'
import type { MembershipPlan } from '@/lib/types'

interface PassCatalogRow {
  readonly id: string
  readonly displayName: string
  readonly monthlyPlan: MembershipPlan | null
  readonly annualPlan: MembershipPlan | null
  readonly standalonePlan: MembershipPlan | null
}

function catalogToRows(catalog: readonly MembershipCatalogEntry[]): PassCatalogRow[] {
  return catalog.map((entry) => ({
    id: entry.standalonePlan?.id ?? entry.planGroupId,
    displayName: entry.displayName,
    monthlyPlan: entry.monthlyPlan,
    annualPlan: entry.annualPlan,
    standalonePlan: entry.standalonePlan,
  }))
}

function resolvePlanForRow(
  row: PassCatalogRow,
  billingAnnual: boolean,
): MembershipPlan | null {
  if (row.standalonePlan) {
    return row.standalonePlan
  }
  return billingAnnual ? row.annualPlan : row.monthlyPlan
}

function billingLabelForPlan(plan: MembershipPlan): string {
  if (plan.billingCycle === 'MONTHLY') {
    return 'per month'
  }
  if (plan.billingCycle === 'ANNUAL') {
    return 'per year'
  }
  if (plan.billingCycle === 'QUARTERLY') {
    return 'per season (3 months)'
  }
  if (plan.billingCycle === 'WEEKLY') {
    return 'per week'
  }
  return ''
}

export interface MembershipPassPlanSelectorProps {
  readonly catalog: readonly MembershipCatalogEntry[]
  readonly billingAnnual: boolean
  readonly showBillingToggle: boolean
  readonly onBillingAnnualChange: (annual: boolean) => void
  readonly onContinue: (plan: MembershipPlan) => void
  readonly className?: string
}

export function MembershipPassPlanSelector({
  catalog,
  billingAnnual,
  showBillingToggle,
  onBillingAnnualChange,
  onContinue,
  className,
}: Readonly<MembershipPassPlanSelectorProps>) {
  const rows = useMemo(() => catalogToRows(catalog), [catalog])
  const [selectedRowId, setSelectedRowId] = useState<string>('')

  useEffect(() => {
    if (rows.length === 0) {
      setSelectedRowId('')
      return
    }
    const stillValid = rows.some((row) => row.id === selectedRowId)
    if (!stillValid) {
      setSelectedRowId(rows[0].id)
    }
  }, [rows, selectedRowId])

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedRowId) ?? null,
    [rows, selectedRowId],
  )

  const selectedPlan = useMemo(
    () => (selectedRow ? resolvePlanForRow(selectedRow, billingAnnual) : null),
    [billingAnnual, selectedRow],
  )

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No plans are available for this pass right now.
      </p>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          Select a plan to view full details
        </p>
        {showBillingToggle ? (
          <div
            className="inline-flex rounded-full border border-border bg-muted/50 p-1"
            role="group"
            aria-label="Billing period"
          >
            <button
              type="button"
              onClick={() => onBillingAnnualChange(false)}
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
              onClick={() => onBillingAnnualChange(true)}
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
        ) : null}
      </div>

      <RadioGroup
        value={selectedRowId}
        onValueChange={setSelectedRowId}
        className="space-y-2"
        aria-label="Membership plans"
      >
        {rows.map((row) => {
          const previewPlan = resolvePlanForRow(row, billingAnnual)
          if (!previewPlan) {
            return null
          }
          const inputId = `pass-plan-${row.id}`
          const billingHint = billingLabelForPlan(previewPlan)
          return (
            <div
              key={row.id}
              className={cn(
                'flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-4 transition-colors',
                selectedRowId === row.id && 'border-accent bg-accent/5 ring-1 ring-accent/30',
              )}
            >
              <RadioGroupItem
                value={row.id}
                id={inputId}
                className="mt-1"
                aria-label={row.displayName}
              />
              <Label
                htmlFor={inputId}
                className="flex flex-1 cursor-pointer flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-base font-semibold text-foreground">
                  {row.displayName}
                </span>
                <span className="text-sm text-muted-foreground">
                  ${previewPlan.price}
                  {billingHint ? ` ${billingHint}` : ''}
                </span>
              </Label>
            </div>
          )
        })}
      </RadioGroup>

      {selectedPlan ? (
        <MembershipPassPlanDetail
          plan={selectedPlan}
          billingLabel={billingLabelForPlan(selectedPlan)}
          showAnnualSavings={showBillingToggle && billingAnnual}
          onContinue={() => onContinue(selectedPlan)}
        />
      ) : null}
    </div>
  )
}
