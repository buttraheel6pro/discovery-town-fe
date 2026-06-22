/** Subscriptions API — membership enrollment. */
import { apiClient } from '@/lib/api/client'
import { API_PATHS } from '@/lib/constants/api'
import type { ContactSubscription, MembershipPlan } from '@/lib/types'

export interface EnrollSubscriptionPayload {
  contactId: string
  planId: string
  paymentReferenceId?: string
  paymentGateway?: 'STRIPE' | 'SQUARE' | 'CASH'
  currentPeriodStart: string
  currentPeriodEnd: string
}

export interface ApiSubscriptionRow {
  id: string
  tenantId: string
  contactId: string
  planId: string
  status: ContactSubscription['status']
  currentPeriodStart: string
  currentPeriodEnd: string
  plan?: MembershipPlan
}

export async function enrollSubscription(
  payload: EnrollSubscriptionPayload,
): Promise<ApiSubscriptionRow> {
  const { data } = await apiClient.post<ApiSubscriptionRow>(API_PATHS.subscriptions, payload)
  return data
}

export async function getActiveSubscription(contactId: string): Promise<ApiSubscriptionRow | null> {
  const { data } = await apiClient.get<ApiSubscriptionRow | null>(
    `${API_PATHS.subscriptions}/contact/${contactId}`,
  )
  return data
}
