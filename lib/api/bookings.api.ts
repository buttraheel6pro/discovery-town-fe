/**
 * Bookings API — consumer create + admin/account list reads + open availability.
 */
import { apiClient, type PaginatedResponse } from '@/lib/api/client'
import { extractListRows } from '@/lib/api/pagination'
import { API_PATHS } from '@/lib/constants/api'
import type {
  AvailableWindowsResponse,
  SchedulingBooking,
  SchedulingService,
  SchedulingServiceType,
} from '@/lib/types'

export interface CreateBookingPayload {
  bookingType: string
  serviceSlotId?: string
  serviceId: string
  contactId: string
  participantContactId?: string
  locationId: string
  startAt?: string
  endAt?: string
  guestCount?: number
  notes?: string
  metadata?: Record<string, unknown>
  source?: string
  addOns?: Array<{ addOnId: string; quantity: number }>
}

function mapBookingType(serviceType: string): string {
  const map: Record<string, string> = {
    GYM_CLASS: 'CLASS',
    SWIM_CLASS: 'CLASS',
    ENRICHMENT_CLASS: 'CLASS',
    WORKSHOP: 'CLASS',
    FITNESS_ASSESSMENT: 'CLASS',
    TUTORING_SESSION: 'CLASS',
    TEST_PREP: 'CLASS',
    COURT_BOOKING: 'COURT',
    COACHING_SESSION: 'COACHING',
    OPEN_PLAY: 'OPEN_PLAY',
    CAMP: 'CAMP',
    PARTY_PACKAGE: 'PARTY',
    PRIVATE_HIRE: 'PRIVATE_HIRE',
  }
  return map[serviceType] ?? 'OPEN_PLAY'
}

export function buildCreateBookingPayload(input: {
  serviceType: string
  serviceId: string
  serviceSlotId?: string | null
  contactId: string
  locationId: string
  startAt?: string | null
  endAt?: string | null
  guestCount?: number
  notes?: string | null
  source?: string
  addOnIds?: string[]
}): CreateBookingPayload {
  return {
    bookingType: mapBookingType(input.serviceType),
    serviceId: input.serviceId,
    serviceSlotId: input.serviceSlotId ?? undefined,
    contactId: input.contactId,
    locationId: input.locationId,
    startAt: input.startAt ?? undefined,
    endAt: input.endAt ?? undefined,
    guestCount: input.guestCount,
    notes: input.notes ?? undefined,
    source: input.source,
    addOns: input.addOnIds?.map((addOnId) => ({ addOnId, quantity: 1 })),
  }
}

export interface ApiBookingRow {
  id: string
  bookingType: string
  serviceSlotId?: string | null
  serviceId: string
  contactId: string
  locationId: string
  status: SchedulingBooking['status']
  startAt: string
  endAt: string
  guestCount?: number | null
  totalAmount?: number | string | null
  balanceDue?: number | string | null
  notes?: string | null
  createdAt: string
  service?: Partial<SchedulingService>
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  const n = parseFloat(String(value))
  return Number.isFinite(n) ? n : 0
}

export function mapApiBooking(
  row: ApiBookingRow,
  ctx?: { service?: SchedulingService; locationName?: string; contactName?: string },
): SchedulingBooking {
  const service = ctx?.service ?? (row.service as SchedulingService | undefined)
  return {
    id: row.id,
    bookingType: row.bookingType as SchedulingServiceType,
    serviceSlotId: row.serviceSlotId ?? null,
    serviceSlot: null,
    serviceId: row.serviceId,
    service: service as SchedulingService,
    contactId: row.contactId,
    contactName: ctx?.contactName ?? 'Guest',
    locationId: row.locationId,
    locationName: ctx?.locationName ?? '',
    status: row.status,
    startAt: row.startAt,
    endAt: row.endAt,
    guestCount: row.guestCount ?? 1,
    totalAmount: toNumber(row.totalAmount),
    balanceDue: toNumber(row.balanceDue),
    checkedInAt: null,
    cancelledAt: null,
    cancellationReason: null,
    notes: row.notes ?? null,
    specialInstructions: null,
    source: 'ONLINE',
    addOns: [],
    createdAt: row.createdAt,
    couponCode: null,
    actedByStaffId: null,
  }
}

export async function createBooking(payload: CreateBookingPayload): Promise<ApiBookingRow> {
  const { data } = await apiClient.post<ApiBookingRow>(API_PATHS.bookings, payload, {
    skipAuth: true,
  } as never)
  return data
}

export async function listBookings(params?: {
  page?: number
  limit?: number
  contactId?: string
  status?: string
}): Promise<ApiBookingRow[]> {
  const { data } = await apiClient.get<PaginatedResponse<ApiBookingRow>>(API_PATHS.bookings, {
    params: { limit: 100, ...params },
  })
  return extractListRows<ApiBookingRow>(data)
}

export async function fetchOpenAvailability(
  serviceId: string,
  date: string,
): Promise<AvailableWindowsResponse> {
  const { data } = await apiClient.get<AvailableWindowsResponse>(
    `${API_PATHS.serviceSlots}/open-availability`,
    {
      params: { serviceId, date },
      skipAuth: true,
    } as never,
  )
  return data
}
