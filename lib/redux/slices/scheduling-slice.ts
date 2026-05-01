/** Centralized Redux slice for scheduling domain state. */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import {
  eventPackagesMock,
  schedulingBookings,
  schedulingCategories,
  schedulingServices,
  schedulingSlots,
  schedulingWaitlistEntries,
} from '@/lib/mock-data'
import type { RootState } from '@/lib/redux/store'
import type {
  CategoryAddOn,
  CategoryAddOnChargeFrequency,
  EventPackage,
  SchedulingBooking,
  SchedulingCategory,
  SchedulingOccasion,
  SchedulingService,
  SchedulingSlot,
  SchedulingWaitlistEntry,
  WaitlistStatus,
} from '@/lib/types'

export type SchedulingAddOnParent = 'category' | 'service'
export const SCHEDULING_STORAGE_KEY = 'discovery-town:scheduling-store:v1'

interface SchedulingState {
  categories: SchedulingCategory[]
  services: SchedulingService[]
  slots: SchedulingSlot[]
  bookings: SchedulingBooking[]
  waitlist: SchedulingWaitlistEntry[]
  packages: EventPackage[]
  occasions: SchedulingOccasion[]
}

interface UpdateCategoryPayload {
  categoryId: string
  patch: Partial<SchedulingCategory>
}

interface CancelBookingPayload {
  bookingId: string
  reason: string
}

interface ChangeBookingStatusPayload {
  bookingId: string
  actedByStaffId: string
  actedByStaffName: string
  status: SchedulingBooking['status']
  reason?: string
}

interface CancelSlotPayload {
  slotId: string
  reason: string
}

interface LinkSchedulingAddOnPayload {
  parent: SchedulingAddOnParent
  parentId: string
  addOnId: string
  addOnName?: string
  isFree: boolean
  quantity?: number
  unitPrice?: number
  chargeFrequency?: CategoryAddOnChargeFrequency
  linkId: string
}

interface UpdateSchedulingAddOnFreePayload {
  parent: SchedulingAddOnParent
  parentId: string
  addOnId: string
  isFree: boolean
}

interface UpdateServicePayload {
  serviceId: string
  patch: Partial<SchedulingService>
}

interface UpdatePackagePayload {
  packageId: string
  patch: Partial<EventPackage>
}

interface DuplicatePackagePayload {
  packageId: string
  copyId: string
  nowIso: string
}

interface UpdateOccasionPayload {
  occasionId: string
  patch: Partial<SchedulingOccasion>
}

function cloneInitialState(): SchedulingState {
  return {
    categories: schedulingCategories.map((category) => ({
      ...category,
      linkedAddOns: category.linkedAddOns?.map((link) => ({ ...link })),
    })),
    services: schedulingServices.map((service) => ({
      ...service,
      linkedAddOns: service.linkedAddOns?.map((link) => ({ ...link })),
    })),
    slots: schedulingSlots.map((slot) => ({
      ...slot,
      service: { ...slot.service },
      isActive: slot.isActive ?? true,
      checkInCount: slot.checkInCount ?? 0,
    })),
    bookings: schedulingBookings.map((booking) => ({
      ...booking,
      service: { ...booking.service },
      serviceSlot: booking.serviceSlot
        ? { ...booking.serviceSlot, service: { ...booking.serviceSlot.service } }
        : null,
    })),
    waitlist: schedulingWaitlistEntries.map((entry) => ({ ...entry })),
    packages: eventPackagesMock.map((pkg) => ({
      ...pkg,
      addOns: pkg.addOns.slice(),
      features: pkg.features.slice(),
    })),
    occasions: [],
  }
}

const schedulingSlice = createSlice({
  name: 'scheduling',
  initialState: cloneInitialState(),
  reducers: {
    hydrateSchedulingState(_state, action: PayloadAction<SchedulingState>) {
      return {
        ...action.payload,
        occasions: action.payload.occasions?.map((occasion) => ({ ...occasion })) ?? [],
      }
    },
    addCategory(state, action: PayloadAction<SchedulingCategory>) {
      state.categories.unshift(action.payload)
    },
    removeCategory(state, action: PayloadAction<string>) {
      const categoryId = action.payload
      state.categories = state.categories.filter((category) => category.id !== categoryId)
    },
    updateCategory(state, action: PayloadAction<UpdateCategoryPayload>) {
      const { categoryId, patch } = action.payload
      state.categories = state.categories.map((category) =>
        category.id === categoryId ? { ...category, ...patch } : category,
      )
    },
    addBooking(state, action: PayloadAction<SchedulingBooking>) {
      const booking = action.payload
      state.bookings.unshift(booking)

      if (!booking.serviceSlotId) {
        return
      }

      state.slots = state.slots.map((slot) => {
        if (slot.id !== booking.serviceSlotId) {
          return slot
        }

        const bookedCount = slot.bookedCount + Math.max(1, booking.guestCount)
        const isFull = bookedCount >= slot.effectiveCapacity
        return {
          ...slot,
          bookedCount,
          status: isFull ? 'FULL' : slot.status,
        }
      })
    },
    cancelBooking(state, action: PayloadAction<CancelBookingPayload>) {
      const { bookingId, reason } = action.payload
      const cancelledAt = new Date().toISOString()
      state.bookings = state.bookings.map((booking) =>
        booking.id === bookingId
          ? {
              ...booking,
              status: 'CANCELLED',
              cancelledAt,
              cancellationReason: reason,
            }
          : booking,
      )
    },
    changeBookingStatus(state, action: PayloadAction<ChangeBookingStatusPayload>) {
      const { bookingId, actedByStaffId, actedByStaffName, status, reason } = action.payload
      const cancelledAt = status === 'CANCELLED' ? new Date().toISOString() : null
      state.bookings = state.bookings.map((booking) =>
        booking.id === bookingId
          ? {
              ...booking,
              status,
              cancellationReason: reason ?? null,
              cancelledAt,
              actedByStaffId,
              actedByStaffName,
            }
          : booking,
      )
    },
    checkInBooking(state, action: PayloadAction<string>) {
      const bookingId = action.payload
      const checkedInAt = new Date().toISOString()
      const booking = state.bookings.find((entry) => entry.id === bookingId) ?? null
      if (!booking || booking.checkedInAt) {
        return
      }

      state.bookings = state.bookings.map((entry) =>
        entry.id === bookingId ? { ...entry, checkedInAt } : entry,
      )

      if (!booking.serviceSlotId) {
        return
      }

      state.slots = state.slots.map((slot) =>
        slot.id === booking.serviceSlotId
          ? { ...slot, checkInCount: (slot.checkInCount ?? 0) + 1 }
          : slot,
      )
    },
    cancelSlot(state, action: PayloadAction<CancelSlotPayload>) {
      const { slotId, reason } = action.payload
      state.slots = state.slots.map((slot) =>
        slot.id === slotId ? { ...slot, status: 'CANCELLED', notes: reason } : slot,
      )
    },
    setSlotActive(
      state,
      action: PayloadAction<{
        slotId: string
        isActive: boolean
      }>,
    ) {
      const { slotId, isActive } = action.payload
      state.slots = state.slots.map((slot) =>
        slot.id === slotId ? { ...slot, isActive } : slot,
      )
    },
    addToWaitlist(state, action: PayloadAction<SchedulingWaitlistEntry>) {
      state.waitlist.push(action.payload)
    },
    removeFromWaitlist(state, action: PayloadAction<string>) {
      const entryId = action.payload
      state.waitlist = state.waitlist.filter((entry) => entry.id !== entryId)
    },
    promoteWaitlist(state, action: PayloadAction<string>) {
      const slotId = action.payload
      const firstWaiting = state.waitlist
        .filter((entry) => entry.serviceSlotId === slotId && entry.status === 'WAITING')
        .sort((a, b) => a.position - b.position)[0]

      if (!firstWaiting) {
        return
      }

      const status: WaitlistStatus = 'NOTIFIED'
      const notifiedAt = new Date().toISOString()

      state.waitlist = state.waitlist.map((entry) =>
        entry.id === firstWaiting.id ? { ...entry, status, notifiedAt } : entry,
      )
    },
    addSlot(state, action: PayloadAction<SchedulingSlot>) {
      const slot = action.payload
      state.slots.unshift({
        ...slot,
        isActive: slot.isActive ?? true,
        checkInCount: slot.checkInCount ?? 0,
      })
    },
    addSlots(state, action: PayloadAction<SchedulingSlot[]>) {
      const slots = action.payload.map((slot) => ({
        ...slot,
        isActive: slot.isActive ?? true,
        checkInCount: slot.checkInCount ?? 0,
      }))
      state.slots = [...slots, ...state.slots]
    },
    linkSchedulingAddOn(state, action: PayloadAction<LinkSchedulingAddOnPayload>) {
      const { parent, parentId, addOnId, addOnName, isFree, quantity, unitPrice, chargeFrequency, linkId } =
        action.payload
      const link: CategoryAddOn = {
        id: linkId,
        categoryId: parentId,
        addOnId,
        addOnName,
        isOptional: true,
        isFree,
        quantity,
        unitPrice,
        chargeFrequency,
      }

      if (parent === 'service') {
        const service = state.services.find((entry) => entry.id === parentId) ?? null
        if (!service) {
          return
        }
        const serviceLinks = service.linkedAddOns ?? []
        if (serviceLinks.some((entry) => entry.addOnId === addOnId)) {
          return
        }

        state.services = state.services.map((entry) =>
          entry.id === parentId
            ? { ...entry, linkedAddOns: [...(entry.linkedAddOns ?? []), link] }
            : entry,
        )
        state.slots = state.slots.map((slot) =>
          slot.serviceId === parentId
            ? {
                ...slot,
                service: {
                  ...slot.service,
                  linkedAddOns: [...(slot.service.linkedAddOns ?? []), link],
                },
              }
            : slot,
        )
        return
      }

      state.categories = state.categories.map((entry) =>
        entry.id === parentId
          ? { ...entry, linkedAddOns: [...(entry.linkedAddOns ?? []), link] }
          : entry,
      )
    },
    unlinkSchedulingAddOn(
      state,
      action: PayloadAction<{
        parent: SchedulingAddOnParent
        parentId: string
        addOnId: string
      }>,
    ) {
      const { parent, parentId, addOnId } = action.payload
      if (parent === 'service') {
        state.services = state.services.map((entry) =>
          entry.id === parentId
            ? {
                ...entry,
                linkedAddOns: (entry.linkedAddOns ?? []).filter(
                  (link) => link.addOnId !== addOnId,
                ),
              }
            : entry,
        )
        state.slots = state.slots.map((slot) =>
          slot.serviceId === parentId
            ? {
                ...slot,
                service: {
                  ...slot.service,
                  linkedAddOns: (slot.service.linkedAddOns ?? []).filter(
                    (link) => link.addOnId !== addOnId,
                  ),
                },
              }
            : slot,
        )
        return
      }

      state.categories = state.categories.map((entry) =>
        entry.id === parentId
          ? {
              ...entry,
              linkedAddOns: (entry.linkedAddOns ?? []).filter(
                (link) => link.addOnId !== addOnId,
              ),
            }
          : entry,
      )
    },
    setSchedulingAddOnFree(
      state,
      action: PayloadAction<UpdateSchedulingAddOnFreePayload>,
    ) {
      const { parent, parentId, addOnId, isFree } = action.payload
      if (parent === 'service') {
        state.services = state.services.map((entry) =>
          entry.id === parentId
            ? {
                ...entry,
                linkedAddOns: (entry.linkedAddOns ?? []).map((link) =>
                  link.addOnId === addOnId ? { ...link, isFree } : link,
                ),
              }
            : entry,
        )
        state.slots = state.slots.map((slot) =>
          slot.serviceId === parentId
            ? {
                ...slot,
                service: {
                  ...slot.service,
                  linkedAddOns: (slot.service.linkedAddOns ?? []).map((link) =>
                    link.addOnId === addOnId ? { ...link, isFree } : link,
                  ),
                },
              }
            : slot,
        )
        return
      }

      state.categories = state.categories.map((entry) =>
        entry.id === parentId
          ? {
              ...entry,
              linkedAddOns: (entry.linkedAddOns ?? []).map((link) =>
                link.addOnId === addOnId ? { ...link, isFree } : link,
              ),
            }
          : entry,
      )
    },
    addService(state, action: PayloadAction<SchedulingService>) {
      state.services.unshift(action.payload)
    },
    updateService(state, action: PayloadAction<UpdateServicePayload>) {
      const { serviceId, patch } = action.payload
      state.services = state.services.map((service) =>
        service.id === serviceId ? { ...service, ...patch } : service,
      )
      state.slots = state.slots.map((slot) =>
        slot.serviceId === serviceId
          ? { ...slot, service: { ...slot.service, ...patch } }
          : slot,
      )
      state.bookings = state.bookings.map((booking) =>
        booking.serviceId === serviceId
          ? { ...booking, service: { ...booking.service, ...patch } }
          : booking,
      )
    },
    removeService(state, action: PayloadAction<string>) {
      const serviceId = action.payload
      state.services = state.services.filter((service) => service.id !== serviceId)
      state.slots = state.slots.filter((slot) => slot.serviceId !== serviceId)
    },
    addPackage(state, action: PayloadAction<EventPackage>) {
      state.packages.unshift(action.payload)
    },
    updatePackage(state, action: PayloadAction<UpdatePackagePayload>) {
      const { packageId, patch } = action.payload
      state.packages = state.packages.map((pkg) =>
        pkg.id === packageId ? { ...pkg, ...patch } : pkg,
      )
    },
    removePackage(state, action: PayloadAction<string>) {
      const packageId = action.payload
      state.packages = state.packages.filter((pkg) => pkg.id !== packageId)
    },
    duplicatePackage(state, action: PayloadAction<DuplicatePackagePayload>) {
      const { packageId, copyId, nowIso } = action.payload
      const source = state.packages.find((pkg) => pkg.id === packageId) ?? null
      if (!source) {
        return
      }
      const copy: EventPackage = {
        ...source,
        id: copyId,
        name: `${source.name} (Copy)`,
        createdAt: nowIso,
        features: source.features.slice(),
        addOns: source.addOns.slice(),
      }
      state.packages.unshift(copy)
    },
    addOccasion(state, action: PayloadAction<SchedulingOccasion>) {
      state.occasions.unshift(action.payload)
    },
    updateOccasion(state, action: PayloadAction<UpdateOccasionPayload>) {
      const { occasionId, patch } = action.payload
      state.occasions = state.occasions.map((occasion) =>
        occasion.id === occasionId ? { ...occasion, ...patch } : occasion,
      )
    },
    removeOccasion(state, action: PayloadAction<string>) {
      const occasionId = action.payload
      state.occasions = state.occasions.filter((occasion) => occasion.id !== occasionId)
    },
  },
})

export const {
  hydrateSchedulingState,
  addCategory,
  removeCategory,
  updateCategory,
  addBooking,
  cancelBooking,
  changeBookingStatus,
  checkInBooking,
  cancelSlot,
  setSlotActive,
  addToWaitlist,
  removeFromWaitlist,
  promoteWaitlist,
  addSlot,
  addSlots,
  linkSchedulingAddOn,
  unlinkSchedulingAddOn,
  setSchedulingAddOnFree,
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
} = schedulingSlice.actions

export const schedulingReducer = schedulingSlice.reducer

export type { SchedulingState }

export const selectSchedulingState = (state: RootState): SchedulingState => state.scheduling
export const selectSchedulingCategories = (
  state: RootState,
): SchedulingCategory[] => state.scheduling.categories
export const selectSchedulingServices = (
  state: RootState,
): SchedulingService[] => state.scheduling.services
export const selectSchedulingSlots = (state: RootState): SchedulingSlot[] => state.scheduling.slots
export const selectSchedulingBookings = (
  state: RootState,
): SchedulingBooking[] => state.scheduling.bookings
export const selectSchedulingWaitlist = (
  state: RootState,
): SchedulingWaitlistEntry[] => state.scheduling.waitlist
export const selectSchedulingPackages = (state: RootState): EventPackage[] => state.scheduling.packages
export const selectSchedulingOccasions = (
  state: RootState,
): SchedulingOccasion[] => state.scheduling.occasions
