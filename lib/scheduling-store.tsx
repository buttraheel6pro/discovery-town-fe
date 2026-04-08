/** Scheduling store — local in-memory state for slots, bookings, and waitlist. */
'use client'

import React, { createContext, useContext, useMemo, useState } from 'react'

import {
  schedulingBookings as initialBookings,
  eventPackagesMock as initialPackages,
  schedulingServices as initialServices,
  schedulingSlots as initialSlots,
  schedulingWaitlistEntries as initialWaitlist,
} from '@/lib/mock-data'
import type {
  EventPackage,
  SchedulingBooking,
  SchedulingService,
  SchedulingSlot,
  SchedulingWaitlistEntry,
  WaitlistStatus,
} from '@/lib/types'

interface SchedulingStore {
  services: SchedulingService[]
  slots: SchedulingSlot[]
  bookings: SchedulingBooking[]
  waitlist: SchedulingWaitlistEntry[]
  packages: EventPackage[]
  addBooking: (booking: SchedulingBooking) => void
  cancelBooking: (bookingId: string, reason: string) => void
  cancelSlot: (slotId: string, reason: string) => void
  publishSlot: (slotId: string) => void
  draftSlot: (slotId: string) => void
  checkIn: (bookingId: string) => void
  addToWaitlist: (entry: SchedulingWaitlistEntry) => void
  removeFromWaitlist: (entryId: string) => void
  promoteWaitlist: (slotId: string) => void
  addSlot: (slot: SchedulingSlot) => void
  addService: (service: SchedulingService) => void
  updateService: (serviceId: string, patch: Partial<SchedulingService>) => void
  removeService: (serviceId: string) => void
  addPackage: (pkg: EventPackage) => void
  updatePackage: (packageId: string, patch: Partial<EventPackage>) => void
  removePackage: (packageId: string) => void
  duplicatePackage: (packageId: string) => void
}

const SchedulingContext = createContext<SchedulingStore | null>(null)

export function SchedulingProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [services, setServices] = useState<SchedulingService[]>(() =>
    initialServices.map((s) => ({ ...s })),
  )
  const [slots, setSlots] = useState<SchedulingSlot[]>(() =>
    initialSlots.map((sl) => ({ ...sl, service: { ...sl.service } })),
  )
  const [bookings, setBookings] = useState<SchedulingBooking[]>(() =>
    initialBookings.map((b) => ({
      ...b,
      service: { ...b.service },
      serviceSlot: b.serviceSlot ? { ...b.serviceSlot, service: { ...b.serviceSlot.service } } : null,
    })),
  )
  const [waitlist, setWaitlist] = useState<SchedulingWaitlistEntry[]>(
    initialWaitlist,
  )
  const [packages, setPackages] = useState<EventPackage[]>(() =>
    initialPackages.map((p) => ({ ...p, addOns: p.addOns.slice(), features: p.features.slice() })),
  )

  const value = useMemo<SchedulingStore>(() => {
    function createPackageId(): string {
      return `pkg-${Math.random().toString(16).slice(2, 10)}`
    }

    function addBooking(booking: SchedulingBooking) {
      setBookings((prev) => [booking, ...prev])

      if (!booking.serviceSlotId) return

      setSlots((prev) =>
        prev.map((slot) => {
          if (slot.id !== booking.serviceSlotId) return slot

          const bookedCount = slot.bookedCount + Math.max(1, booking.guestCount)
          const isFull = bookedCount >= slot.effectiveCapacity
          const status = isFull ? 'FULL' : slot.status

          return { ...slot, bookedCount, status }
        }),
      )
    }

    function cancelBooking(bookingId: string, reason: string) {
      const cancelledAt = new Date().toISOString()

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                status: 'CANCELLED',
                cancelledAt,
                cancellationReason: reason,
              }
            : b,
        ),
      )
    }

    function cancelSlot(slotId: string, reason: string) {
      setSlots((prev) =>
        prev.map((s) =>
          s.id === slotId ? { ...s, status: 'CANCELLED', notes: reason } : s,
        ),
      )
    }

    function publishSlot(slotId: string) {
      setSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, isActive: true } : s)),
      )
    }

    function draftSlot(slotId: string) {
      setSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, isActive: false } : s)),
      )
    }

    function checkIn(bookingId: string) {
      const checkedInAt = new Date().toISOString()
      let slotIdForBooking: string | null = null

      setBookings((prev) => {
        const target = prev.find((b) => b.id === bookingId) ?? null
        if (!target) return prev
        if (target.checkedInAt) return prev
        slotIdForBooking = target.serviceSlotId
        return prev.map((b) => (b.id === bookingId ? { ...b, checkedInAt } : b))
      })

      if (!slotIdForBooking) return

      setSlots((prev) =>
        prev.map((s) =>
          s.id === slotIdForBooking
            ? { ...s, checkInCount: (s.checkInCount ?? 0) + 1 }
            : s,
        ),
      )
    }

    function addToWaitlist(entry: SchedulingWaitlistEntry) {
      setWaitlist((prev) => [...prev, entry])
    }

    function removeFromWaitlist(entryId: string) {
      setWaitlist((prev) => prev.filter((e) => e.id !== entryId))
    }

    function promoteWaitlist(slotId: string) {
      setWaitlist((prev) => {
        const firstWaiting = prev
          .filter((e) => e.serviceSlotId === slotId && e.status === 'WAITING')
          .sort((a, b) => a.position - b.position)[0]

        if (!firstWaiting) return prev

        const status: WaitlistStatus = 'NOTIFIED'
        const notifiedAt = new Date().toISOString()

        return prev.map((e) =>
          e.id === firstWaiting.id ? { ...e, status, notifiedAt } : e,
        )
      })
    }

    function addSlot(slot: SchedulingSlot) {
      const normalized: SchedulingSlot = {
        ...slot,
        isActive: slot.isActive ?? true,
        checkInCount: slot.checkInCount ?? 0,
      }
      setSlots((prev) => [normalized, ...prev])
    }

    function addService(service: SchedulingService) {
      setServices((prev) => [service, ...prev])
    }

    function updateService(serviceId: string, patch: Partial<SchedulingService>) {
      setServices((prev) =>
        prev.map((s) => (s.id === serviceId ? { ...s, ...patch } : s)),
      )
      setSlots((prev) =>
        prev.map((slot) =>
          slot.serviceId === serviceId
            ? { ...slot, service: { ...slot.service, ...patch } }
            : slot,
        ),
      )
      setBookings((prev) =>
        prev.map((b) =>
          b.serviceId === serviceId
            ? { ...b, service: { ...b.service, ...patch } }
            : b,
        ),
      )
    }

    function removeService(serviceId: string) {
      setServices((prev) => prev.filter((s) => s.id !== serviceId))
      setSlots((prev) => prev.filter((s) => s.serviceId !== serviceId))
    }

    function addPackage(pkg: EventPackage) {
      setPackages((prev) => [pkg, ...prev])
    }

    function updatePackage(packageId: string, patch: Partial<EventPackage>) {
      setPackages((prev) =>
        prev.map((p) => (p.id === packageId ? { ...p, ...patch } : p)),
      )
    }

    function removePackage(packageId: string) {
      setPackages((prev) => prev.filter((p) => p.id !== packageId))
    }

    function duplicatePackage(packageId: string) {
      const nowIso = new Date().toISOString()
      setPackages((prev) => {
        const src = prev.find((p) => p.id === packageId) ?? null
        if (!src) return prev
        const copy: EventPackage = {
          ...src,
          id: createPackageId(),
          name: `${src.name} (Copy)`,
          createdAt: nowIso,
          features: src.features.slice(),
          addOns: src.addOns.slice(),
        }
        return [copy, ...prev]
      })
    }

    return {
      services,
      slots,
      bookings,
      waitlist,
      packages,
      addBooking,
      cancelBooking,
      cancelSlot,
      publishSlot,
      draftSlot,
      checkIn,
      addToWaitlist,
      removeFromWaitlist,
      promoteWaitlist,
      addSlot,
      addService,
      updateService,
      removeService,
      addPackage,
      updatePackage,
      removePackage,
      duplicatePackage,
    }
  }, [services, slots, bookings, waitlist, packages])

  return (
    <SchedulingContext.Provider value={value}>
      {children}
    </SchedulingContext.Provider>
  )
}

export function useScheduling(): SchedulingStore {
  const ctx = useContext(SchedulingContext)
  if (!ctx) {
    throw new Error('useScheduling must be used within SchedulingProvider')
  }
  return ctx
}

