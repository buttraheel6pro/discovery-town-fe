/** Membership plan CRUD API integration for admin management. */
import { apiClient } from '@/lib/api/client'

const PLANS = '/plans'

export interface CreatePlanPayload {
  name: string
  billingCycle: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
  price: string
  description?: string
  benefits?: string[]
  isActive?: boolean
  isFeatured?: boolean
  displayOrder?: string
  minTermMonths?: number
  cancellationNoticeDays?: number
  planGroupId?: string
  monthlyPrice?: string
  annualPrice?: string
  allowFamilyMember?: boolean
  isHouseholdOnly?: boolean
  maxChildren?: number
  seasonalBadge?: string
  displayPages?: string[]
  schedulingCategoryIds?: string[]
}

export interface ApiPlan {
  id: string
  name: string
  billingCycle: string
  price: string
  [key: string]: unknown
}

export async function createPlan(payload: CreatePlanPayload): Promise<ApiPlan> {
  const res = await apiClient.post<ApiPlan>(PLANS, payload)
  return res.data
}

export async function updatePlan(id: string, patch: Partial<CreatePlanPayload>): Promise<ApiPlan> {
  const res = await apiClient.patch<ApiPlan>(`${PLANS}/${id}`, patch)
  return res.data
}

export async function deletePlan(id: string): Promise<void> {
  await apiClient.delete(`${PLANS}/${id}`)
}
