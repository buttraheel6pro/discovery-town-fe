/** Reports & analytics store — filters, mock report slices, and invoice list. */
'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import {
  fetchClientInsights,
  fetchReferralOverview,
  fetchReportDashboard,
  fetchRevenueSummary,
  fetchTopContacts,
} from '@/lib/api/reports.api'
import { isAdminApiReady } from '@/lib/api/client'

import {
  cohortMatrixMock,
  instructorStatsMock,
  kpiDashboardMock,
  payrollMock,
  referralOverviewMock,
  reportClientInsightsMock,
  reportsInvoices,
  revenueSummaryMock,
  topContactsMock,
} from '@/lib/mock-data'
import type {
  CohortMatrix,
  DateRange,
  DateRangePreset,
  InstructorStats,
  Invoice,
  KpiDashboard,
  PayrollEntry,
  ReferralOverview,
  ReportClientInsights,
  ReportFilters,
  RevenueSummary,
  TopContact,
} from '@/lib/types'
import { InvoiceStatusEnum } from '@/lib/types'

export function getPresetRange(preset: DateRangePreset): DateRange {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0] ?? ''
  const todayStr = fmt(today)

  switch (preset) {
    case 'today':
      return { from: todayStr, to: todayStr }
    case 'this_week': {
      const mon = new Date(today)
      mon.setDate(today.getDate() - today.getDay() + 1)
      return { from: fmt(mon), to: todayStr }
    }
    case 'this_month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      return { from: fmt(start), to: todayStr }
    }
    case 'last_30_days': {
      const start = new Date(today)
      start.setDate(today.getDate() - 29)
      return { from: fmt(start), to: todayStr }
    }
    case 'last_3_months': {
      const start = new Date(today)
      start.setMonth(today.getMonth() - 3)
      return { from: fmt(start), to: todayStr }
    }
    default:
      return { from: todayStr, to: todayStr }
  }
}

interface ReportsStore {
  filters: ReportFilters
  setPreset: (preset: DateRangePreset) => void
  setCustomDateRange: (range: DateRange) => void
  setLocationIds: (ids: string[]) => void

  kpiDashboard: KpiDashboard
  revenueSummary: RevenueSummary
  reportClientInsights: ReportClientInsights
  topContacts: TopContact[]
  cohortMatrix: CohortMatrix
  referralOverview: ReferralOverview
  payroll: PayrollEntry[]
  instructorStats: InstructorStats[]

  invoices: Invoice[]
  addInvoice: (inv: Invoice) => void
  updateInvoice: (id: string, updates: Partial<Invoice>) => void
  sendInvoice: (id: string) => void
  markInvoicePaid: (id: string) => void
  voidInvoice: (id: string) => void
}

const ReportsContext = createContext<ReportsStore | null>(null)

export function ReportsProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: getPresetRange('last_30_days'),
    preset: 'last_30_days',
    locationIds: [],
  })
  const [invoiceList, setInvoiceList] = useState<Invoice[]>(() =>
    reportsInvoices.map((i) => ({
      ...i,
      lineItems: i.lineItems.map((li) => ({ ...li })),
    })),
  )

  const [kpiDashboard, setKpiDashboard] = useState<KpiDashboard>(kpiDashboardMock)
  const [revenueSummary, setRevenueSummary] = useState<RevenueSummary>(revenueSummaryMock)
  const [reportClientInsights, setReportClientInsights] =
    useState<ReportClientInsights>(reportClientInsightsMock)
  const [topContacts, setTopContacts] = useState<TopContact[]>(topContactsMock)
  const [referralOverview, setReferralOverview] = useState<ReferralOverview>(referralOverviewMock)

  useEffect(() => {
    if (!isAdminApiReady()) return
    const range = {
      from: filters.dateRange.from,
      to: filters.dateRange.to,
      locationId: filters.locationIds[0],
    }
    void Promise.all([
      fetchReportDashboard(range),
      fetchRevenueSummary(range),
      fetchClientInsights(range),
      fetchTopContacts(10),
      fetchReferralOverview(range),
    ])
      .then(([dashboard, revenue, clients, contacts, referrals]) => {
        setKpiDashboard(dashboard)
        setRevenueSummary(revenue)
        setReportClientInsights(clients)
        setTopContacts(contacts)
        setReferralOverview(referrals)
      })
      .catch(() => {})
  }, [filters.dateRange.from, filters.dateRange.to, filters.locationIds])

  const setPreset = useCallback((preset: DateRangePreset) => {
    setFilters((prev) => ({
      ...prev,
      preset,
      dateRange: getPresetRange(preset),
    }))
  }, [])

  const setCustomDateRange = useCallback((range: DateRange) => {
    setFilters((prev) => ({ ...prev, preset: 'custom', dateRange: range }))
  }, [])

  const setLocationIds = useCallback((ids: string[]) => {
    setFilters((prev) => ({ ...prev, locationIds: ids }))
  }, [])

  const addInvoice = useCallback((inv: Invoice) => {
    setInvoiceList((prev) => [inv, ...prev])
  }, [])

  const updateInvoice = useCallback((id: string, updates: Partial<Invoice>) => {
    const nowIso = new Date().toISOString()
    setInvoiceList((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates, updatedAt: nowIso } : i)),
    )
  }, [])

  const sendInvoice = useCallback(
    (id: string) => {
      updateInvoice(id, {
        status: InvoiceStatusEnum.SENT,
        sentAt: new Date().toISOString(),
      })
    },
    [updateInvoice],
  )

  const markInvoicePaid = useCallback((id: string) => {
    const nowIso = new Date().toISOString()
    setInvoiceList((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              status: InvoiceStatusEnum.PAID,
              paidDate: nowIso,
              paidAmount: i.total,
              updatedAt: nowIso,
            }
          : i,
      ),
    )
  }, [])

  const voidInvoice = useCallback(
    (id: string) => {
      updateInvoice(id, { status: InvoiceStatusEnum.VOID })
    },
    [updateInvoice],
  )

  const value = useMemo<ReportsStore>(
    () => ({
      filters,
      setPreset,
      setCustomDateRange,
      setLocationIds,
      kpiDashboard,
      revenueSummary,
      reportClientInsights,
      topContacts,
      cohortMatrix: cohortMatrixMock,
      referralOverview,
      payroll: payrollMock,
      instructorStats: instructorStatsMock,
      invoices: invoiceList,
      addInvoice,
      updateInvoice,
      sendInvoice,
      markInvoicePaid,
      voidInvoice,
    }),
    [
      filters,
      invoiceList,
      kpiDashboard,
      revenueSummary,
      reportClientInsights,
      topContacts,
      referralOverview,
      setPreset,
      setCustomDateRange,
      setLocationIds,
      addInvoice,
      updateInvoice,
      sendInvoice,
      markInvoicePaid,
      voidInvoice,
    ],
  )

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>
}

export function useReports(): ReportsStore {
  const ctx = useContext(ReportsContext)
  if (!ctx) throw new Error('useReports must be used within ReportsProvider')
  return ctx
}
