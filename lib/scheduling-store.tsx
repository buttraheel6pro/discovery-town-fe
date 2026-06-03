/** Scheduling store facade backed by centralized Redux state. */
'use client'

import React, { createContext, useContext, useMemo } from 'react'

import { newAdminEntityId } from '@/lib/scheduling-admin-builders'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import {
  addBooking as addBookingAction,
  addCategory as addCategoryAction,
  addPackage as addPackageAction,
  addOccasion as addOccasionAction,
  addService as addServiceAction,
  addSlot as addSlotAction,
  addSlots as addSlotsAction,
  addToWaitlist as addToWaitlistAction,
  cancelBooking as cancelBookingAction,
  cancelSlot as cancelSlotAction,
  changeBookingStatus as changeBookingStatusAction,
  checkInBooking as checkInBookingAction,
  duplicatePackage as duplicatePackageAction,
  linkSchedulingAddOn as linkSchedulingAddOnAction,
  promoteWaitlist as promoteWaitlistAction,
  removeCategory as removeCategoryAction,
  removeFromWaitlist as removeFromWaitlistAction,
  removePackage as removePackageAction,
  removeOccasion as removeOccasionAction,
  removeService as removeServiceAction,
  selectSchedulingBookings,
  selectSchedulingCategories,
  selectSchedulingPackages,
  selectSchedulingOccasions,
  selectSchedulingServices,
  selectSchedulingSlots,
  selectSchedulingWaitlist,
  setSchedulingAddOnFree as setSchedulingAddOnFreeAction,
  setSlotActive as setSlotActiveAction,
  unlinkSchedulingAddOn as unlinkSchedulingAddOnAction,
  updateCategory as updateCategoryAction,
  updatePackage as updatePackageAction,
  updateOccasion as updateOccasionAction,
  updateService as updateServiceAction,
  type SchedulingAddOnParent,
} from '@/lib/redux/slices/scheduling-slice'
import type {
  CategoryAddOnChargeFrequency,
  EventPackage,
  SchedulingBooking,
  SchedulingCategory,
  SchedulingOccasion,
  SchedulingService,
  SchedulingSlot,
  SchedulingWaitlistEntry,
} from '@/lib/types'

interface SchedulingStore {
  categories: SchedulingCategory[]
  services: SchedulingService[]
  slots: SchedulingSlot[]
  bookings: SchedulingBooking[]
  waitlist: SchedulingWaitlistEntry[]
  packages: EventPackage[]
  occasions: SchedulingOccasion[]
  addCategory: (category: SchedulingCategory) => void
  removeCategory: (categoryId: string) => void
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
    addOnName: string | undefined,
    isFree: boolean,
    config?: {
      quantity?: number
      unitPrice?: number
      chargeFrequency?: CategoryAddOnChargeFrequency
    },
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
  duplicatePackage: (
    packageId: string,
    target?: {
      serviceId: string
      displayPages?: EventPackage['displayPages']
      schedulingCategoryIds?: string[]
    },
  ) => void
  addOccasion: (occasion: SchedulingOccasion) => void
  updateOccasion: (occasionId: string, patch: Partial<SchedulingOccasion>) => void
  removeOccasion: (occasionId: string) => void
}

const SchedulingContext = createContext<SchedulingStore | null>(null)
const INQUIRY_ACTION_STAFF_ID = 'staff-1'
const INQUIRY_ACTION_STAFF_NAME = 'Sarah Mitchell'

export function SchedulingProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const dispatch = useAppDispatch()
  const categories = useAppSelector(selectSchedulingCategories)
  const services = useAppSelector(selectSchedulingServices)
  const slots = useAppSelector(selectSchedulingSlots)
  const bookings = useAppSelector(selectSchedulingBookings)
  const waitlist = useAppSelector(selectSchedulingWaitlist)
  const packages = useAppSelector(selectSchedulingPackages)
  const occasions = useAppSelector(selectSchedulingOccasions)

  const value = useMemo<SchedulingStore>(() => {
    function addBooking(booking: SchedulingBooking) {
      dispatch(addBookingAction(booking))
    }

    function cancelBooking(bookingId: string, reason: string) {
      dispatch(cancelBookingAction({ bookingId, reason }))
    }

    function approveBooking(bookingId: string) {
      dispatch(
        changeBookingStatusAction({
          bookingId,
          actedByStaffId: INQUIRY_ACTION_STAFF_ID,
          actedByStaffName: INQUIRY_ACTION_STAFF_NAME,
          status: 'CONFIRMED',
        }),
      )
    }

    function declineBooking(bookingId: string, reason: string) {
      dispatch(
        changeBookingStatusAction({
          bookingId,
          actedByStaffId: INQUIRY_ACTION_STAFF_ID,
          actedByStaffName: INQUIRY_ACTION_STAFF_NAME,
          status: 'CANCELLED',
          reason,
        }),
      )
    }

    function cancelSlot(slotId: string, reason: string) {
      dispatch(cancelSlotAction({ slotId, reason }))
    }

    function publishSlot(slotId: string) {
      dispatch(setSlotActiveAction({ slotId, isActive: true }))
    }

    function draftSlot(slotId: string) {
      dispatch(setSlotActiveAction({ slotId, isActive: false }))
    }

    function checkIn(bookingId: string) {
      dispatch(checkInBookingAction(bookingId))
    }

    function addToWaitlist(entry: SchedulingWaitlistEntry) {
      dispatch(addToWaitlistAction(entry))
    }

    function removeFromWaitlist(entryId: string) {
      dispatch(removeFromWaitlistAction(entryId))
    }

    function promoteWaitlist(slotId: string) {
      dispatch(promoteWaitlistAction(slotId))
    }

    function addSlot(slot: SchedulingSlot) {
      dispatch(addSlotAction(slot))
    }

    function addSlots(nextSlots: SchedulingSlot[]) {
      dispatch(addSlotsAction(nextSlots))
    }

    function addCategory(category: SchedulingCategory) {
      dispatch(addCategoryAction(category))
    }

    function removeCategory(categoryId: string) {
      dispatch(removeCategoryAction(categoryId))
    }

    function updateCategory(categoryId: string, patch: Partial<SchedulingCategory>) {
      dispatch(updateCategoryAction({ categoryId, patch }))
    }

    function linkSchedulingAddOn(
      parent: SchedulingAddOnParent,
      parentId: string,
      addOnId: string,
      addOnName: string | undefined,
      isFree: boolean,
      config?: {
        quantity?: number
        unitPrice?: number
        chargeFrequency?: CategoryAddOnChargeFrequency
      },
    ) {
      dispatch(
        linkSchedulingAddOnAction({
          parent,
          parentId,
          addOnId,
          addOnName,
          isFree,
          quantity: config?.quantity,
          unitPrice: config?.unitPrice,
          chargeFrequency: config?.chargeFrequency,
          linkId: newAdminEntityId('cao'),
        }),
      )
    }

    function unlinkSchedulingAddOn(
      parent: SchedulingAddOnParent,
      parentId: string,
      addOnId: string,
    ) {
      dispatch(unlinkSchedulingAddOnAction({ parent, parentId, addOnId }))
    }

    function setSchedulingAddOnFree(
      parent: SchedulingAddOnParent,
      parentId: string,
      addOnId: string,
      isFree: boolean,
    ) {
      dispatch(setSchedulingAddOnFreeAction({ parent, parentId, addOnId, isFree }))
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
      dispatch(addServiceAction(service))
    }

    function updateService(serviceId: string, patch: Partial<SchedulingService>) {
      dispatch(updateServiceAction({ serviceId, patch }))
    }

    function removeService(serviceId: string) {
      dispatch(removeServiceAction(serviceId))
    }

    function addPackage(pkg: EventPackage) {
      dispatch(addPackageAction(pkg))
    }

    function updatePackage(packageId: string, patch: Partial<EventPackage>) {
      dispatch(updatePackageAction({ packageId, patch }))
    }

    function removePackage(packageId: string) {
      dispatch(removePackageAction(packageId))
    }

    function duplicatePackage(
      packageId: string,
      target?: {
        serviceId: string
        displayPages?: EventPackage['displayPages']
        schedulingCategoryIds?: string[]
      },
    ) {
      dispatch(
        duplicatePackageAction({
          packageId,
          copyId: `pkg-${Math.random().toString(16).slice(2, 10)}`,
          nowIso: new Date().toISOString(),
          target,
        }),
      )
    }

    function addOccasion(occasion: SchedulingOccasion) {
      dispatch(addOccasionAction(occasion))
    }

    function updateOccasion(occasionId: string, patch: Partial<SchedulingOccasion>) {
      dispatch(updateOccasionAction({ occasionId, patch }))
    }

    function removeOccasion(occasionId: string) {
      dispatch(removeOccasionAction(occasionId))
    }

    return {
      categories,
      services,
      slots,
      bookings,
      waitlist,
      packages,
      occasions,
      addCategory,
      removeCategory,
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
      addOccasion,
      updateOccasion,
      removeOccasion,
    }
  }, [bookings, categories, dispatch, occasions, packages, services, slots, waitlist])

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

