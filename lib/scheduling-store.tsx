/** Scheduling store — local in-memory state for slots, bookings, and waitlist. */
'use client'

import React, { createContext, useContext, useMemo, useState } from 'react'

import { newAdminEntityId } from '@/lib/scheduling-admin-builders'
import {
  schedulingBookings as initialBookings,
  eventPackagesMock as initialPackages,
  schedulingCategories as initialCategories,
  schedulingServices as initialServices,
  schedulingSlots as initialSlots,
  schedulingWaitlistEntries as initialWaitlist,
} from '@/lib/mock-data'
import type {
  CategoryAddOn,
  EventPackage,
  SchedulingBooking,
  SchedulingCategory,
  SchedulingService,
  SchedulingSlot,
  SchedulingWaitlistEntry,
  WaitlistStatus,
} from '@/lib/types'

export type SchedulingAddOnParent = 'category' | 'service'
const INQUIRY_ACTION_STAFF_ID = 'staff-1'
const INQUIRY_ACTION_STAFF_NAME = 'Sarah Mitchell'

interface SchedulingStore {
  categories: SchedulingCategory[]
  services: SchedulingService[]
  slots: SchedulingSlot[]
  bookings: SchedulingBooking[]
  waitlist: SchedulingWaitlistEntry[]
  packages: EventPackage[]
  addCategory: (category: SchedulingCategory) => void
  updateCategory: (categoryId: string, patch: Partial<SchedulingCategory>) => void
  addBooking: (booking: SchedulingBooking) => void
  cancelBooking: (bookingId: string, reason: string) => void
  approveBooking: (bookingId: string) => void
  declineBooking: (bookingId: string, reason: string) => void
  cancelSlot: (slotId: string, reason: string) => void
  publishSlot: (slotId: string) => void
  draftSlot: (slotId: string) => void
  checkIn: (bookingId: string) => void
  addToWaitlist: (entry: SchedulingWaitlistEntry) => void
  removeFromWaitlist: (entryId: string) => void
  promoteWaitlist: (slotId: string) => void
  addSlot: (slot: SchedulingSlot) => void
  addSlots: (slots: SchedulingSlot[]) => void
  linkSchedulingAddOn: (
    parent: SchedulingAddOnParent,
    parentId: string,
    addOnId: string,
    isFree: boolean,
  ) => void
  unlinkSchedulingAddOn: (
    parent: SchedulingAddOnParent,
    parentId: string,
    addOnId: string,
  ) => void
  setSchedulingAddOnFree: (
    parent: SchedulingAddOnParent,
    parentId: string,
    addOnId: string,
    isFree: boolean,
  ) => void
  canDetachPackage: (serviceId: string, packageId: string) => boolean
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
  const [categories, setCategories] = useState<SchedulingCategory[]>(() =>
    initialCategories.map((c) => ({
      ...c,
      linkedAddOns: c.linkedAddOns?.map((l) => ({ ...l })),
    })),
  )
  const [services, setServices] = useState<SchedulingService[]>(() =>
    initialServices.map((s) => ({
      ...s,
      linkedAddOns: s.linkedAddOns?.map((l) => ({ ...l })),
    })),
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

    function approveBooking(bookingId: string) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                status: 'CONFIRMED',
                cancellationReason: null,
                cancelledAt: null,
                actedByStaffId: INQUIRY_ACTION_STAFF_ID,
                actedByStaffName: INQUIRY_ACTION_STAFF_NAME,
              }
            : b,
        ),
      )
    }

    function declineBooking(bookingId: string, reason: string) {
      const cancelledAt = new Date().toISOString()
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                status: 'CANCELLED',
                cancellationReason: reason,
                cancelledAt,
                actedByStaffId: INQUIRY_ACTION_STAFF_ID,
                actedByStaffName: INQUIRY_ACTION_STAFF_NAME,
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

    function addSlots(nextSlots: SchedulingSlot[]) {
      const normalized = nextSlots.map((slot) => ({
        ...slot,
        isActive: slot.isActive ?? true,
        checkInCount: slot.checkInCount ?? 0,
      }))
      setSlots((prev) => [...normalized, ...prev])
    }

    function addCategory(category: SchedulingCategory) {
      setCategories((prev) => [...prev, { ...category }])
    }

    function updateCategory(categoryId: string, patch: Partial<SchedulingCategory>) {
      setCategories((prev) =>
        prev.map((c) => (c.id === categoryId ? { ...c, ...patch } : c)),
      )
    }

    function linkSchedulingAddOn(
      parent: SchedulingAddOnParent,
      parentId: string,
      addOnId: string,
      isFree: boolean,
    ) {
      const link: CategoryAddOn = {
        id: newAdminEntityId('cao'),
        categoryId: parentId,
        addOnId,
        isOptional: true,
        isFree,
      }
      if (parent === 'service') {
        setServices((prev) =>
          prev.map((s) => {
            if (s.id !== parentId) return s
            const links = s.linkedAddOns ?? []
            if (links.some((l) => l.addOnId === addOnId)) return s
            return { ...s, linkedAddOns: [...links, link] }
          }),
        )
        setSlots((prev) =>
          prev.map((slot) =>
            slot.serviceId === parentId
              ? {
                  ...slot,
                  service: {
                    ...slot.service,
                    linkedAddOns: [
                      ...(slot.service.linkedAddOns ?? []),
                      ...(slot.service.linkedAddOns?.some((l) => l.addOnId === addOnId)
                        ? []
                        : [link]),
                    ],
                  },
                }
              : slot,
          ),
        )
        return
      }
      setCategories((prev) =>
        prev.map((c) => {
          if (c.id !== parentId) return c
          const links = c.linkedAddOns ?? []
          if (links.some((l) => l.addOnId === addOnId)) return c
          return { ...c, linkedAddOns: [...links, link] }
        }),
      )
    }

    function unlinkSchedulingAddOn(
      parent: SchedulingAddOnParent,
      parentId: string,
      addOnId: string,
    ) {
      if (parent === 'service') {
        setServices((prev) =>
          prev.map((s) =>
            s.id === parentId
              ? {
                  ...s,
                  linkedAddOns: (s.linkedAddOns ?? []).filter((l) => l.addOnId !== addOnId),
                }
              : s,
          ),
        )
        setSlots((prev) =>
          prev.map((slot) =>
            slot.serviceId === parentId
              ? {
                  ...slot,
                  service: {
                    ...slot.service,
                    linkedAddOns: (slot.service.linkedAddOns ?? []).filter(
                      (l) => l.addOnId !== addOnId,
                    ),
                  },
                }
              : slot,
          ),
        )
        return
      }
      setCategories((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? {
                ...c,
                linkedAddOns: (c.linkedAddOns ?? []).filter((l) => l.addOnId !== addOnId),
              }
            : c,
        ),
      )
    }

    function setSchedulingAddOnFree(
      parent: SchedulingAddOnParent,
      parentId: string,
      addOnId: string,
      isFree: boolean,
    ) {
      if (parent === 'service') {
        setServices((prev) =>
          prev.map((s) =>
            s.id === parentId
              ? {
                  ...s,
                  linkedAddOns: (s.linkedAddOns ?? []).map((l) =>
                    l.addOnId === addOnId ? { ...l, isFree } : l,
                  ),
                }
              : s,
          ),
        )
        setSlots((prev) =>
          prev.map((slot) =>
            slot.serviceId === parentId
              ? {
                  ...slot,
                  service: {
                    ...slot.service,
                    linkedAddOns: (slot.service.linkedAddOns ?? []).map((l) =>
                      l.addOnId === addOnId ? { ...l, isFree } : l,
                    ),
                  },
                }
              : slot,
          ),
        )
        return
      }
      setCategories((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? {
                ...c,
                linkedAddOns: (c.linkedAddOns ?? []).map((l) =>
                  l.addOnId === addOnId ? { ...l, isFree } : l,
                ),
              }
            : c,
        ),
      )
    }

    function canDetachPackage(serviceId: string, packageId: string): boolean {
      const blocked = bookings.some(
        (b) =>
          b.serviceId === serviceId &&
          b.eventPackageId === packageId &&
          b.status === 'CONFIRMED',
      )
      return !blocked
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
      categories,
      services,
      slots,
      bookings,
      waitlist,
      packages,
      addCategory,
      updateCategory,
      addBooking,
      cancelBooking,
      approveBooking,
      declineBooking,
      cancelSlot,
      publishSlot,
      draftSlot,
      checkIn,
      addToWaitlist,
      removeFromWaitlist,
      promoteWaitlist,
      addSlot,
      addSlots,
      linkSchedulingAddOn,
      unlinkSchedulingAddOn,
      setSchedulingAddOnFree,
      canDetachPackage,
      addService,
      updateService,
      removeService,
      addPackage,
      updatePackage,
      removePackage,
      duplicatePackage,
    }
  }, [categories, services, slots, bookings, waitlist, packages])

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

