/** Admin membership plans — bulk create, catalog cards, plan add-ons and coupons. */
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { MembershipBenefitPicker } from '@/components/admin/membership-benefit-picker'
import { MembershipPlacementFields } from '@/components/admin/membership-placement-fields'
import {
  PlanAddOnDraftPicker,
  type PlanAddOnDraftRow,
} from '@/components/admin/plan-addon-draft-picker'
import { PlanCouponDraftPicker } from '@/components/admin/plan-coupon-draft-picker'
import { PlanAddOnManager } from '@/components/admin/plan-add-on-manager'
import { PlanCouponManager } from '@/components/admin/plan-coupon-manager'
import { CrudModal } from '@/components/admin/crud-modal'
import { MembershipPlanExtrasCompact } from '@/components/customer/membership-plan-extras-compact'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useClients } from '@/lib/client-store'
import { useInventory } from '@/lib/inventory-store'
import {
  buildPlacementPatch,
  DEFAULT_PLAY_OPEN_MEMBERSHIP_PLACEMENT,
  EMPTY_MEMBERSHIP_PLACEMENT,
  formatPlacementSummary,
  placementDraftFromPlan,
  type MembershipPlacementDraft,
} from '@/lib/membership-placement'
import { useScheduling } from '@/lib/scheduling-store'
import { coupons, membershipSchedulingAddonCatalog } from '@/lib/mock-data'
import {
  annualSavingsVsMonthly,
  resolvePlanAddOnDisplayLines,
  resolvePlanCouponDisplayLines,
} from '@/lib/membership-helpers'
import { cn } from '@/lib/utils'
import type { BillingCycle, MembershipPlan, PlanAddOn, PlanCoupon } from '@/lib/types'
import { isAdminApiReady } from '@/lib/api/client'
import { createPlan, updatePlan } from '@/lib/services/plans'

interface MembershipPlanEditDraft {
  name: string
  description: string
  price: string
  billingCycle: BillingCycle
  benefits: string[]
  allowFamilyMember: boolean
  isHouseholdOnly: boolean
  maxChildren: string
  seasonalBadge: string
  isFeatured: boolean
  isActive: boolean
  minTermMonths: string
  cancellationNoticeDays: string
}

function planToEditDraft(plan: MembershipPlan): MembershipPlanEditDraft {
  return {
    name: plan.name,
    description: plan.description ?? '',
    price: String(plan.price),
    billingCycle: plan.billingCycle,
    benefits: [...plan.benefits],
    allowFamilyMember: Boolean(plan.allowFamilyMember),
    isHouseholdOnly: Boolean(plan.isHouseholdOnly),
    maxChildren: plan.maxChildren != null ? String(plan.maxChildren) : '',
    seasonalBadge: plan.seasonalBadge ?? '',
    isFeatured: plan.isFeatured,
    isActive: plan.isActive,
    minTermMonths: plan.minTermMonths != null ? String(plan.minTermMonths) : '1',
    cancellationNoticeDays:
      plan.cancellationNoticeDays != null ? String(plan.cancellationNoticeDays) : '14',
  }
}

function createPlanId(suffix: string): string {
  return `mplan-${Date.now()}-${suffix}`
}

function createPlanAddOnRowId(): string {
  return `pao-${Math.random().toString(16).slice(2, 10)}`
}

function createPlanCouponRowId(): string {
  return `pco-${Math.random().toString(16).slice(2, 10)}`
}

export default function AdminMembershipsPage() {
  const { toast } = useToast()
  const { bookingAddOns } = useInventory()
  const { categories } = useScheduling()
  const {
    membershipPlans,
    subscriptions,
    planAddOns,
    planCoupons,
    addMembershipPlansBulk,
    addMembershipPlan,
    addPlanAddOn,
    addPlanCoupon,
    updateMembershipPlan,
  } = useClients()

  const [bulkOpen, setBulkOpen] = useState(false)
  const [seasonalOpen, setSeasonalOpen] = useState(false)
  const [detailPlan, setDetailPlan] = useState<MembershipPlan | null>(null)
  const [detailDraft, setDetailDraft] = useState<MembershipPlanEditDraft | null>(null)
  const [detailPlacement, setDetailPlacement] =
    useState<MembershipPlacementDraft>(EMPTY_MEMBERSHIP_PLACEMENT)
  const [bulkPlacement, setBulkPlacement] = useState<MembershipPlacementDraft>({
    displayPages: ['membership', 'play'],
    schedulingCategoryIds: ['cat-open-play'],
  })
  const [seasonalPlacement, setSeasonalPlacement] = useState<MembershipPlacementDraft>(
    DEFAULT_PLAY_OPEN_MEMBERSHIP_PLACEMENT,
  )

  const [bulkName, setBulkName] = useState('')
  const [bulkMonthlyDesc, setBulkMonthlyDesc] = useState('')
  const [bulkAnnualDesc, setBulkAnnualDesc] = useState('')
  const [bulkMonthly, setBulkMonthly] = useState('')
  const [bulkAnnual, setBulkAnnual] = useState('')
  const [bulkMonthlyBenefits, setBulkMonthlyBenefits] = useState<string[]>([])
  const [bulkAnnualBenefits, setBulkAnnualBenefits] = useState<string[]>([])
  const [bulkMonthlyAddonDrafts, setBulkMonthlyAddonDrafts] = useState<PlanAddOnDraftRow[]>([])
  const [bulkAnnualAddonDrafts, setBulkAnnualAddonDrafts] = useState<PlanAddOnDraftRow[]>([])
  const [bulkMonthlyCouponIds, setBulkMonthlyCouponIds] = useState<string[]>([])
  const [bulkAnnualCouponIds, setBulkAnnualCouponIds] = useState<string[]>([])
  const [bulkAllowFamily, setBulkAllowFamily] = useState(false)
  const [bulkHousehold, setBulkHousehold] = useState(false)
  const [bulkMaxChild, setBulkMaxChild] = useState('')
  const [bulkFeatured, setBulkFeatured] = useState(false)
  const [bulkActive, setBulkActive] = useState(true)

  const [sName, setSName] = useState('')
  const [sDesc, setSDesc] = useState('')
  const [sPrice, setSPrice] = useState('')
  const [sBilling, setSBilling] = useState<BillingCycle>('QUARTERLY')
  const [sHousehold, setSHousehold] = useState(false)
  const [sAllowFamily, setSAllowFamily] = useState(false)
  const [sMaxChild, setSMaxChild] = useState('')
  const [sBadge, setSBadge] = useState('')
  const [sFeatured, setSFeatured] = useState(false)
  const [sActive, setSActive] = useState(true)
  const [sBenefits, setSBenefits] = useState<string[]>([])
  const [sAddonDrafts, setSAddonDrafts] = useState<PlanAddOnDraftRow[]>([])
  const [sCouponIds, setSCouponIds] = useState<string[]>([])

  useEffect(() => {
    if (!detailPlan) {
      setDetailDraft(null)
      setDetailPlacement(EMPTY_MEMBERSHIP_PLACEMENT)
      return
    }
    setDetailDraft(planToEditDraft(detailPlan))
    setDetailPlacement(placementDraftFromPlan(detailPlan))
  }, [detailPlan])

  const subscriberCountByPlan = useMemo(() => {
    const m = new Map<string, number>()
    for (const s of subscriptions) {
      if (s.status !== 'ACTIVE' && s.status !== 'TRIALING' && s.status !== 'PAUSED') {
        continue
      }
      m.set(s.planId, (m.get(s.planId) ?? 0) + 1)
    }
    return m
  }, [subscriptions])

  const planExtrasByPlanId = useMemo(() => {
    const m = new Map<string, { addOnLines: string[]; couponLines: string[] }>()
    for (const p of membershipPlans) {
      m.set(p.id, {
        addOnLines: resolvePlanAddOnDisplayLines(
          p.id,
          planAddOns,
          bookingAddOns,
          membershipSchedulingAddonCatalog,
        ),
        couponLines: resolvePlanCouponDisplayLines(p.id, planCoupons, coupons),
      })
    }
    return m
  }, [bookingAddOns, membershipPlans, planAddOns, planCoupons])

  const monthlyNum = Number.parseFloat(bulkMonthly)
  const annualNum = Number.parseFloat(bulkAnnual)
  const savings = useMemo(() => {
    if (!Number.isFinite(monthlyNum) || !Number.isFinite(annualNum)) return null
    return annualSavingsVsMonthly(monthlyNum, annualNum)
  }, [monthlyNum, annualNum])

  const annualAboveMonthlyYear =
    Number.isFinite(monthlyNum) && Number.isFinite(annualNum)
      ? annualNum > monthlyNum * 12
      : false

  function resetBulkForm() {
    setBulkName('')
    setBulkMonthlyDesc('')
    setBulkAnnualDesc('')
    setBulkMonthly('')
    setBulkAnnual('')
    setBulkMonthlyBenefits([])
    setBulkAnnualBenefits([])
    setBulkMonthlyAddonDrafts([])
    setBulkAnnualAddonDrafts([])
    setBulkMonthlyCouponIds([])
    setBulkAnnualCouponIds([])
    setBulkAllowFamily(false)
    setBulkHousehold(false)
    setBulkMaxChild('')
    setBulkFeatured(false)
    setBulkActive(true)
  }

  function resetSeasonalForm() {
    setSName('')
    setSDesc('')
    setSPrice('')
    setSBilling('QUARTERLY')
    setSHousehold(false)
    setSAllowFamily(false)
    setSMaxChild('')
    setSBadge('')
    setSFeatured(false)
    setSActive(true)
    setSBenefits([])
    setSAddonDrafts([])
    setSCouponIds([])
  }

  function persistDetailPlan() {
    if (!detailPlan || !detailDraft) return
    const p = Number.parseFloat(detailDraft.price)
    if (!detailDraft.name.trim() || !Number.isFinite(p)) {
      toast({
        title: 'Check plan details',
        description: 'Name and a valid price are required.',
        variant: 'destructive',
      })
      return
    }
    const maxC = detailDraft.maxChildren.trim()
      ? Number.parseInt(detailDraft.maxChildren.trim(), 10)
      : undefined
    const minM = detailDraft.minTermMonths.trim()
      ? Number.parseInt(detailDraft.minTermMonths.trim(), 10)
      : undefined
    const canc = detailDraft.cancellationNoticeDays.trim()
      ? Number.parseInt(detailDraft.cancellationNoticeDays.trim(), 10)
      : undefined

    const patch: Partial<MembershipPlan> = {
      name: detailDraft.name.trim(),
      description: detailDraft.description.trim() || undefined,
      price: p,
      billingCycle: detailDraft.billingCycle,
      benefits: [...detailDraft.benefits],
      allowFamilyMember: detailDraft.allowFamilyMember || undefined,
      isHouseholdOnly: detailDraft.isHouseholdOnly || undefined,
      maxChildren: Number.isFinite(maxC ?? Number.NaN) ? maxC : undefined,
      seasonalBadge: detailDraft.seasonalBadge.trim() || undefined,
      isFeatured: detailDraft.isFeatured,
      isActive: detailDraft.isActive,
      minTermMonths: Number.isFinite(minM ?? Number.NaN) ? minM : undefined,
      cancellationNoticeDays: Number.isFinite(canc ?? Number.NaN) ? canc : undefined,
    }
    if (detailDraft.billingCycle === 'MONTHLY') {
      patch.monthlyPrice = p
    }
    if (detailDraft.billingCycle === 'ANNUAL') {
      patch.annualPrice = p
    }

    const fullPatch = { ...patch, ...buildPlacementPatch(detailPlacement) }
    updateMembershipPlan(detailPlan.id, fullPatch)
    if (isAdminApiReady()) {
      const apiPatch: Record<string, unknown> = {}
      if (patch.name !== undefined) apiPatch.name = patch.name
      if (patch.description !== undefined) apiPatch.description = patch.description
      if (patch.price !== undefined) apiPatch.price = String(patch.price)
      if (patch.billingCycle !== undefined) apiPatch.billingCycle = patch.billingCycle
      if (patch.benefits !== undefined) apiPatch.benefits = patch.benefits
      if (patch.isActive !== undefined) apiPatch.isActive = patch.isActive
      if (patch.isFeatured !== undefined) apiPatch.isFeatured = patch.isFeatured
      if (patch.allowFamilyMember !== undefined) apiPatch.allowFamilyMember = patch.allowFamilyMember
      if (patch.isHouseholdOnly !== undefined) apiPatch.isHouseholdOnly = patch.isHouseholdOnly
      if (patch.maxChildren !== undefined) apiPatch.maxChildren = patch.maxChildren
      if (patch.seasonalBadge !== undefined) apiPatch.seasonalBadge = patch.seasonalBadge
      if (patch.minTermMonths !== undefined) apiPatch.minTermMonths = patch.minTermMonths
      if (patch.cancellationNoticeDays !== undefined) apiPatch.cancellationNoticeDays = patch.cancellationNoticeDays
      if (patch.monthlyPrice !== undefined) apiPatch.monthlyPrice = String(patch.monthlyPrice)
      if (patch.annualPrice !== undefined) apiPatch.annualPrice = String(patch.annualPrice)
      updatePlan(detailPlan.id, apiPatch as Parameters<typeof updatePlan>[1]).catch(() =>
        toast({ title: 'Sync error', description: 'Plan saved locally but failed to sync.', variant: 'destructive' })
      )
    }
    toast({ title: 'Plan saved', description: detailDraft.name.trim() })
    setDetailPlan(null)
  }

  function flushPlanExtras(planId: string, addons: PlanAddOnDraftRow[], couponIds: string[]) {
    for (const row of addons) {
      const addRow: PlanAddOn = {
        id: createPlanAddOnRowId(),
        planId,
        addOnId: row.addOnId,
        isIncluded: row.isIncluded,
        discountPercent: row.discountPercent,
      }
      addPlanAddOn(addRow)
    }
    for (const couponId of couponIds) {
      addPlanCoupon({
        id: createPlanCouponRowId(),
        planId,
        couponId,
      })
    }
  }

  const handleBulkSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!bulkName.trim() || !Number.isFinite(monthlyNum) || !Number.isFinite(annualNum)) {
        return
      }
      const maxChildrenParsed = bulkMaxChild.trim()
        ? Number.parseInt(bulkMaxChild.trim(), 10)
        : undefined
      const now = new Date().toISOString()
      const groupId = `mg-${Date.now()}`
      const base = bulkName.trim()

      const shared: Pick<
        MembershipPlan,
        'tenantId' | 'isActive' | 'minTermMonths' | 'cancellationNoticeDays'
      > & {
        monthlyPrice: number
        annualPrice: number
        planGroupId: string
        allowFamilyMember?: boolean
        isHouseholdOnly?: boolean
        maxChildren?: number
        isFeatured: boolean
      } = {
        tenantId: 'tenant-1',
        isActive: bulkActive,
        minTermMonths: 1,
        cancellationNoticeDays: 14,
        monthlyPrice: monthlyNum,
        annualPrice: annualNum,
        planGroupId: groupId,
        allowFamilyMember: bulkAllowFamily || undefined,
        isHouseholdOnly: bulkHousehold || undefined,
        maxChildren: Number.isFinite(maxChildrenParsed ?? Number.NaN) ? maxChildrenParsed : undefined,
        isFeatured: bulkFeatured,
      }

      const placementPatch = buildPlacementPatch(bulkPlacement)
      const monthlyPlan: MembershipPlan = {
        id: createPlanId('m'),
        name: `${base} - Monthly`,
        description: bulkMonthlyDesc.trim() || undefined,
        billingCycle: 'MONTHLY',
        price: monthlyNum,
        benefits: [...bulkMonthlyBenefits],
        ...shared,
        ...placementPatch,
        createdAt: now,
        updatedAt: now,
      }
      const annualPlan: MembershipPlan = {
        id: createPlanId('a'),
        name: `${base} - Annual`,
        description: bulkAnnualDesc.trim() || undefined,
        billingCycle: 'ANNUAL',
        price: annualNum,
        benefits: [...bulkAnnualBenefits],
        ...shared,
        minTermMonths: 12,
        cancellationNoticeDays: 30,
        ...placementPatch,
        createdAt: now,
        updatedAt: now,
      }
      if (isAdminApiReady()) {
        try {
          const [savedMonthly, savedAnnual] = await Promise.all([
            createPlan({ name: monthlyPlan.name, billingCycle: 'MONTHLY', price: String(monthlyNum), description: monthlyPlan.description, benefits: monthlyPlan.benefits, isActive: monthlyPlan.isActive, isFeatured: monthlyPlan.isFeatured, monthlyPrice: String(monthlyNum), annualPrice: String(annualNum), planGroupId: groupId, allowFamilyMember: monthlyPlan.allowFamilyMember, isHouseholdOnly: monthlyPlan.isHouseholdOnly, maxChildren: monthlyPlan.maxChildren, minTermMonths: monthlyPlan.minTermMonths, cancellationNoticeDays: monthlyPlan.cancellationNoticeDays, displayPages: monthlyPlan.displayPages, schedulingCategoryIds: monthlyPlan.schedulingCategoryIds }),
            createPlan({ name: annualPlan.name, billingCycle: 'ANNUAL', price: String(annualNum), description: annualPlan.description, benefits: annualPlan.benefits, isActive: annualPlan.isActive, isFeatured: annualPlan.isFeatured, monthlyPrice: String(monthlyNum), annualPrice: String(annualNum), planGroupId: groupId, allowFamilyMember: annualPlan.allowFamilyMember, isHouseholdOnly: annualPlan.isHouseholdOnly, maxChildren: annualPlan.maxChildren, minTermMonths: annualPlan.minTermMonths, cancellationNoticeDays: annualPlan.cancellationNoticeDays, displayPages: annualPlan.displayPages, schedulingCategoryIds: annualPlan.schedulingCategoryIds }),
          ])
          monthlyPlan.id = savedMonthly.id
          annualPlan.id = savedAnnual.id
        } catch {
          toast({ title: 'Save failed', description: 'Could not create plans. Please try again.', variant: 'destructive' })
          return
        }
      }
      addMembershipPlansBulk(monthlyPlan, annualPlan)
      flushPlanExtras(monthlyPlan.id, bulkMonthlyAddonDrafts, bulkMonthlyCouponIds)
      flushPlanExtras(annualPlan.id, bulkAnnualAddonDrafts, bulkAnnualCouponIds)
      toast({
        title: 'Monthly and annual plans created',
        description: `${monthlyPlan.name} and ${annualPlan.name} are now in the catalog.`,
      })
      resetBulkForm()
      setBulkOpen(false)
    },
    [
      addMembershipPlansBulk,
      addPlanAddOn,
      addPlanCoupon,
      bulkActive,
      bulkAllowFamily,
      bulkAnnualAddonDrafts,
      bulkAnnualBenefits,
      bulkAnnualCouponIds,
      bulkAnnualDesc,
      bulkFeatured,
      bulkHousehold,
      bulkMaxChild,
      bulkMonthlyAddonDrafts,
      bulkMonthlyBenefits,
      bulkMonthlyCouponIds,
      bulkMonthlyDesc,
      bulkName,
      annualNum,
      monthlyNum,
      toast,
    ],
  )

  async function handleSeasonalSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const p = Number.parseFloat(sPrice)
    if (!sName.trim() || !Number.isFinite(p)) return
    const maxChildrenParsed = sMaxChild.trim()
      ? Number.parseInt(sMaxChild.trim(), 10)
      : undefined
    const now = new Date().toISOString()
    const plan: MembershipPlan = {
      id: createPlanId('s'),
      tenantId: 'tenant-1',
      name: sName.trim(),
      description: sDesc.trim() || undefined,
      billingCycle: sBilling,
      price: p,
      benefits: [...sBenefits],
      isActive: sActive,
      isFeatured: sFeatured,
      isHouseholdOnly: sHousehold || undefined,
      allowFamilyMember: sAllowFamily || undefined,
      maxChildren: Number.isFinite(maxChildrenParsed ?? Number.NaN) ? maxChildrenParsed : undefined,
      seasonalBadge: sBadge.trim() || undefined,
      minTermMonths: sBilling === 'QUARTERLY' ? 3 : 1,
      cancellationNoticeDays: 14,
      createdAt: now,
      updatedAt: now,
      ...buildPlacementPatch(seasonalPlacement),
    }
    if (isAdminApiReady()) {
      try {
        const saved = await createPlan({ name: plan.name, billingCycle: plan.billingCycle, price: String(p), description: plan.description, benefits: plan.benefits, isActive: plan.isActive, isFeatured: plan.isFeatured, allowFamilyMember: plan.allowFamilyMember, isHouseholdOnly: plan.isHouseholdOnly, maxChildren: plan.maxChildren, seasonalBadge: plan.seasonalBadge, minTermMonths: plan.minTermMonths, cancellationNoticeDays: plan.cancellationNoticeDays, displayPages: plan.displayPages, schedulingCategoryIds: plan.schedulingCategoryIds })
        plan.id = saved.id
      } catch {
        toast({ title: 'Save failed', description: 'Could not create plan. Please try again.', variant: 'destructive' })
        return
      }
    }
    addMembershipPlan(plan)
    flushPlanExtras(plan.id, sAddonDrafts, sCouponIds)
    toast({ title: 'Plan created', description: plan.name })
    resetSeasonalForm()
    setSeasonalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            Memberships
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage recurring plans shown to customers and staff.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => setSeasonalOpen(true)}>
            Add single plan
          </Button>
          <Button type="button" size="sm" onClick={() => setBulkOpen(true)}>
            Bulk create (monthly + annual)
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {membershipPlans.map((plan) => (
          <Card key={plan.id} className={!plan.isActive ? 'opacity-70' : ''}>
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
              <div className="min-w-0">
                <CardTitle
                  className="text-base font-semibold"
                  style={{ fontFamily: 'var(--font-barlow)' }}
                >
                  {plan.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {subscriberCountByPlan.get(plan.id) ?? 0} active subscribers
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatPlacementSummary(plan, categories)}
                </p>
                {plan.planGroupId ? (
                  <Badge variant="outline" className="mt-1 text-[9px]">
                    Group {plan.planGroupId}
                  </Badge>
                ) : null}
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {plan.billingCycle}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">${plan.price}</span>
                <span className="text-xs text-muted-foreground">/ cycle</span>
              </div>
              <MembershipPlanExtrasCompact
                description={plan.description}
                benefits={plan.benefits}
                addOnLines={planExtrasByPlanId.get(plan.id)?.addOnLines ?? []}
                couponLines={planExtrasByPlanId.get(plan.id)?.couponLines ?? []}
                maxBenefits={5}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={plan.isActive}
                    onCheckedChange={(c) => { updateMembershipPlan(plan.id, { isActive: c }); if (isAdminApiReady()) updatePlan(plan.id, { isActive: c }).catch(() => {}) }}
                    id={`active-${plan.id}`}
                  />
                  <Label htmlFor={`active-${plan.id}`} className="text-xs">
                    Active
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={plan.isFeatured}
                    onCheckedChange={(c) => { updateMembershipPlan(plan.id, { isFeatured: c }); if (isAdminApiReady()) updatePlan(plan.id, { isFeatured: c }).catch(() => {}) }}
                    id={`feat-${plan.id}`}
                  />
                  <Label htmlFor={`feat-${plan.id}`} className="text-xs">
                    Featured
                  </Label>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => setDetailPlan(plan)}
              >
                Manage plan
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <CrudModal
        open={bulkOpen}
        onOpenChange={(o) => {
          setBulkOpen(o)
          if (!o) resetBulkForm()
        }}
        title="Bulk create membership pair"
        description="Monthly and annual SKUs share settings but can differ in description, benefit lines, play add-ons, and coupons."
        size="lg"
        variant="create"
        scrollMode="section"
        footer={
          <div className="flex w-full flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setBulkOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="bulk-membership-form">
              Create both plans
            </Button>
          </div>
        }
      >
        <form id="bulk-membership-form" onSubmit={handleBulkSubmit} className="space-y-4">
          <MembershipPlacementFields value={bulkPlacement} onChange={setBulkPlacement} />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-name">Plan name (required)</Label>
                <Input
                  id="bulk-name"
                  value={bulkName}
                  onChange={(e) => setBulkName(e.target.value)}
                  placeholder="e.g. 1 Child Membership"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Saved as &quot;{bulkName.trim() || '…'} - Monthly&quot; and &quot; - Annual&quot;.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bulk-desc-m">Monthly description</Label>
                  <Textarea
                    id="bulk-desc-m"
                    rows={2}
                    value={bulkMonthlyDesc}
                    onChange={(e) => setBulkMonthlyDesc(e.target.value)}
                    placeholder="Shown on the monthly SKU only"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-desc-a">Annual description</Label>
                  <Textarea
                    id="bulk-desc-a"
                    rows={2}
                    value={bulkAnnualDesc}
                    onChange={(e) => setBulkAnnualDesc(e.target.value)}
                    placeholder="Shown on the annual SKU only"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bulk-m">Monthly price ($)</Label>
                  <Input
                    id="bulk-m"
                    type="number"
                    min={0}
                    step={0.01}
                    value={bulkMonthly}
                    onChange={(e) => setBulkMonthly(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-a">Annual price ($)</Label>
                  <Input
                    id="bulk-a"
                    type="number"
                    min={0}
                    step={0.01}
                    value={bulkAnnual}
                    onChange={(e) => setBulkAnnual(e.target.value)}
                    required
                  />
                </div>
              </div>
              {savings != null && savings > 0 ? (
                <p
                  className={cn(
                    'inline-flex rounded-full border px-2 py-1 text-xs font-semibold',
                    'border-emerald-500/50 bg-emerald-500/15 text-emerald-950 dark:text-emerald-100',
                  )}
                >
                  Members save ${savings}/year vs monthly
                </p>
              ) : null}
              {annualAboveMonthlyYear ? (
                <p className="text-xs font-medium text-destructive">
                  Annual price is higher than 12× monthly — check your pricing.
                </p>
              ) : null}

              <MembershipBenefitPicker
                title="Monthly — benefit lines"
                description="Marketing bullets for the monthly SKU only."
                selected={bulkMonthlyBenefits}
                onChange={setBulkMonthlyBenefits}
              />
              <MembershipBenefitPicker
                title="Annual — benefit lines"
                description="Marketing bullets for the annual SKU only."
                selected={bulkAnnualBenefits}
                onChange={setBulkAnnualBenefits}
              />

              <PlanAddOnDraftPicker
                title="Monthly — play add-ons"
                helperText="Catalog add-ons for the monthly SKU (saved on create)."
                rows={bulkMonthlyAddonDrafts}
                onChange={setBulkMonthlyAddonDrafts}
              />
              <PlanCouponDraftPicker
                title="Monthly — play coupons"
                couponIds={bulkMonthlyCouponIds}
                onChange={setBulkMonthlyCouponIds}
              />

              <PlanAddOnDraftPicker
                title="Annual — play add-ons"
                helperText="Catalog add-ons for the annual SKU (saved on create)."
                rows={bulkAnnualAddonDrafts}
                onChange={setBulkAnnualAddonDrafts}
              />
              <PlanCouponDraftPicker
                title="Annual — play coupons"
                couponIds={bulkAnnualCouponIds}
                onChange={setBulkAnnualCouponIds}
              />

              <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2">
                <div>
                  <Label htmlFor="bfam">Require family member at signup</Label>
                  <p className="text-xs text-muted-foreground">Applies to both SKUs.</p>
                </div>
                <Switch id="bfam" checked={bulkAllowFamily} onCheckedChange={setBulkAllowFamily} />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2">
                <div>
                  <Label htmlFor="bhouse">Household members only</Label>
                  <p className="text-xs text-muted-foreground">Applies to both SKUs.</p>
                </div>
                <Switch id="bhouse" checked={bulkHousehold} onCheckedChange={setBulkHousehold} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bmax">Max children (optional)</Label>
                <Input
                  id="bmax"
                  inputMode="numeric"
                  placeholder="Leave blank for unlimited"
                  value={bulkMaxChild}
                  onChange={(e) => setBulkMaxChild(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Applies to both SKUs.</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="b-active" checked={bulkActive} onCheckedChange={setBulkActive} />
                <Label htmlFor="b-active">Active (both SKUs)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="bfeat" checked={bulkFeatured} onCheckedChange={setBulkFeatured} />
                <Label htmlFor="bfeat">Featured on marketing pages (both SKUs)</Label>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Live preview</p>
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{bulkName.trim() || 'Plan name'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-muted-foreground">
                  <div>
                    <p className="font-semibold text-foreground">Monthly SKU</p>
                    <p>
                      ${Number.isFinite(monthlyNum) ? monthlyNum : '—'}
                      <span className="text-muted-foreground"> /mo</span>
                    </p>
                    {bulkMonthlyDesc.trim() ? (
                      <p className="mt-1 text-foreground/90">{bulkMonthlyDesc.trim()}</p>
                    ) : null}
                    <ul className="mt-1 list-inside list-disc space-y-0.5">
                      {bulkMonthlyBenefits.length ? (
                        bulkMonthlyBenefits.map((b, i) => (
                          <li key={`m-${i}-${b.slice(0, 24)}`}>{b}</li>
                        ))
                      ) : (
                        <li className="italic">No monthly benefit lines</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Annual SKU</p>
                    <p>
                      ${Number.isFinite(annualNum) ? annualNum : '—'}
                      <span className="text-muted-foreground"> /yr</span>
                    </p>
                    {bulkAnnualDesc.trim() ? (
                      <p className="mt-1 text-foreground/90">{bulkAnnualDesc.trim()}</p>
                    ) : null}
                    {savings != null && savings > 0 ? (
                      <Badge className="mt-1 border-emerald-500/50 bg-emerald-500/15 text-emerald-950 dark:text-emerald-100">
                        Save ${savings}/year
                      </Badge>
                    ) : null}
                    <ul className="mt-1 list-inside list-disc space-y-0.5">
                      {bulkAnnualBenefits.length ? (
                        bulkAnnualBenefits.map((b, i) => (
                          <li key={`a-${i}-${b.slice(0, 24)}`}>{b}</li>
                        ))
                      ) : (
                        <li className="italic">No annual benefit lines</li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </CrudModal>

      <CrudModal
        open={seasonalOpen}
        onOpenChange={(o) => {
          setSeasonalOpen(o)
          if (!o) resetSeasonalForm()
        }}
        title="Add single plan"
        description="One SKU — same fields as bulk (single column), including play add-ons and coupons."
        size="lg"
        variant="create"
        scrollMode="section"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setSeasonalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="seasonal-plan-form">
              Save plan
            </Button>
          </div>
        }
      >
        <form id="seasonal-plan-form" onSubmit={handleSeasonalSubmit} className="space-y-4">
          <MembershipPlacementFields
            value={seasonalPlacement}
            onChange={setSeasonalPlacement}
          />
          <div className="space-y-2">
            <Label htmlFor="s-name">Name</Label>
            <Input
              id="s-name"
              value={sName}
              onChange={(e) => setSName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-desc">Description</Label>
            <Textarea id="s-desc" rows={2} value={sDesc} onChange={(e) => setSDesc(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="s-price">Price ($)</Label>
              <Input
                id="s-price"
                type="number"
                min={0}
                step={0.01}
                value={sPrice}
                onChange={(e) => setSPrice(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Billing</Label>
              <Select value={sBilling} onValueChange={(v) => setSBilling(v as BillingCycle)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-badge">Seasonal badge (optional)</Label>
            <Input
              id="s-badge"
              value={sBadge}
              onChange={(e) => setSBadge(e.target.value)}
              placeholder="e.g. Winter"
            />
          </div>

          <MembershipBenefitPicker
            title="Benefit lines"
            description="Marketing bullets for this SKU."
            selected={sBenefits}
            onChange={setSBenefits}
          />

          <PlanAddOnDraftPicker rows={sAddonDrafts} onChange={setSAddonDrafts} />
          <PlanCouponDraftPicker couponIds={sCouponIds} onChange={setSCouponIds} />

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <div>
              <Label htmlFor="s-fam">Require family member at signup</Label>
              <p className="text-xs text-muted-foreground">Member must cover linked children.</p>
            </div>
            <Switch id="s-fam" checked={sAllowFamily} onCheckedChange={setSAllowFamily} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <Label htmlFor="s-house">Household children only</Label>
            <Switch id="s-house" checked={sHousehold} onCheckedChange={setSHousehold} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-max">Max children (optional)</Label>
            <Input
              id="s-max"
              inputMode="numeric"
              placeholder="Leave blank for unlimited"
              value={sMaxChild}
              onChange={(e) => setSMaxChild(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="s-active" checked={sActive} onCheckedChange={setSActive} />
            <Label htmlFor="s-active">Active</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="s-feat" checked={sFeatured} onCheckedChange={setSFeatured} />
            <Label htmlFor="s-feat">Featured on marketing pages</Label>
          </div>
        </form>
      </CrudModal>

      <CrudModal
        open={detailPlan !== null && detailDraft !== null}
        onOpenChange={(o) => {
          if (!o) {
            setDetailPlan(null)
            setDetailDraft(null)
          }
        }}
        title={detailDraft?.name ?? 'Plan'}
        description="Edit this SKU, then manage play add-ons and coupons below."
        size="lg"
        variant="edit"
        scrollMode="section"
        footer={
          <div className="flex w-full flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDetailPlan(null)}>
              Close
            </Button>
            <Button
              type="button"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={persistDetailPlan}
            >
              Save plan changes
            </Button>
          </div>
        }
      >
        {detailPlan && detailDraft ? (
          <div className="space-y-4">
            <MembershipPlacementFields
              value={detailPlacement}
              onChange={setDetailPlacement}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="d-name">Name</Label>
                <Input
                  id="d-name"
                  value={detailDraft.name}
                  onChange={(e) => setDetailDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="d-desc">Description</Label>
                <Textarea
                  id="d-desc"
                  rows={2}
                  value={detailDraft.description}
                  onChange={(e) =>
                    setDetailDraft((d) => (d ? { ...d, description: e.target.value } : d))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="d-price">Price ($)</Label>
                <Input
                  id="d-price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={detailDraft.price}
                  onChange={(e) => setDetailDraft((d) => (d ? { ...d, price: e.target.value } : d))}
                />
              </div>
              <div className="space-y-2">
                <Label>Billing cycle</Label>
                <Select
                  value={detailDraft.billingCycle}
                  onValueChange={(v) =>
                    setDetailDraft((d) =>
                      d ? { ...d, billingCycle: v as BillingCycle } : d,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="ANNUAL">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="d-min">Min term (months)</Label>
                <Input
                  id="d-min"
                  inputMode="numeric"
                  value={detailDraft.minTermMonths}
                  onChange={(e) =>
                    setDetailDraft((d) => (d ? { ...d, minTermMonths: e.target.value } : d))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="d-cancel">Cancellation notice (days)</Label>
                <Input
                  id="d-cancel"
                  inputMode="numeric"
                  value={detailDraft.cancellationNoticeDays}
                  onChange={(e) =>
                    setDetailDraft((d) =>
                      d ? { ...d, cancellationNoticeDays: e.target.value } : d,
                    )
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="d-badge">Seasonal badge (optional)</Label>
                <Input
                  id="d-badge"
                  value={detailDraft.seasonalBadge}
                  onChange={(e) =>
                    setDetailDraft((d) => (d ? { ...d, seasonalBadge: e.target.value } : d))
                  }
                  placeholder="e.g. Winter"
                />
              </div>
            </div>

            <MembershipBenefitPicker
              title="Benefit lines"
              selected={detailDraft.benefits}
              onChange={(next) =>
                setDetailDraft((d) => (d ? { ...d, benefits: next } : d))
              }
            />

            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <Label htmlFor="d-fam">Require family member at signup</Label>
              <Switch
                id="d-fam"
                checked={detailDraft.allowFamilyMember}
                onCheckedChange={(v) =>
                  setDetailDraft((d) => (d ? { ...d, allowFamilyMember: Boolean(v) } : d))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <Label htmlFor="d-house">Household children only</Label>
              <Switch
                id="d-house"
                checked={detailDraft.isHouseholdOnly}
                onCheckedChange={(v) =>
                  setDetailDraft((d) => (d ? { ...d, isHouseholdOnly: Boolean(v) } : d))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-max">Max children (optional)</Label>
              <Input
                id="d-max"
                inputMode="numeric"
                placeholder="Leave blank for unlimited"
                value={detailDraft.maxChildren}
                onChange={(e) =>
                  setDetailDraft((d) => (d ? { ...d, maxChildren: e.target.value } : d))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="d-active"
                checked={detailDraft.isActive}
                onCheckedChange={(v) =>
                  setDetailDraft((d) => (d ? { ...d, isActive: Boolean(v) } : d))
                }
              />
              <Label htmlFor="d-active">Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="d-feat"
                checked={detailDraft.isFeatured}
                onCheckedChange={(v) =>
                  setDetailDraft((d) => (d ? { ...d, isFeatured: Boolean(v) } : d))
                }
              />
              <Label htmlFor="d-feat">Featured on marketing pages</Label>
            </div>

            <div className="border-t border-border pt-4">
              <p className="mb-3 text-sm font-semibold text-foreground">Linked extras</p>
              <PlanAddOnManager planId={detailPlan.id} />
              <PlanCouponManager planId={detailPlan.id} />
            </div>
          </div>
        ) : null}
      </CrudModal>
    </div>
  )
}
