/** Reports API — dashboard and analytics slices for admin reports module. */
import { apiClient } from '@/lib/api/client'
import { API_PATHS } from '@/lib/constants/api'
import type {
  KpiDashboard,
  ReferralOverview,
  ReportClientInsights,
  RevenueSummary,
  TopContact,
} from '@/lib/types'

export interface ReportDateRange {
  from: string
  to: string
  locationId?: string
}

export async function fetchReportDashboard(range: ReportDateRange): Promise<KpiDashboard> {
  const { data } = await apiClient.get<KpiDashboard>(`${API_PATHS.reports}/dashboard`, {
    params: range,
  })
  return data
}

export async function fetchRevenueSummary(range: ReportDateRange): Promise<RevenueSummary> {
  const { data } = await apiClient.get<RevenueSummary>(`${API_PATHS.reports}/revenue`, {
    params: range,
  })
  return data
}

export async function fetchClientInsights(range: ReportDateRange): Promise<ReportClientInsights> {
  const { data } = await apiClient.get<ReportClientInsights>(`${API_PATHS.reports}/clients`, {
    params: range,
  })
  return data
}

export async function fetchTopContacts(limit = 10): Promise<TopContact[]> {
  const { data } = await apiClient.get<TopContact[]>(`${API_PATHS.reports}/clients/top`, {
    params: { limit },
  })
  return data
}

export async function fetchReferralOverview(range: ReportDateRange): Promise<ReferralOverview> {
  const { data } = await apiClient.get<ReferralOverview>(`${API_PATHS.reports}/referrals`, {
    params: range,
  })
  return data
}
