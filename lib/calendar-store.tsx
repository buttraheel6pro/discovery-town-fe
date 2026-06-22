/** Calendar & private hire store — inquiries and calendar filter UI state. */
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

import {
  listPrivateHireInquiries,
  mapApiPrivateHireInquiry,
  stubPrivateHireService,
  updatePrivateHireStatus,
} from '@/lib/api/private-hire.api'
import { isAdminApiReady, isApiEnabled } from '@/lib/api/client'
import { privateHireInquiries as initialInquiries } from '@/lib/mock-data'
import type { CalendarFilters, PrivateHireInquiry } from '@/lib/types'
import { PrivateHireStatusEnum } from '@/lib/types'

interface CalendarStore {
  inquiries: PrivateHireInquiry[]
  addInquiry: (inquiry: PrivateHireInquiry) => void
  approveInquiry: (id: string, depositAmount: number, internalNotes: string) => Promise<void>
  rejectInquiry: (id: string, reason: string) => Promise<void>
  updateInternalNotes: (id: string, notes: string) => void
  calendarFilters: CalendarFilters
  setCalendarFilters: (f: Partial<CalendarFilters>) => void
}

const CalendarContext = createContext<CalendarStore | null>(null)

export function CalendarProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [inquiries, setInquiries] = useState<PrivateHireInquiry[]>(() =>
    isApiEnabled
      ? []
      : initialInquiries.map((i) => ({
          ...i,
          service: { ...i.service },
        })),
  )
  const [calendarFilters, setCalendarFiltersState] = useState<CalendarFilters>({
    locationId: null,
    serviceTypes: [],
    staffId: null,
  })

  useEffect(() => {
    if (!isAdminApiReady()) return

    listPrivateHireInquiries()
      .then((rows) => {
        if (rows.length === 0) return
        setInquiries(
          rows.map((row) =>
            mapApiPrivateHireInquiry(row, {
              service: stubPrivateHireService(row.serviceId),
              locationName: 'Discovery Town',
            }),
          ),
        )
      })
      .catch(() => {
        // Stay on mock/empty list when admin API is unavailable
      })
  }, [])

  function addInquiry(inquiry: PrivateHireInquiry) {
    setInquiries((prev) => [
      { ...inquiry, service: { ...inquiry.service } },
      ...prev,
    ])
  }

  async function approveInquiry(id: string, depositAmount: number, internalNotes: string) {
    if (isAdminApiReady()) {
      try {
        const updated = await updatePrivateHireStatus(id, {
          status: 'APPROVED',
          depositAmount: String(depositAmount),
          internalNotes: internalNotes || undefined,
        })
        const existing = inquiries.find((i) => i.id === id)
        const mapped = mapApiPrivateHireInquiry(updated, {
          service: existing?.service ?? stubPrivateHireService(updated.serviceId),
          locationName: existing?.locationName ?? 'Discovery Town',
        })
        setInquiries((prev) => prev.map((i) => (i.id === id ? mapped : i)))
        return
      } catch {
        // Fall through to local update
      }
    }

    setInquiries((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              status: PrivateHireStatusEnum.APPROVED,
              depositAmount,
              internalNotes: internalNotes || i.internalNotes,
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'Admin',
            }
          : i,
      ),
    )
  }

  async function rejectInquiry(id: string, reason: string) {
    if (isAdminApiReady()) {
      try {
        const updated = await updatePrivateHireStatus(id, {
          status: 'REJECTED',
          internalNotes: reason,
        })
        const existing = inquiries.find((i) => i.id === id)
        const mapped = mapApiPrivateHireInquiry(updated, {
          service: existing?.service ?? stubPrivateHireService(updated.serviceId),
          locationName: existing?.locationName ?? 'Discovery Town',
        })
        setInquiries((prev) => prev.map((i) => (i.id === id ? mapped : i)))
        return
      } catch {
        // Fall through to local update
      }
    }

    setInquiries((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              status: PrivateHireStatusEnum.REJECTED,
              internalNotes: reason,
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'Admin',
            }
          : i,
      ),
    )
  }

  function updateInternalNotes(id: string, notes: string) {
    setInquiries((prev) =>
      prev.map((i) => (i.id === id ? { ...i, internalNotes: notes } : i)),
    )
  }

  function setCalendarFilters(f: Partial<CalendarFilters>) {
    setCalendarFiltersState((prev) => ({ ...prev, ...f }))
  }

  return (
    <CalendarContext.Provider
      value={{
        inquiries,
        addInquiry,
        approveInquiry,
        rejectInquiry,
        updateInternalNotes,
        calendarFilters,
        setCalendarFilters,
      }}
    >
      {children}
    </CalendarContext.Provider>
  )
}

export function useCalendar(): CalendarStore {
  const ctx = useContext(CalendarContext)
  if (!ctx) {
    throw new Error('useCalendar must be used within CalendarProvider')
  }
  return ctx
}
