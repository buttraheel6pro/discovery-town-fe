/** Open Play membership / seasonal pass detail — plan catalog without slot booking. */
'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Infinity } from 'lucide-react'

import { MembershipCheckoutSidebar } from '@/components/customer/membership-checkout-sidebar'
import { MembershipPassPlanSelector } from '@/components/customer/membership-pass-plan-selector'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useClients } from '@/lib/client-store'
import { buildMembershipCatalog, resolveCheckoutPlanForBilling } from '@/lib/membership-helpers'
import { getSchedulingConsumerBackLink } from '@/lib/scheduling-consumer-categories'
import {
  filterMembershipPlansForPassKind,
  getOpenPlayPassCatalogKind,
  type OpenPlayPassCatalogKind,
} from '@/lib/open-play-pass-catalog'
import type { MembershipPlan, SchedulingService } from '@/lib/types'

interface OpenPlayPassDetailProps {
  readonly service: SchedulingService
}

function passKindLabel(kind: OpenPlayPassCatalogKind): string {
  return kind === 'membership' ? 'Membership pass' : 'Seasonal pass'
}

export function OpenPlayPassDetail({ service }: Readonly<OpenPlayPassDetailProps>) {
  const router = useRouter()
  const { contacts, membershipPlans } = useClients()
  const passKind = getOpenPlayPassCatalogKind(service)
  const [billingAnnual, setBillingAnnual] = useState(false)
  const [familyDialogOpen, setFamilyDialogOpen] = useState(false)
  const [pendingJoinPlan, setPendingJoinPlan] = useState<MembershipPlan | null>(null)
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([])
  const [checkoutPlan, setCheckoutPlan] = useState<MembershipPlan | null>(null)
  const [checkoutFamilyIds, setCheckoutFamilyIds] = useState<string[]>([])

  const children = useMemo(
    () => contacts.filter((c) => c.contactType === 'CHILD'),
    [contacts],
  )

  const catalog = useMemo(() => {
    if (!passKind) return []
    const filtered = filterMembershipPlansForPassKind(membershipPlans, passKind)
    return buildMembershipCatalog(filtered)
  }, [membershipPlans, passKind])

  const amenities = service.amenities ?? []
  const showBillingToggle = passKind === 'membership'

  function clearCheckoutSelection() {
    setCheckoutPlan(null)
    setCheckoutFamilyIds([])
  }

  useEffect(() => {
    clearCheckoutSelection()
  }, [service.id])

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        clearCheckoutSelection()
      }
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  useEffect(() => {
    if (!checkoutPlan || passKind !== 'membership') {
      return
    }
    const aligned = resolveCheckoutPlanForBilling(checkoutPlan, catalog, billingAnnual)
    if (aligned.id !== checkoutPlan.id) {
      setCheckoutPlan(aligned)
    }
  }, [billingAnnual, catalog, checkoutPlan, passKind])

  function selectPlanForCheckout(plan: MembershipPlan, familyMemberIds: string[] = []) {
    setCheckoutPlan(plan)
    setCheckoutFamilyIds(familyMemberIds)
    if (typeof document !== 'undefined') {
      document.getElementById('pass-checkout')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  function requestJoin(plan: MembershipPlan) {
    if (plan.allowFamilyMember === true) {
      setPendingJoinPlan(plan)
      setSelectedChildIds([])
      setFamilyDialogOpen(true)
      return
    }
    selectPlanForCheckout(plan)
  }

  function confirmFamilyAndContinue() {
    if (!pendingJoinPlan) return
    if (selectedChildIds.length < 1) return
    selectPlanForCheckout(pendingJoinPlan, selectedChildIds)
    setFamilyDialogOpen(false)
    setPendingJoinPlan(null)
    setSelectedChildIds([])
  }

  function toggleChild(id: string, checked: boolean) {
    setSelectedChildIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    )
  }

  if (!passKind) {
    return null
  }

  const consumerBackLink = getSchedulingConsumerBackLink(service.categoryId)

  return (
    <>
      <div className="relative h-36 sm:h-48">
        {service.imageUrl ? (
          <Image
            src={service.imageUrl}
            alt={service.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-secondary" aria-hidden />
        )}
        <div className="absolute inset-0 bg-primary/60" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
          <Link
            href={consumerBackLink.href}
            className="mb-4 flex w-fit items-center gap-1 text-sm text-white/80 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> {consumerBackLink.label}
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge className="mb-2 bg-accent text-accent-foreground">
                {passKindLabel(passKind)}
              </Badge>
              <h1
                className="text-3xl font-black text-balance text-white sm:text-4xl"
                style={{ fontFamily: 'var(--font-barlow)' }}
              >
                {service.name}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-white/90">
                <Infinity className="h-4 w-4 shrink-0" aria-hidden />
                Unlimited play — no time slots required
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-white/60">From</p>
              <p className="text-3xl font-black text-accent">
                ${service.basePrice}
                <span className="text-base font-normal text-white/80">
                  {passKind === 'membership' ? '/month' : '/season'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <h2 className="mb-3 text-xl font-bold">About this pass</h2>
            <p className="leading-relaxed text-muted-foreground">
              {service.description ?? '—'}
            </p>
          </section>

          <Separator />

          {amenities.length > 0 ? (
            <section>
              <h2 className="mb-4 text-xl font-bold">What&apos;s included</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {amenities.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                    {item}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <Separator />

          <section className="space-y-4" id="plans">
            <h2 className="text-xl font-bold">Available plans</h2>
            <MembershipPassPlanSelector
              catalog={catalog}
              billingAnnual={billingAnnual}
              showBillingToggle={showBillingToggle}
              onBillingAnnualChange={setBillingAnnual}
              onContinue={requestJoin}
            />
          </section>
        </div>

        <aside id="pass-checkout" className="space-y-4">
          {checkoutPlan ? (
            <>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={clearCheckoutSelection}
                >
                  Change plan
                </Button>
              </div>
              <MembershipCheckoutSidebar
                plan={checkoutPlan}
                validFamilyIds={checkoutFamilyIds}
                sticky={false}
                alwaysShowCheckoutUi
                onActivated={() => {
                  clearCheckoutSelection()
                  router.push('/account/membership')
                }}
              />
            </>
          ) : (
            <Card className="sticky top-24 border-border shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Checkout</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Choose a plan, review the full details, then select{' '}
                  <strong className="text-foreground">Continue with this plan</strong> to checkout
                  here.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    Unlimited visits — no time slots required
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    Reserve up to one week in advance
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

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
          <div className="space-y-3 py-2">
            {children.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Add children to your account profile before continuing.
              </p>
            ) : (
              children.map((child) => (
                <label
                  key={child.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3"
                >
                  <Checkbox
                    checked={selectedChildIds.includes(child.id)}
                    onCheckedChange={(checked) => toggleChild(child.id, Boolean(checked))}
                  />
                  <span className="text-sm font-medium">
                    {child.firstName} {child.lastName}
                  </span>
                </label>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={selectedChildIds.length < 1}
              onClick={confirmFamilyAndContinue}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
