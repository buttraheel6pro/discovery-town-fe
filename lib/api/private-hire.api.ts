/**
 * Private hire inquiry API — consumer submit + admin list/review.
 */
import { apiClient, type PaginatedResponse } from '@/lib/api/client'
import { extractListRows } from '@/lib/api/pagination'
import { API_PATHS } from '@/lib/constants/api'
import type {
  PrivateHireEventType,
  PrivateHireInquiry,
  PrivateHireStatus,
  SchedulingService,
} from '@/lib/types'
import { SchedulingBookingModeEnum, SchedulingServiceTypeEnum } from '@/lib/types'

export interface SubmitPrivateHirePayload {
  contactName: string
  contactEmail: string
  contactPhone?: string
  eventType: PrivateHireEventType
  serviceId: string
  locationId: string
  preferredDate: string
  alternateDate?: string
  guestCount: number
  notes?: string
}

export interface ApiPrivateHireInquiry {
  id: string
  contactName: string
  contactEmail: string
  contactPhone?: string | null
  eventType: PrivateHireEventType
  serviceId: string
  locationId: string
  preferredDate: string
  alternateDate?: string | null
  guestCount: number
  notes?: string | null
  status: PrivateHireStatus
  depositAmount?: unknown
  internalNotes?: string | null
  submittedAt: string
  reviewedAt?: string | null
  reviewedByStaffId?: string | null
}

export interface UpdatePrivateHireStatusPayload {
  status: 'APPROVED' | 'REJECTED'
  internalNotes?: string
  depositAmount?: string
}

function toIsoString(value: unknown): string {
  if (typeof value === 'string') return value
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

function toNumberOrNull(value: unknown): number | null {
  if (value == null) return null
  const n = typeof value === 'number' ? value : parseFloat(String(value))
  return Number.isFinite(n) ? n : null
}

/** Minimal service placeholder when admin list rows lack embedded service data. */
export function stubPrivateHireService(serviceId: string, name = 'Private hire package'): SchedulingService {
  return {
    id: serviceId,
    locationId: null,
    categoryId: '',
    category: { id: '', name: 'Private hire', icon: null, displayOrder: 0, isActive: true },
    serviceType: SchedulingServiceTypeEnum.PRIVATE_HIRE,
    bookingMode: SchedulingBookingModeEnum.REQUEST,
    name,
    description: null,
    durationMinutes: 120,
    capacity: 50,
    basePrice: 0,
    subscriptionPrice: 0,
    requiresWaiver: false,
    ageMin: null,
    ageMax: null,
    isActive: true,
    minDurationMinutes: null,
    maxDurationMinutes: null,
    slotIncrementMinutes: null,
    maxConcurrent: null,
    minAdvanceHours: null,
    maxAdvanceHours: null,
    pricingModel: 'flat',
    imageUrl: null,
    tags: [],
    addOns: [],
  }
}

export function mapApiPrivateHireInquiry(
  row: ApiPrivateHireInquiry,
  ctx: { service: SchedulingService; locationName: string },
): PrivateHireInquiry {
  return {
    id: row.id,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone ?? '',
    eventType: row.eventType,
    serviceId: row.serviceId,
    service: { ...ctx.service },
    locationId: row.locationId,
    locationName: ctx.locationName,
    preferredDate: toIsoString(row.preferredDate),
    alternateDate: row.alternateDate ? toIsoString(row.alternateDate) : null,
    guestCount: row.guestCount,
    notes: row.notes ?? null,
    status: row.status,
    depositAmount: toNumberOrNull(row.depositAmount),
    internalNotes: row.internalNotes ?? null,
    submittedAt: toIsoString(row.submittedAt),
    reviewedAt: row.reviewedAt ? toIsoString(row.reviewedAt) : null,
    reviewedBy: row.reviewedByStaffId ?? null,
  }
}

export async function submitPrivateHireInquiry(
  payload: SubmitPrivateHirePayload,
): Promise<ApiPrivateHireInquiry> {
  const { data } = await apiClient.post<ApiPrivateHireInquiry>(API_PATHS.privateHire, payload, {
    skipAuth: true,
  } as never)
  return data
}

export async function listPrivateHireInquiries(params?: {
  status?: PrivateHireStatus
  locationId?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}): Promise<ApiPrivateHireInquiry[]> {
  const { data } = await apiClient.get<PaginatedResponse<ApiPrivateHireInquiry>>(
    API_PATHS.privateHire,
    { params: { limit: 100, ...params } },
  )
  return extractListRows<ApiPrivateHireInquiry>(data)
}

export async function updatePrivateHireStatus(
  id: string,
  payload: UpdatePrivateHireStatusPayload,
): Promise<ApiPrivateHireInquiry> {
  const { data } = await apiClient.patch<ApiPrivateHireInquiry>(
    `${API_PATHS.privateHire}/${id}/status`,
    payload,
  )
  return data
}
