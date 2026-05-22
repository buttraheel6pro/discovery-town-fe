/** Persist membership plan catalog edits (placement, pricing, flags) to localStorage. */
import { setLocalStorageJson } from '@/lib/browser-local-storage-json'
import type { BillingCycle, MembershipPlan } from '@/lib/types'

export const CLIENT_MEMBERSHIP_PLANS_STORAGE_KEY =
  'discovery-town-membership-plans'

const VALID_BILLING_CYCLES = new Set<BillingCycle>([
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'ANNUAL',
])

function clonePlan(plan: MembershipPlan): MembershipPlan {
  return {
    ...plan,
    benefits: [...plan.benefits],
    displayPages: plan.displayPages ? [...plan.displayPages] : undefined,
    schedulingCategoryIds: plan.schedulingCategoryIds
      ? [...plan.schedulingCategoryIds]
      : undefined,
  }
}

/** Lenient parse so admin-created plans are not dropped on reload. */
function normalizeMembershipPlan(value: unknown): MembershipPlan | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }
  const row = value as Record<string, unknown>
  if (typeof row.id !== 'string' || typeof row.name !== 'string') {
    return null
  }
  const priceRaw = row.price
  const price =
    typeof priceRaw === 'number'
      ? priceRaw
      : Number.parseFloat(String(priceRaw ?? ''))
  if (!Number.isFinite(price)) {
    return null
  }
  const billingRaw = row.billingCycle
  const billingCycle =
    typeof billingRaw === 'string' && VALID_BILLING_CYCLES.has(billingRaw as BillingCycle)
      ? (billingRaw as BillingCycle)
      : 'MONTHLY'
  const benefits = Array.isArray(row.benefits)
    ? row.benefits.filter((entry): entry is string => typeof entry === 'string')
    : []
  const now = new Date().toISOString()

  return clonePlan({
    ...(row as MembershipPlan),
    id: row.id,
    tenantId: typeof row.tenantId === 'string' ? row.tenantId : 'tenant-1',
    name: row.name,
    billingCycle,
    price,
    benefits,
    isActive: row.isActive !== false,
    isFeatured: Boolean(row.isFeatured),
    createdAt: typeof row.createdAt === 'string' ? row.createdAt : now,
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : now,
  })
}

export function readPersistedMembershipPlans(): MembershipPlan[] | null {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.localStorage.getItem(CLIENT_MEMBERSHIP_PLANS_STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return null
    }
    const plans = parsed
      .map(normalizeMembershipPlan)
      .filter((plan): plan is MembershipPlan => plan != null)
    return plans.length > 0 ? plans : null
  } catch {
    return null
  }
}

export function mergePersistedMembershipPlansWithSeed(
  seed: readonly MembershipPlan[],
  persisted: readonly MembershipPlan[],
): MembershipPlan[] {
  const persistedById = new Map(persisted.map((plan) => [plan.id, clonePlan(plan)]))
  const mergedSeed = seed.map((seedPlan) => {
    const fromStore = persistedById.get(seedPlan.id)
    return fromStore ? { ...clonePlan(seedPlan), ...fromStore } : clonePlan(seedPlan)
  })
  const seedIds = new Set(seed.map((plan) => plan.id))
  const extras = persisted
    .filter((plan) => !seedIds.has(plan.id))
    .map(clonePlan)
  return [...extras, ...mergedSeed]
}

export function loadInitialMembershipPlans(
  seed: readonly MembershipPlan[],
): MembershipPlan[] {
  const persisted = readPersistedMembershipPlans()
  if (!persisted) {
    return seed.map(clonePlan)
  }
  return mergePersistedMembershipPlansWithSeed(seed, persisted)
}

export function persistMembershipPlans(plans: readonly MembershipPlan[]): boolean {
  return setLocalStorageJson(
    CLIENT_MEMBERSHIP_PLANS_STORAGE_KEY,
    plans.map(clonePlan),
  )
}
