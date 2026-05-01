/** Scheduling services API integration for catalog listing. */
import { apiClient } from '@/lib/api/client'
import { API_PATHS } from '@/lib/constants/api'
import {
  schedulingServicesListSchema,
  type ApiSchedulingService,
  type SchedulingServicesListResponse,
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

function mapResponseToServices(parsed: SchedulingServicesListResponse): SchedulingService[] {
  const rows = Array.isArray(parsed) ? parsed : parsed.data
  return rows.map(mapApiSchedulingService)
}

export async function listSchedulingServices(
  params: ListSchedulingServicesParams = {},
): Promise<ListSchedulingServicesResult> {
  const normalized = normalizeParams(params)
  const response = await apiClient.get(API_PATHS.services, {
    params: normalized,
  })
  const parsed = schedulingServicesListSchema.parse(response.data)

  return {
    services: mapResponseToServices(parsed),
    meta: Array.isArray(parsed) ? null : (parsed.meta ?? null),
  }
}
