/** Centralized Redux slice for scheduling domain state. */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import {
  eventPackagesMock,
  FIELD_TRIP_PRESCHOOL_SCHOOL_SERVICE_ID,
  PARENTS_NIGHT_OUT_SERVICE_ID,
  SUMMER_CAMP_WEEK_SERVICE_IDS,
  schedulingBookings,
  schedulingCategories,
  schedulingOccasions,
  schedulingServices,
  schedulingSlots,
  schedulingWaitlistEntries,
} from '@/lib/mock-data'
import { withoutOpenPlayPassCatalogServices } from '@/lib/open-play-pass-catalog'
import { SPECIAL_PLAY_SERVICE_ORDER } from '@/lib/special-play-service-order'
import {
  RETIRED_WE_BRING_PLAY_SERVICE_IDS,
  WE_BRING_PLAY_SERVICE_IDS,
} from '@/lib/we-bring-play-offerings'
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

/** Retired catalog services — hidden from play/events after persist merge. */
const RETIRED_SCHEDULING_SERVICE_IDS: ReadonlySet<string> = new Set([
  'svc-special-seasonal-festivals',
  'svc-special-interactive-festivals',
  'svc-special-skill-building',
  ...RETIRED_WE_BRING_PLAY_SERVICE_IDS,
])

const CAMP_PLAY_CATALOG_SYNC_IDS = [
  'svc-camp-summer',
  'svc-camp-winter-break',
  'svc-camp-spring-break',
  'svc-camp-mlk-day',
] as const

const CAMP_PLAY_SLOT_ID_PREFIXES = [
  'slot-camp-summer',
  'slot-camp-winter-break',
  'slot-camp-spring-break',
  'slot-camp-mlk-day',
] as const

const SUMMER_CAMP_SLOT_ID_PREFIXES = [
  'slot-summer-camp-w1',
  'slot-summer-camp-w2',
  'slot-summer-camp-w3',
  'slot-summer-camp-w4',
  'slot-summer-camp-w5',
] as const

function isCampPlayDefaultSlotId(slotId: string): boolean {
  return CAMP_PLAY_SLOT_ID_PREFIXES.some(
    (prefix) => slotId === prefix || slotId.startsWith(`${prefix}-`),
  )
}

function isSummerCampPlayDefaultSlotId(slotId: string): boolean {
  return SUMMER_CAMP_SLOT_ID_PREFIXES.some(
    (prefix) => slotId === prefix || slotId.startsWith(`${prefix}-`),
  )
}

const SUMMER_CAMP_WEEK_SERVICE_ID_SET = new Set<string>(SUMMER_CAMP_WEEK_SERVICE_IDS)

const CAMP_PLAY_SERVICE_IDS = new Set<string>([
  ...CAMP_PLAY_CATALOG_SYNC_IDS,
  ...SUMMER_CAMP_WEEK_SERVICE_IDS,
])

const PARENTS_NIGHT_CATALOG_SYNC_IDS = [PARENTS_NIGHT_OUT_SERVICE_ID] as const

const FIELD_TRIP_CATALOG_SYNC_IDS = [FIELD_TRIP_PRESCHOOL_SCHOOL_SERVICE_ID] as const

/** Refresh listing fields from catalog when mock data changes (e.g. image URLs). */
const CATALOG_LISTING_SYNC_SERVICE_IDS: ReadonlySet<string> = new Set([
  ...SPECIAL_PLAY_SERVICE_ORDER,
  ...CAMP_PLAY_CATALOG_SYNC_IDS,
  ...SUMMER_CAMP_WEEK_SERVICE_IDS,
  ...PARENTS_NIGHT_CATALOG_SYNC_IDS,
  ...FIELD_TRIP_CATALOG_SYNC_IDS,
  ...WE_BRING_PLAY_SERVICE_IDS,
])

function syncCategoryToServices(
  state: SchedulingState,
  categoryId: string,
): void {
  const category = state.categories.find((entry) => entry.id === categoryId)
  if (!category) {
    return
  }

  state.services = state.services.map((service) =>
    service.categoryId === categoryId ? { ...service, category } : service,
  )
  state.slots = state.slots.map((slot) =>
    slot.service.categoryId === categoryId
      ? { ...slot, service: { ...slot.service, category } }
      : slot,
  )
  state.bookings = state.bookings.map((booking) =>
    booking.service.categoryId === categoryId
      ? { ...booking, service: { ...booking.service, category } }
      : booking,
  )
}

function withoutRetiredSchedulingCatalog(state: SchedulingState): SchedulingState {
  return {
    ...state,
    services: state.services.map((service) =>
      RETIRED_SCHEDULING_SERVICE_IDS.has(service.id)
        ? { ...service, isActive: false }
        : service,
    ),
    slots: state.slots.filter(
      (slot) => !RETIRED_SCHEDULING_SERVICE_IDS.has(slot.serviceId),
    ),
  }
}

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
  target?: {
    serviceId: string
    displayPages?: EventPackage['displayPages']
    schedulingCategoryIds?: string[]
  }
}

interface UpdateOccasionPayload {
  occasionId: string
  patch: Partial<SchedulingOccasion>
}

/** Adds mock catalog rows missing from persisted scheduling state (e.g. new play passes). */
function mergeSchedulingWithCatalogDefaults(persisted: SchedulingState): SchedulingState {
  const defaults = cloneInitialState()

  const categoryById = new Map<string, SchedulingCategory>()
  for (const category of persisted.categories) {
    categoryById.set(category.id, category)
  }
  for (const category of defaults.categories) {
    const existing = categoryById.get(category.id)
    if (existing == null) {
      categoryById.set(category.id, category)
      continue
    }
    const mergedLinkedAddOns =
      existing.linkedAddOns != null && existing.linkedAddOns.length > 0
        ? existing.linkedAddOns.map((link) => ({ ...link }))
        : category.linkedAddOns?.map((link) => ({ ...link }))

    categoryById.set(category.id, {
      ...category,
      ...existing,
      requiresAttendee: existing.requiresAttendee ?? category.requiresAttendee,
      allowFamilyMember: existing.allowFamilyMember ?? category.allowFamilyMember,
      membersOnly: existing.membersOnly ?? category.membersOnly,
      specialInstructionsEnabled:
        existing.specialInstructionsEnabled ?? category.specialInstructionsEnabled,
      waitlistEnabled: existing.waitlistEnabled ?? category.waitlistEnabled,
      linkedAddOns: mergedLinkedAddOns,
    })
  }

  const categories = Array.from(categoryById.values())

  const serviceById = new Map<string, SchedulingService>()
  for (const service of persisted.services) {
    const category = categoryById.get(service.categoryId)
    serviceById.set(
      service.id,
      category != null ? { ...service, category } : service,
    )
  }
  for (const service of defaults.services) {
    const existing = serviceById.get(service.id)
    const category = categoryById.get(service.categoryId)
    const catalogService = category != null ? { ...service, category } : service
    if (existing == null) {
      serviceById.set(service.id, catalogService)
      continue
    }
    if (!CATALOG_LISTING_SYNC_SERVICE_IDS.has(service.id)) {
      continue
    }
    const listingPatch: SchedulingService = {
      ...existing,
      name: catalogService.name,
      description: catalogService.description,
      imageUrl: catalogService.imageUrl,
      tags: catalogService.tags,
      category: catalogService.category,
      eventStatus: catalogService.eventStatus ?? existing.eventStatus,
      requiresWaiver: catalogService.requiresWaiver,
    }

    if (service.id === PARENTS_NIGHT_OUT_SERVICE_ID) {
      serviceById.set(service.id, {
        ...listingPatch,
        bookingMode: catalogService.bookingMode,
        eventBookingScheduleMode: catalogService.eventBookingScheduleMode,
        durationMinutes: catalogService.durationMinutes,
        pricingModel: catalogService.pricingModel,
        minDurationMinutes: catalogService.minDurationMinutes,
        maxDurationMinutes: catalogService.maxDurationMinutes,
        slotIncrementMinutes: catalogService.slotIncrementMinutes,
        maxConcurrent: catalogService.maxConcurrent,
        siblingPrice: catalogService.siblingPrice,
        maxPassCount: catalogService.maxPassCount,
        eventStatus: catalogService.eventStatus ?? existing.eventStatus,
      })
      continue
    }

    if (SUMMER_CAMP_WEEK_SERVICE_ID_SET.has(service.id)) {
      serviceById.set(service.id, {
        ...listingPatch,
        serviceType: catalogService.serviceType,
        bookingMode: catalogService.bookingMode,
        eventBookingScheduleMode: catalogService.eventBookingScheduleMode,
        durationMinutes: catalogService.durationMinutes,
        capacity: catalogService.capacity,
        basePrice: catalogService.basePrice,
        slotIncrementMinutes: catalogService.slotIncrementMinutes,
        eventStatus: catalogService.eventStatus ?? existing.eventStatus,
        location: catalogService.location ?? existing.location,
        organizer: catalogService.organizer ?? existing.organizer,
      })
      continue
    }

    if (service.id === FIELD_TRIP_PRESCHOOL_SCHOOL_SERVICE_ID) {
      serviceById.set(service.id, {
        ...listingPatch,
        serviceType: catalogService.serviceType,
        bookingMode: catalogService.bookingMode,
        bookingOfferingKind: catalogService.bookingOfferingKind ?? 'SERVICE',
        isPackageService: catalogService.isPackageService === true,
        durationMinutes: catalogService.durationMinutes,
        capacity: catalogService.capacity,
        basePrice: catalogService.basePrice,
        pricingModel: catalogService.pricingModel,
        sport: catalogService.sport,
        ageMin: catalogService.ageMin ?? existing.ageMin,
        ageMax: catalogService.ageMax ?? existing.ageMax,
      })
      continue
    }

    serviceById.set(service.id, listingPatch)
  }

  const slotById = new Map<string, SchedulingSlot>()
  for (const slot of persisted.slots) {
    if (
      CAMP_PLAY_SERVICE_IDS.has(slot.serviceId) &&
      !isCampPlayDefaultSlotId(slot.id) &&
      !isSummerCampPlayDefaultSlotId(slot.id)
    ) {
      continue
    }
    slotById.set(slot.id, slot)
  }
  for (const slot of defaults.slots) {
    if (isSummerCampPlayDefaultSlotId(slot.id)) {
      slotById.set(slot.id, slot)
      continue
    }
    if (!slotById.has(slot.id)) {
      slotById.set(slot.id, slot)
    }
  }

  const defaultPackageById = new Map(
    defaults.packages.map((pkg) => [pkg.id, pkg]),
  )
  const packageById = new Map<string, EventPackage>()
  for (const pkg of persisted.packages) {
    const seed = defaultPackageById.get(pkg.id)
    packageById.set(
      pkg.id,
      seed
        ? {
            ...pkg,
            serviceId: seed.serviceId,
            displayPages: seed.displayPages ? [...seed.displayPages] : pkg.displayPages,
            schedulingCategoryIds: seed.schedulingCategoryIds
              ? [...seed.schedulingCategoryIds]
              : pkg.schedulingCategoryIds,
            addOns: seed.addOns.map((link) => ({ ...link })),
          }
        : pkg,
    )
  }
  for (const pkg of defaults.packages) {
    if (!packageById.has(pkg.id)) {
      packageById.set(pkg.id, {
        ...pkg,
        addOns: pkg.addOns.map((link) => ({ ...link })),
        features: pkg.features.slice(),
      })
    }
  }

  const merged: SchedulingState = withoutRetiredSchedulingCatalog({
    ...persisted,
    categories,
    services: withoutOpenPlayPassCatalogServices(Array.from(serviceById.values())),
    slots: Array.from(slotById.values()),
    packages: Array.from(packageById.values()),
  })

  for (const category of categories) {
    syncCategoryToServices(merged, category.id)
  }

  return merged
}

function cloneInitialState(): SchedulingState {
  return withoutRetiredSchedulingCatalog({
    categories: schedulingCategories.map((category) => ({
      ...category,
      linkedAddOns: category.linkedAddOns?.map((link) => ({ ...link })),
    })),
    services: withoutOpenPlayPassCatalogServices(schedulingServices).map((service) => ({
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
    occasions: schedulingOccasions.map((occasion) => ({ ...occasion })),
  })
}

const schedulingSlice = createSlice({
  name: 'scheduling',
  initialState: cloneInitialState(),
  reducers: {
    hydrateSchedulingState(_state, action: PayloadAction<SchedulingState>) {
      const merged = mergeSchedulingWithCatalogDefaults(action.payload)
      const persistedOccasions = merged.occasions?.map((occasion) => ({
        ...occasion,
      }))
      const occasions =
        persistedOccasions != null && persistedOccasions.length > 0
          ? persistedOccasions
          : schedulingOccasions.map((occasion) => ({ ...occasion }))
      return {
        ...merged,
        occasions,
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
      syncCategoryToServices(state, categoryId)
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
      syncCategoryToServices(state, parentId)
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
      syncCategoryToServices(state, parentId)
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
      syncCategoryToServices(state, parentId)
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
      const { packageId, copyId, nowIso, target } = action.payload
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
        ...(target
          ? {
              serviceId: target.serviceId,
              displayPages: target.displayPages,
              schedulingCategoryIds: target.schedulingCategoryIds,
            }
          : {}),
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
