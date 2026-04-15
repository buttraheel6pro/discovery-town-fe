/** Account membership page — view current membership and available plans. */
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { CustomerNavbar } from '@/components/customer/navbar'
import { CustomerFooter } from '@/components/customer/footer'
import { MembershipCard } from '@/components/customer/membership-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useClients } from '@/lib/client-store'
import {
  annualSavingsVsMonthly,
  buildMembershipCatalog,
} from '@/lib/membership-helpers'
import { cn } from '@/lib/utils'
import type { ContactSubscription, MembershipPlan } from '@/lib/types'

export default function AccountMembershipPage() {
  const router = useRouter()
  const {
    contacts,
    membershipPlans,
    pauseSubscription,
    resumeSubscription,
    cancelSubscription,
  } = useClients()

  const [billingAnnual, setBillingAnnual] = useState(false)
  const [familyDialogOpen, setFamilyDialogOpen] = useState(false)
  const [pendingJoinPlan, setPendingJoinPlan] = useState<MembershipPlan | null>(null)
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([])

  const primary =
    contacts.find((c) => c.contactType === 'CUSTOMER') ?? contacts[0]

  const children = useMemo(
    () => contacts.filter((c) => c.contactType === 'CHILD'),
    [contacts],
  )

  const catalog = useMemo(
    () => buildMembershipCatalog(membershipPlans),
    [membershipPlans],
  )

  const activeSub = primary?.subscriptions?.find(
    (s) => s.status === 'ACTIVE' || s.status === 'TRIALING' || s.status === 'PAUSED',
  )

  function planForSubscription(sub: ContactSubscription): MembershipPlan {
    return membershipPlans.find((p) => p.id === sub.planId) ?? membershipPlans[0]
  }

  function goToCheckout(plan: MembershipPlan, familyMemberIds?: string[]) {
    const params = new URLSearchParams({ planId: plan.id })
    if (familyMemberIds && familyMemberIds.length > 0) {
      params.set('family', familyMemberIds.join(','))
    }
    router.push(`/account/membership/checkout?${params.toString()}`)
  }

  function requestJoin(plan: MembershipPlan) {
    if (plan.allowFamilyMember === true) {
      setPendingJoinPlan(plan)
      setSelectedChildIds([])
      setFamilyDialogOpen(true)
      return
    }
    goToCheckout(plan)
  }

  function confirmFamilyAndContinue() {
    if (!pendingJoinPlan) return
    if (selectedChildIds.length < 1) return
    goToCheckout(pendingJoinPlan, selectedChildIds)
    setFamilyDialogOpen(false)
    setPendingJoinPlan(null)
    setSelectedChildIds([])
  }

  function toggleChild(id: string, checked: boolean) {
    setSelectedChildIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    )
  }

  return (
    <>
      <CustomerNavbar />
      <main className="py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1
                className="text-2xl font-black text-foreground"
                style={{ fontFamily: 'var(--font-barlow)' }}
              >
                Membership & credits
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your Discovery Town membership and explore available plans.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/account/coupons">Coupons & offers</Link>
              </Button>
              <Link href="/account">
                <Button variant="ghost" size="sm">
                  Back to dashboard
                </Button>
              </Link>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Your membership</CardTitle>
            </CardHeader>
            <CardContent>
              {activeSub ? (
                <MembershipCard
                  plan={planForSubscription(activeSub)}
                  subscription={activeSub}
                  onPause={(id) => pauseSubscription(id)}
                  onResume={(id) => resumeSubscription(id)}
                  onCancel={(id) => cancelSubscription(id)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  You do not currently have an active membership. Browse the plans below to find
                  the right option for your family.
                </p>
              )}
            </CardContent>
          </Card>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Membership plans
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
                    'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
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
                    'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                    billingAnnual
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground',
                  )}
                >
                  Annual
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {catalog.map((row) => {
                const monthly = row.monthlyPlan
                const annual = row.annualPlan
                const standalone = row.standalonePlan

                if (standalone) {
                  const p = standalone
                  return (
                    <MembershipCard
                      key={p.id}
                      plan={p}
                      onJoin={() => requestJoin(p)}
                      joinDisabled={Boolean(activeSub)}
                      displayPrice={p.price}
                      billingLabelOverride={
                        p.billingCycle === 'QUARTERLY' ? 'per season (3 mo)' : undefined
                      }
                      showAnnualSavings={false}
                    />
                  )
                }

                const chosen = billingAnnual ? annual : monthly
                if (!chosen) return null

                const m = monthly?.monthlyPrice ?? monthly?.price ?? 0
                const a = annual?.annualPrice ?? annual?.price ?? 0
                const savings = annualSavingsVsMonthly(m, a)

                return (
                  <MembershipCard
                    key={row.planGroupId}
                    plan={chosen}
                    onJoin={() => requestJoin(chosen)}
                    joinDisabled={Boolean(activeSub)}
                    displayPrice={chosen.price}
                    billingLabelOverride={billingAnnual ? 'per year' : 'per month'}
                    showAnnualSavings={billingAnnual}
                    annualSavingsAmount={savings}
                  />
                )
              })}
            </div>
          </section>
        </div>
      </main>
      <CustomerFooter />

      <Dialog
        open={familyDialogOpen}
        onOpenChange={(open) => {
          setFamilyDialogOpen(open)
          if (!open) {
            setPendingJoinPlan(null)
            setSelectedChildIds([])
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select family members covered by this plan</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Choose at least one child profile. You will review the plan and enter payment on the
            next step.
          </p>
          {children.length === 0 ? (
            <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-sm text-foreground">
                You need to add family members first.
              </p>
              <Button type="button" variant="secondary" size="sm" asChild>
                <Link href="/account/family">Add family member →</Link>
              </Button>
            </div>
          ) : (
            <ul className="max-h-56 space-y-2 overflow-y-auto py-2">
              {children.map((child) => {
                const id = `fam-pick-${child.id}`
                return (
                  <li
                    key={child.id}
                    className="flex items-center gap-3 rounded-md border border-border px-3 py-2"
                  >
                    <Checkbox
                      id={id}
                      checked={selectedChildIds.includes(child.id)}
                      onCheckedChange={(v) => toggleChild(child.id, Boolean(v))}
                    />
                    <Label htmlFor={id} className="text-sm font-medium leading-none">
                      {child.firstName} {child.lastName}
                    </Label>
                  </li>
                )
              })}
            </ul>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFamilyDialogOpen(false)
                setPendingJoinPlan(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={children.length === 0 || selectedChildIds.length < 1}
              onClick={confirmFamilyAndContinue}
            >
              Continue to checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
