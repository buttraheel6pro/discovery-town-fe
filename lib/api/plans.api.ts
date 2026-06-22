/**
 * Membership plans API functions.
 */
import { apiClient, type PaginatedResponse } from '@/lib/api/client'
import { mapPlan, type ApiPlan } from '@/lib/api/mappers'
import { API_PATHS } from '@/lib/constants/api'
import type { MembershipPlan } from '@/lib/types'

interface FetchPlansParams {
  isActive?: boolean
  isFeatured?: boolean
  displayPages?: string[]
  schedulingCategoryIds?: string[]
  billingCycle?: string
  page?: number
  limit?: number
}

export async function fetchPlans(params: FetchPlansParams = {}): Promise<MembershipPlan[]> {
  const { data } = await apiClient.get<PaginatedResponse<ApiPlan>>(API_PATHS.plans, {
    params: { limit: 100, ...params },
  })
  return data.items.map(mapPlan)
}
