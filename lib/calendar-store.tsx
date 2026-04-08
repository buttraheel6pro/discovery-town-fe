/** Calendar & private hire store — inquiries and calendar filter UI state. */
'use client'

import React, { createContext, useContext, useState } from 'react'

import { privateHireInquiries as initialInquiries } from '@/lib/mock-data'
import type { CalendarFilters, PrivateHireInquiry } from '@/lib/types'
import { PrivateHireStatusEnum } from '@/lib/types'

interface CalendarStore {
  inquiries: PrivateHireInquiry[]
  addInquiry: (inquiry: PrivateHireInquiry) => void
  approveInquiry: (id: string, depositAmount: number, internalNotes: string) => void
  rejectInquiry: (id: string, reason: string) => void
  updateInternalNotes: (id: string, notes: string) => void
  calendarFilters: CalendarFilters
  setCalendarFilters: (f: Partial<CalendarFilters>) => void
}

const CalendarContext = createContext<CalendarStore | null>(null)

export function CalendarProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [inquiries, setInquiries] = useState<PrivateHireInquiry[]>(() =>
    initialInquiries.map((i) => ({
      ...i,
      service: { ...i.service },
    })),
  )
  const [calendarFilters, setCalendarFiltersState] = useState<CalendarFilters>({
    locationId: null,
    serviceTypes: [],
    staffId: null,
  })

  function addInquiry(inquiry: PrivateHireInquiry) {
    setInquiries((prev) => [
      { ...inquiry, service: { ...inquiry.service } },
      ...prev,
    ])
  }

  function approveInquiry(id: string, depositAmount: number, internalNotes: string) {
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

  function rejectInquiry(id: string, reason: string) {
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
