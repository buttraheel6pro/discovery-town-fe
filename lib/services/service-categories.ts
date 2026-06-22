/** Scheduling service categories API integration for admin catalog filters. */
import { apiClient } from '@/lib/api/client'
import { extractListRows, extractPaginationMeta } from '@/lib/api/pagination'
import { API_PATHS } from '@/lib/constants/api'
import {
  apiSchedulingServiceCategorySchema,
  type ApiSchedulingServiceCategory,
} from '@/lib/schemas/services/categories-list'
import type {
  CreateServiceCategoryPayload,
  PaginationMeta,
  SchedulingCategory,
} from '@/lib/types'

export interface ListServiceCategoriesParams {
  page?: number
  limit?: number
}

export interface ListServiceCategoriesResult {
  readonly categories: SchedulingCategory[]
  readonly meta: PaginationMeta | null
}

type DecimalLike = number | string | { d?: number[]; e?: number; s?: number }

function normalizeParams(
  params: ListServiceCategoriesParams,
): Required<ListServiceCategoriesParams> {
  return {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
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

function mapApiCategory(item: ApiSchedulingServiceCategory): SchedulingCategory {
  return {
    id: item.id,
    name: item.name,
    icon: item.icon ?? null,
    imageUrl: item.imageUrl ?? undefined,
    displayOrder: toNumber(item.displayOrder),
    isActive: item.isActive,
  }
}

function mapResponseToCategories(payload: unknown): SchedulingCategory[] {
  return extractListRows<ApiSchedulingServiceCategory>(payload).map((row) =>
    mapApiCategory(apiSchedulingServiceCategorySchema.parse(row)),
  )
}

export async function listServiceCategories(
  params: ListServiceCategoriesParams = {},
): Promise<ListServiceCategoriesResult> {
  const normalized = normalizeParams(params)
  const response = await apiClient.get(API_PATHS.serviceCategories, {
    params: normalized,
  })

  return {
    categories: mapResponseToCategories(response.data),
    meta: extractPaginationMeta(response.data),
  }
}

export interface UpdateServiceCategoryPayload {
  name?: string
  icon?: string | null
  imageUrl?: string | null
  displayOrder?: number | string
  isActive?: boolean
  description?: string
  requiresAttendee?: boolean
  membersOnly?: boolean
  freeInfantMonths?: number
  depositPercent?: number
  specialInstructionsEnabled?: boolean
  waitlistEnabled?: boolean
  allowFamilyMember?: boolean
  requireCheckInBeforeRebook?: boolean
  catalogSlug?: string
}

export async function updateServiceCategory(
  id: string,
  patch: UpdateServiceCategoryPayload,
): Promise<SchedulingCategory> {
  const response = await apiClient.patch(`${API_PATHS.serviceCategories}/${id}`, patch)
  const raw = response.data as unknown
  const direct = apiSchedulingServiceCategorySchema.safeParse(raw)
  if (direct.success) return mapApiCategory(direct.data)
  const wrapped = apiSchedulingServiceCategorySchema.safeParse(
    typeof raw === 'object' && raw !== null && 'data' in raw
      ? (raw as { data: unknown }).data
      : raw,
  )
  if (!wrapped.success) throw new Error('Invalid update category response')
  return mapApiCategory(wrapped.data)
}

export async function deleteServiceCategory(id: string): Promise<void> {
  await apiClient.delete(`${API_PATHS.serviceCategories}/${id}`)
}

export async function createServiceCategory(
  payload: CreateServiceCategoryPayload,
): Promise<SchedulingCategory> {
  const normalizedDisplayOrder = payload.displayOrder.trim()
  const response = await apiClient.post(API_PATHS.serviceCategories, {
    ...payload,
    displayOrder: normalizedDisplayOrder,
  })
  const raw = response.data as unknown

  const direct = apiSchedulingServiceCategorySchema.safeParse(raw)
  if (direct.success) {
    return mapApiCategory(direct.data)
  }

  const wrapped = apiSchedulingServiceCategorySchema.safeParse(
    typeof raw === 'object' && raw !== null && 'data' in raw
      ? (raw as { data: unknown }).data
      : raw,
  )
  if (!wrapped.success) {
    throw new Error('Invalid create category response')
  }

  return mapApiCategory(wrapped.data)
}
