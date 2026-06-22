/** Service-slots API integration for admin slot management. */
import { apiClient } from '@/lib/api/client'
import { API_PATHS } from '@/lib/constants/api'

export interface CreateSlotPayload {
  serviceId: string
  locationId: string
  staffId?: string | null
  startAt: string
  endAt: string
  capacityOverride?: number
  priceOverride?: string
  notes?: string | null
}

export interface ApiSlot {
  id: string
  serviceId: string
  locationId: string
  staffId?: string | null
  startAt: string
  endAt: string
  capacityOverride?: number | null
  priceOverride?: string | null
  bookedCount: number
  checkInCount?: number | null
  status: string
  isActive?: boolean
  notes?: string | null
}

export async function createSlot(payload: CreateSlotPayload): Promise<ApiSlot> {
  const body: Record<string, unknown> = {
    serviceId: payload.serviceId,
    locationId: payload.locationId,
    startAt: payload.startAt,
    endAt: payload.endAt,
  }
  if (payload.staffId) body.staffId = payload.staffId
  if (payload.capacityOverride !== undefined) body.capacityOverride = payload.capacityOverride
  if (payload.priceOverride) body.priceOverride = payload.priceOverride
  if (payload.notes) body.notes = payload.notes
  const response = await apiClient.post(API_PATHS.serviceSlots, body)
  return response.data as ApiSlot
}

export async function cancelSlot(id: string, reason?: string): Promise<void> {
  await apiClient.post(`${API_PATHS.serviceSlots}/${id}/cancel`, { reason })
}
