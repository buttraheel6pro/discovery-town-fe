/** Scheduling services API integration for catalog listing. */
import { apiClient } from '@/lib/api/client'
import { extractListRows, extractPaginationMeta } from '@/lib/api/pagination'
import { API_PATHS } from '@/lib/constants/api'
import {
  apiSchedulingServiceSchema,
  type ApiSchedulingService,
} from '@/lib/schemas/services/list'
import type {
  PaginationMeta,
  SchedulingBookingMode,
  SchedulingCategory,
  SchedulingService,
  SchedulingServiceType,
} from '@/lib/types'

export interface ListSchedulingServicesParams {
  page?: number
  limit?: number
  serviceType?: SchedulingServiceType
  categoryId?: string
  locationId?: string
  isActive?: boolean
  ageMin?: number
  ageMax?: number
  search?: string
}

export interface ListSchedulingServicesResult {
  readonly services: SchedulingService[]
  readonly meta: PaginationMeta | null
}

type DecimalLike = number | string | { d?: number[]; e?: number; s?: number }

function normalizeParams(
  params: ListSchedulingServicesParams,
): Required<Pick<ListSchedulingServicesParams, 'page' | 'limit'>> & ListSchedulingServicesParams {
  return {
    page: params.page ?? 1,
    limit: params.limit ?? 100,
    serviceType: params.serviceType,
    categoryId: params.categoryId,
    locationId: params.locationId,
    isActive: params.isActive,
    ageMin: params.ageMin,
    ageMax: params.ageMax,
    search: params.search,
  }
}

function toNumber(value: DecimalLike | null | undefined): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  if (value && typeof value === 'object' && Array.isArray(value.d) && value.d.length > 0) {
    const [firstChunk, ...otherChunks] = value.d
    const normalizedHead = Math.abs(Math.trunc(firstChunk)).toString()
    const normalizedTail = otherChunks
      .map((chunk) => Math.abs(Math.trunc(chunk)).toString().padStart(7, '0'))
      .join('')
    const coefficient = `${normalizedHead}${normalizedTail}`
    const exponent = value.e ?? 0
    const shift = exponent - coefficient.length + 1
    const negative = (value.s ?? 1) < 0 ? -1 : 1
    const absolute = Number.parseFloat(coefficient) * Math.pow(10, shift)
    return Number.isFinite(absolute) ? negative * absolute : 0
  }

  return 0
}

function mapApiSchedulingService(item: ApiSchedulingService): SchedulingService {
  const bookingMode: SchedulingBookingMode = item.bookingMode
  return {
    id: item.id,
    locationId: item.locationId ?? null,
    categoryId: item.categoryId,
    category: {
      id: item.categoryId,
      name: 'Uncategorized',
      icon: null,
      displayOrder: 0,
      isActive: true,
    } satisfies SchedulingCategory,
    serviceType: item.serviceType,
    bookingMode,
    name: item.name,
    description: item.description ?? null,
    durationMinutes: item.durationMinutes,
    capacity: item.capacity,
    basePrice: toNumber(item.basePrice),
    subscriptionPrice: toNumber(item.subscriptionPrice),
    requiresWaiver: item.requiresWaiver,
    ageMin: item.ageMin ?? null,
    ageMax: item.ageMax ?? null,
    isActive: item.isActive,
    minDurationMinutes: item.minDurationMinutes ?? null,
    maxDurationMinutes: item.maxDurationMinutes ?? null,
    slotIncrementMinutes: item.slotIncrementMinutes ?? null,
    maxConcurrent: item.maxConcurrent ?? null,
    minAdvanceHours: item.minAdvanceHours ?? null,
    maxAdvanceHours: item.maxAdvanceHours ?? null,
    pricingModel: bookingMode === 'OPEN' ? 'per_hour' : 'flat',
    imageUrl: null,
    tags: [],
    addOns: [],
  }
}

function mapResponseToServices(payload: unknown): SchedulingService[] {
  return extractListRows<ApiSchedulingService>(payload).map((row) =>
    mapApiSchedulingService(apiSchedulingServiceSchema.parse(row)),
  )
}

function slotIncrementToEnum(minutes: number | null | undefined): 'NONE' | 'HALF_HOUR' | 'HOUR' {
  if (minutes === 30) return 'HALF_HOUR'
  if (minutes === 60) return 'HOUR'
  return 'NONE'
}

export interface CreateSchedulingServicePayload {
  categoryId: string
  serviceType: string
  name: string
  description?: string | null
  durationMinutes: number
  capacity: number
  basePrice: number
  subscriptionPrice?: number | null
  locationId?: string | null
  isActive?: boolean
  ageMin?: number | null
  ageMax?: number | null
  requiresWaiver?: boolean
  bookingMode?: string
  slotIncrementMinutes?: number | null
  minDurationMinutes?: number | null
  maxDurationMinutes?: number | null
  maxConcurrent?: number | null
  minAdvanceHours?: number | null
  maxAdvanceHours?: number | null
  isPackageService?: boolean
  siblingPrice?: string
  freeAdultCount?: number
  additionalAdultPrice?: string
  minSeats?: number
  pricePerHour?: string
  minChildSeats?: number | null
  maxChildSeats?: number | null
  minAdultSeats?: number | null
  maxAdultSeats?: number | null
  additionalChildPrice?: string
  maxPassCount?: number | null
  eventBookingScheduleMode?: string
  eventVisibility?: string
}

function buildServiceApiBody(payload: CreateSchedulingServicePayload): Record<string, unknown> {
  const body: Record<string, unknown> = {
    categoryId: payload.categoryId,
    serviceType: payload.serviceType,
    name: payload.name,
    durationMinutes: payload.durationMinutes,
    capacity: payload.capacity,
    basePrice: String(payload.basePrice),
    slotIncrement: slotIncrementToEnum(payload.slotIncrementMinutes),
  }
  if (payload.description != null) body.description = payload.description
  if (payload.subscriptionPrice != null) body.subscriptionPrice = String(payload.subscriptionPrice)
  if (payload.locationId != null) body.locationId = payload.locationId
  if (payload.isActive !== undefined) body.isActive = payload.isActive
  if (payload.ageMin != null) body.ageMin = payload.ageMin
  if (payload.ageMax != null) body.ageMax = payload.ageMax
  if (payload.requiresWaiver !== undefined) body.requiresWaiver = payload.requiresWaiver
  if (payload.bookingMode) body.bookingMode = payload.bookingMode
  if (payload.minDurationMinutes != null) body.minDurationMinutes = payload.minDurationMinutes
  if (payload.maxDurationMinutes != null) body.maxDurationMinutes = payload.maxDurationMinutes
  if (payload.maxConcurrent != null) body.maxConcurrent = payload.maxConcurrent
  if (payload.minAdvanceHours != null) body.minAdvanceHours = payload.minAdvanceHours
  if (payload.maxAdvanceHours != null) body.maxAdvanceHours = payload.maxAdvanceHours
  if (payload.isPackageService !== undefined) body.isPackageService = payload.isPackageService
  if (payload.siblingPrice) body.siblingPrice = payload.siblingPrice
  if (payload.freeAdultCount !== undefined) body.freeAdultCount = payload.freeAdultCount
  if (payload.additionalAdultPrice) body.additionalAdultPrice = payload.additionalAdultPrice
  if (payload.minSeats !== undefined) body.minSeats = payload.minSeats
  if (payload.pricePerHour) body.pricePerHour = payload.pricePerHour
  if (payload.minChildSeats != null) body.minChildSeats = payload.minChildSeats
  if (payload.maxChildSeats != null) body.maxChildSeats = payload.maxChildSeats
  if (payload.minAdultSeats != null) body.minAdultSeats = payload.minAdultSeats
  if (payload.maxAdultSeats != null) body.maxAdultSeats = payload.maxAdultSeats
  if (payload.additionalChildPrice) body.additionalChildPrice = payload.additionalChildPrice
  if (payload.maxPassCount != null) body.maxPassCount = payload.maxPassCount
  if (payload.eventBookingScheduleMode) body.eventBookingScheduleMode = payload.eventBookingScheduleMode
  if (payload.eventVisibility) body.eventVisibility = payload.eventVisibility
  return body
}

export async function createSchedulingService(
  payload: CreateSchedulingServicePayload,
): Promise<SchedulingService> {
  const response = await apiClient.post(API_PATHS.services, buildServiceApiBody(payload))
  const raw = response.data as ApiSchedulingService
  return mapApiSchedulingService(raw)
}

export async function updateSchedulingService(
  id: string,
  patch: Partial<CreateSchedulingServicePayload>,
): Promise<SchedulingService> {
  const body: Record<string, unknown> = {}
  if (patch.categoryId !== undefined) body.categoryId = patch.categoryId
  if (patch.serviceType !== undefined) body.serviceType = patch.serviceType
  if (patch.name !== undefined) body.name = patch.name
  if (patch.description !== undefined) body.description = patch.description
  if (patch.durationMinutes !== undefined) body.durationMinutes = patch.durationMinutes
  if (patch.capacity !== undefined) body.capacity = patch.capacity
  if (patch.basePrice !== undefined) body.basePrice = String(patch.basePrice)
  if (patch.subscriptionPrice !== undefined) body.subscriptionPrice = patch.subscriptionPrice != null ? String(patch.subscriptionPrice) : null
  if (patch.locationId !== undefined) body.locationId = patch.locationId
  if (patch.isActive !== undefined) body.isActive = patch.isActive
  if (patch.ageMin !== undefined) body.ageMin = patch.ageMin
  if (patch.ageMax !== undefined) body.ageMax = patch.ageMax
  if (patch.requiresWaiver !== undefined) body.requiresWaiver = patch.requiresWaiver
  if (patch.bookingMode !== undefined) body.bookingMode = patch.bookingMode
  if (patch.slotIncrementMinutes !== undefined) body.slotIncrement = slotIncrementToEnum(patch.slotIncrementMinutes)
  if (patch.minDurationMinutes !== undefined) body.minDurationMinutes = patch.minDurationMinutes
  if (patch.maxDurationMinutes !== undefined) body.maxDurationMinutes = patch.maxDurationMinutes
  if (patch.maxConcurrent !== undefined) body.maxConcurrent = patch.maxConcurrent
  if (patch.minAdvanceHours !== undefined) body.minAdvanceHours = patch.minAdvanceHours
  if (patch.maxAdvanceHours !== undefined) body.maxAdvanceHours = patch.maxAdvanceHours
  if (patch.isPackageService !== undefined) body.isPackageService = patch.isPackageService
  if (patch.siblingPrice !== undefined) body.siblingPrice = patch.siblingPrice
  if (patch.freeAdultCount !== undefined) body.freeAdultCount = patch.freeAdultCount
  if (patch.additionalAdultPrice !== undefined) body.additionalAdultPrice = patch.additionalAdultPrice
  if (patch.minSeats !== undefined) body.minSeats = patch.minSeats
  if (patch.pricePerHour !== undefined) body.pricePerHour = patch.pricePerHour
  if (patch.minChildSeats !== undefined) body.minChildSeats = patch.minChildSeats
  if (patch.maxChildSeats !== undefined) body.maxChildSeats = patch.maxChildSeats
  if (patch.minAdultSeats !== undefined) body.minAdultSeats = patch.minAdultSeats
  if (patch.maxAdultSeats !== undefined) body.maxAdultSeats = patch.maxAdultSeats
  if (patch.additionalChildPrice !== undefined) body.additionalChildPrice = patch.additionalChildPrice
  if (patch.maxPassCount !== undefined) body.maxPassCount = patch.maxPassCount
  if (patch.eventBookingScheduleMode !== undefined) body.eventBookingScheduleMode = patch.eventBookingScheduleMode
  if (patch.eventVisibility !== undefined) body.eventVisibility = patch.eventVisibility
  const response = await apiClient.patch(`${API_PATHS.services}/${id}`, body)
  const raw = response.data as ApiSchedulingService
  return mapApiSchedulingService(raw)
}

export async function deleteSchedulingService(id: string): Promise<void> {
  await apiClient.delete(`${API_PATHS.services}/${id}`)
}

export async function listSchedulingServices(
  params: ListSchedulingServicesParams = {},
): Promise<ListSchedulingServicesResult> {
  const normalized = normalizeParams(params)
  const response = await apiClient.get(API_PATHS.services, {
    params: normalized,
  })

  return {
    services: mapResponseToServices(response.data),
    meta: extractPaginationMeta(response.data),
  }
}
