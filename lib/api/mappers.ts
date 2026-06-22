/**
 * Adapter functions: transform raw backend API responses into the frontend TypeScript types
 * used throughout the app.  All numeric fields that come as Decimal strings are parsed here.
 */
import {
  inferOpenPlaySessionPassOfferingKind,
  isOpenPlaySessionPassOffering,
} from '@/lib/open-play-session-pass'
import type { CatalogSlug } from '@/lib/catalog-slugs'
import type {
  EventPackage,
  EventPackageAddOn,
  MembershipPlan,
  SchedulingCategory,
  SchedulingOccasion,
  SchedulingService,
} from '@/lib/types'

// ─── raw backend shapes ────────────────────────────────────────────────────────

export interface ApiCategory {
  id: string
  name: string
  slug?: string | null
  icon?: string | null
  imageUrl?: string | null
  color?: string | null
  catalogSlug?: string | null
  displayOrder?: string | number | null
  isActive: boolean
  requiresAttendee?: boolean | null
  membersOnly?: boolean | null
  freeInfantMonths?: number | null
  depositPercent?: number | null
  specialInstructionsEnabled?: boolean | null
  waitlistEnabled?: boolean | null
  allowFamilyMember?: boolean | null
  requireCheckInBeforeRebook?: boolean | null
  description?: string | null
}

export interface ApiService {
  id: string
  locationId?: string | null
  categoryId: string
  category?: ApiCategory | null
  serviceType: string
  bookingMode: string
  name: string
  description?: string | null
  shortDescription?: string | null
  slug?: string | null
  imageUrl?: string | null
  galleryImages?: string[] | null
  durationMinutes: number
  capacity: number
  basePrice: unknown
  memberPrice?: unknown
  subscriptionPrice?: unknown
  requiresWaiver?: boolean | null
  isFeatured?: boolean | null
  ageMin?: number | null
  ageMax?: number | null
  isActive: boolean
  minDurationMinutes?: number | null
  maxDurationMinutes?: number | null
  slotIncrement?: string | null // enum: NONE | HALF_HOUR | HOUR
  maxConcurrent?: number | null
  minAdvanceHours?: number | null
  maxAdvanceHours?: number | null
  rating?: number | null
  reviewCount?: number | null
  amenities?: string[] | null
  floor?: string | null
  sport?: string | null
  eventBookingScheduleMode?: string | null
  eventVisibility?: string | null
  eventsOnly?: boolean | null
  isPackageService?: boolean | null
  bookingOfferingKind?: string | null
  siblingPrice?: string | number | null
  maxPassCount?: number | null
  freeAdultCount?: number | null
  additionalAdultPrice?: string | number | null
  pricingModel?: string | null
  metadata?: Record<string, unknown> | null
  tags?: string[] | null
}

export interface ApiEventPackage {
  id: string
  tenantId?: string
  serviceId: string
  tier: 'SILVER' | 'GOLD' | 'PLATINUM'
  name: string
  basePrice: unknown
  features?: string[] | null
  addOns?: Array<{ addOnId: string; included: boolean }> | null
  isActive: boolean
  createdAt: string
  displayPages?: Array<'gym' | 'play' | 'events'> | null
  schedulingCategoryIds?: string[] | null
  depositAmount?: string | number | null
  depositNonRefundable?: boolean | null
  isWholeVenue?: boolean | null
  requiresApproval?: boolean | null
  minChildSeats?: number | null
  maxChildSeats?: number | null
  minAdultSeats?: number | null
  maxAdultSeats?: number | null
  additionalChildPrice?: string | number | null
  additionalAdultPrice?: string | number | null
  duration?: number | null
  setupTime?: number | null
  staffCount?: number | null
  partyRooms?: number | null
  packageAddOns?: Array<{ addOnId: string; included: boolean; addOn?: unknown }> | null
}

export interface ApiOccasion {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
  isActive?: boolean
}

export interface ApiPlan {
  id: string
  tenantId: string
  name: string
  description?: string | null
  billingCycle: string
  price: unknown
  benefits?: string[] | null
  isActive: boolean
  isFeatured?: boolean | null
  displayOrder?: string | number | null
  minTermMonths?: number | null
  cancellationNoticeDays?: number | null
  planGroupId?: string | null
  monthlyPrice?: string | number | null
  annualPrice?: string | number | null
  stripePriceIdMonthly?: string | null
  stripePriceIdAnnual?: string | null
  allowFamilyMember?: boolean | null
  isHouseholdOnly?: boolean | null
  maxChildren?: number | null
  seasonalBadge?: string | null
  displayPages?: string[] | null
  schedulingCategoryIds?: string[] | null
  createdAt: string
  updatedAt: string
}

// ─── mappers ──────────────────────────────────────────────────────────────────

function num(v: unknown, fallback = 0): number {
  if (v == null) return fallback
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback
  // Handle Prisma Decimal JSON: {s: sign, e: exponent, d: [coefficient, ...]}
  if (typeof v === 'object' && !Array.isArray(v)) {
    const dec = v as {s?: number; e?: number; d?: number[]}
    if (Array.isArray(dec.d) && dec.d.length > 0 && typeof dec.e === 'number') {
      const coeff = dec.d[0]
      const exp = dec.e
      const digits = coeff === 0 ? 1 : Math.floor(Math.log10(coeff)) + 1
      const val = coeff * Math.pow(10, exp - digits + 1) * (dec.s === -1 ? -1 : 1)
      return Number.isFinite(val) ? val : fallback
    }
    return fallback
  }
  const n = parseFloat(String(v))
  return Number.isFinite(n) ? n : fallback
}

/** Maps SlotIncrement enum → minutes (used for frontend slotIncrementMinutes field). */
function slotIncrementToMinutes(v: string | null | undefined): number | null {
  if (!v || v === 'NONE') return null
  if (v === 'HALF_HOUR') return 30
  if (v === 'HOUR') return 60
  return null
}

export function mapCategory(raw: ApiCategory): SchedulingCategory {
  return {
    id: raw.id,
    name: raw.name,
    icon: raw.icon ?? null,
    imageUrl: raw.imageUrl ?? undefined,
    displayOrder: num(raw.displayOrder),
    isActive: raw.isActive,
    catalogSlug: (raw.catalogSlug as CatalogSlug) ?? undefined,
    description: raw.description ?? undefined,
    requiresAttendee: raw.requiresAttendee ?? undefined,
    membersOnly: raw.membersOnly ?? undefined,
    freeInfantMonths: raw.freeInfantMonths ?? undefined,
    depositPercent: raw.depositPercent ?? undefined,
    specialInstructionsEnabled: raw.specialInstructionsEnabled ?? undefined,
    waitlistEnabled: raw.waitlistEnabled ?? undefined,
    allowFamilyMember: raw.allowFamilyMember ?? undefined,
    requireCheckInBeforeRebook: raw.requireCheckInBeforeRebook ?? undefined,
  }
}

function inferBookingOfferingKind(
  raw: ApiService,
  category: Pick<SchedulingCategory, 'id' | 'name'>,
): SchedulingService['bookingOfferingKind'] {
  return inferOpenPlaySessionPassOfferingKind(raw, category)
}

function inferPricingModel(raw: ApiService): SchedulingService['pricingModel'] {
  const explicit = raw.pricingModel
  if (explicit === 'flat' || explicit === 'per_hour' || explicit === 'per_person') {
    return explicit
  }
  if (raw.bookingMode === 'OPEN' && raw.maxPassCount != null && raw.maxPassCount > 1) {
    return 'flat'
  }
  if (raw.bookingMode === 'OPEN') {
    return 'per_person'
  }
  return 'flat'
}

function optionalDecimalString(value: string | number | null | undefined): string | undefined {
  if (value == null || value === '') {
    return undefined
  }
  return String(value)
}

export function mapService(raw: ApiService, categoryMap: Map<string, SchedulingCategory>): SchedulingService {
  const category = (raw.category ? mapCategory(raw.category) : categoryMap.get(raw.categoryId)) ?? {
    id: raw.categoryId,
    name: '',
    icon: null,
    displayOrder: 0,
    isActive: true,
  }

  const bookingOfferingKind = inferBookingOfferingKind(raw, category)
  const sessionPassOffering = isOpenPlaySessionPassOffering({
    id: raw.id,
    serviceType: raw.serviceType as SchedulingService['serviceType'],
    bookingMode: raw.bookingMode as SchedulingService['bookingMode'],
    bookingOfferingKind,
    category,
    categoryId: raw.categoryId,
    isPackageService: raw.isPackageService ?? undefined,
  })

  return {
    id: raw.id,
    locationId: raw.locationId ?? null,
    categoryId: raw.categoryId,
    category,
    serviceType: raw.serviceType as SchedulingService['serviceType'],
    bookingMode: raw.bookingMode as SchedulingService['bookingMode'],
    bookingOfferingKind,
    name: raw.name,
    description: raw.description ?? null,
    durationMinutes: raw.durationMinutes,
    capacity: raw.capacity,
    basePrice: num(raw.basePrice),
    subscriptionPrice: raw.subscriptionPrice != null ? num(raw.subscriptionPrice) : null,
    requiresWaiver: raw.requiresWaiver ?? false,
    ageMin: raw.ageMin ?? null,
    ageMax: raw.ageMax ?? null,
    isActive: raw.isActive,
    minDurationMinutes: raw.minDurationMinutes ?? null,
    maxDurationMinutes: raw.maxDurationMinutes ?? null,
    slotIncrementMinutes: slotIncrementToMinutes(raw.slotIncrement),
    maxConcurrent: raw.maxConcurrent ?? null,
    minAdvanceHours: raw.minAdvanceHours ?? null,
    maxAdvanceHours: raw.maxAdvanceHours ?? null,
    pricingModel: inferPricingModel(raw),
    imageUrl: raw.imageUrl ?? null,
    tags: raw.tags ?? [],
    rating: raw.rating ?? undefined,
    reviewCount: raw.reviewCount ?? undefined,
    amenities: raw.amenities ?? undefined,
    sport: raw.sport ?? undefined,
    eventsOnly: raw.eventsOnly ?? undefined,
    isPackageService: raw.isPackageService ?? undefined,
    eventBookingScheduleMode: raw.eventBookingScheduleMode as SchedulingService['eventBookingScheduleMode'] ?? undefined,
    siblingPrice:
      optionalDecimalString(raw.siblingPrice) ??
      (sessionPassOffering ? '10' : undefined),
    maxPassCount: raw.maxPassCount ?? undefined,
    freeAdultCount: raw.freeAdultCount ?? (sessionPassOffering ? 2 : undefined),
    additionalAdultPrice:
      optionalDecimalString(raw.additionalAdultPrice) ??
      (sessionPassOffering ? '10' : undefined),
  } as SchedulingService
}

export function mapEventPackage(raw: ApiEventPackage): EventPackage {
  // The backend returns add-ons in `packageAddOns` (with nested addOn) or `addOns` (simple)
  const addOns: EventPackageAddOn[] = (raw.packageAddOns ?? raw.addOns ?? []).map((a) => ({
    addOnId: a.addOnId,
    included: a.included,
  }))

  return {
    id: raw.id,
    serviceId: raw.serviceId,
    tier: raw.tier,
    name: raw.name,
    basePrice: num(raw.basePrice),
    features: raw.features ?? [],
    addOns,
    isActive: raw.isActive,
    createdAt: raw.createdAt,
    displayPages: raw.displayPages ?? undefined,
    schedulingCategoryIds: raw.schedulingCategoryIds ?? undefined,
    depositAmount: raw.depositAmount != null ? num(raw.depositAmount) : undefined,
    depositNonRefundable: raw.depositNonRefundable ?? undefined,
  }
}

export function mapOccasion(raw: ApiOccasion): SchedulingOccasion {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? '',
    image: raw.imageUrl ?? '',
  }
}

export function mapPlan(raw: ApiPlan): MembershipPlan {
  return {
    id: raw.id,
    tenantId: raw.tenantId,
    name: raw.name,
    description: raw.description ?? undefined,
    billingCycle: raw.billingCycle as MembershipPlan['billingCycle'],
    price: num(raw.price),
    benefits: raw.benefits ?? [],
    isActive: raw.isActive,
    isFeatured: raw.isFeatured ?? false,
    minTermMonths: raw.minTermMonths ?? undefined,
    cancellationNoticeDays: raw.cancellationNoticeDays ?? undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    planGroupId: raw.planGroupId ?? undefined,
    monthlyPrice: raw.monthlyPrice != null ? num(raw.monthlyPrice) : undefined,
    annualPrice: raw.annualPrice != null ? num(raw.annualPrice) : undefined,
    stripePriceIdMonthly: raw.stripePriceIdMonthly ?? undefined,
    stripePriceIdAnnual: raw.stripePriceIdAnnual ?? undefined,
    allowFamilyMember: raw.allowFamilyMember ?? undefined,
    isHouseholdOnly: raw.isHouseholdOnly ?? undefined,
    maxChildren: raw.maxChildren ?? undefined,
    seasonalBadge: raw.seasonalBadge ?? undefined,
    displayPages: (raw.displayPages ?? []) as MembershipPlan['displayPages'],
    schedulingCategoryIds: raw.schedulingCategoryIds ?? undefined,
  }
}
