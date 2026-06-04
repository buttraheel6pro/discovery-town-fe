/** Construct `SchedulingService` / `SchedulingSlot` payloads for admin CRUD against SchedulingProvider. */

import { schedulingCategories } from '@/lib/mock-data'
import type {
  OpenPricingModel,
  SchedulingBookingMode,
  SchedulingService,
  SchedulingServiceType,
  SchedulingSlot,
} from '@/lib/types'

function schedulingCategoryOrThrow(categoryId: string) {
  const category = schedulingCategories.find((c) => c.id === categoryId)
  if (!category) {
    throw new Error(`Invalid scheduling category: ${categoryId}`)
  }
  return category
}

export function newAdminEntityId(prefix: string): string {
  const suffix =
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}-${suffix}`
}

export function isoInDaysAtTime(daysFromNow: number, hour: number, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export function isoOnDateAtLocalTime(dateYmd: string, hour: number, minute = 0): string {
  const [y, m, d] = dateYmd.split('-').map((x) => parseInt(x, 10))
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return isoInDaysAtTime(1, hour, minute)
  }
  const dt = new Date(y, m - 1, d, hour, minute, 0, 0)
  return dt.toISOString()
}

export function buildOpenFacilityServiceFromAdmin(input: {
  id: string
  name: string
  description: string
  capacity: number
  hourlyRate: number
  imageUrl: string | null
  serviceType: 'COURT_BOOKING' | 'OPEN_PLAY' | 'PRIVATE_HIRE'
}): SchedulingService {
  const category = schedulingCategoryOrThrow('cat-4')
  return {
    id: input.id,
    locationId: 'loc-1',
    categoryId: category.id,
    category,
    serviceType: input.serviceType,
    bookingMode: 'OPEN',
    name: input.name,
    description: input.description,
    durationMinutes: 60,
    capacity: input.capacity,
    basePrice: input.hourlyRate,
    subscriptionPrice: null,
    requiresWaiver: false,
    ageMin: null,
    ageMax: null,
    isActive: true,
    minDurationMinutes: 60,
    maxDurationMinutes: 240,
    slotIncrementMinutes: 60,
    maxConcurrent: 3,
    minAdvanceHours: 0,
    maxAdvanceHours: 168,
    pricingModel: 'per_hour',
    imageUrl: input.imageUrl,
    tags: ['facility'],
    amenities: ['Parking', 'Locker Rooms'],
    addOns: [],
  }
}

export function buildClassServiceFromAdmin(input: {
  id: string
  name: string
  description: string
  instructorName: string
  scheduleLabel: string
  maxParticipants: number
  price: number
  imageUrl: string | null
  serviceType?: SchedulingServiceType
}): SchedulingService {
  const category = schedulingCategoryOrThrow('cat-1')
  const schedule = [
    {
      dayOfWeek: input.scheduleLabel || 'Weekly',
      startTime: '18:00',
      endTime: '19:00',
    },
  ]
  const serviceType = input.serviceType ?? 'GYM_CLASS'
  return {
    id: input.id,
    locationId: 'loc-1',
    categoryId: category.id,
    category,
    serviceType,
    bookingMode: 'SCHEDULED',
    name: input.name,
    description: input.description,
    durationMinutes: 60,
    capacity: input.maxParticipants,
    basePrice: input.price,
    subscriptionPrice: null,
    requiresWaiver: false,
    ageMin: null,
    ageMax: null,
    isActive: true,
    minDurationMinutes: null,
    maxDurationMinutes: null,
    slotIncrementMinutes: null,
    maxConcurrent: null,
    minAdvanceHours: null,
    maxAdvanceHours: null,
    pricingModel: 'flat',
    imageUrl: input.imageUrl,
    tags: ['class'],
    instructorName: input.instructorName,
    schedule,
    level: 'All Levels',
    addOns: [],
  }
}

export function buildEventServiceFromAdmin(input: {
  id: string
  name: string
  description: string
  dateYmd: string
  location: string
  capacity: number
  ticketPrice: number
  imageUrl: string | null
  serviceType?: 'WORKSHOP' | 'CAMP' | 'PARTY_PACKAGE'
}): SchedulingService {
  const category = schedulingCategoryOrThrow('cat-event-private-party-room-open-play')
  const serviceType = input.serviceType ?? 'PARTY_PACKAGE'
  return {
    id: input.id,
    locationId: 'loc-1',
    categoryId: category.id,
    category,
    serviceType,
    bookingMode: 'SCHEDULED',
    name: input.name,
    description: input.description,
    durationMinutes: 180,
    capacity: input.capacity,
    basePrice: input.ticketPrice,
    subscriptionPrice: null,
    requiresWaiver: false,
    ageMin: null,
    ageMax: null,
    isActive: true,
    minDurationMinutes: null,
    maxDurationMinutes: null,
    slotIncrementMinutes: null,
    maxConcurrent: null,
    minAdvanceHours: 0,
    maxAdvanceHours: 2160,
    pricingModel: 'per_person',
    imageUrl: input.imageUrl,
    tags: ['event'],
    startDate: input.dateYmd,
    endDate: input.dateYmd,
    startTime: '10:00',
    endTime: '13:00',
    location: input.location,
    organizer: 'Discovery Town',
    agenda: [
      {
        time: '10:00',
        title: 'Welcome',
        description: 'Registration and introduction',
      },
    ],
    eventStatus: 'Upcoming',
    maxAttendees: input.capacity,
    registeredCount: 0,
    addOns: [],
  }
}

export function buildCatalogSchedulingService(input: {
  id: string
  categoryId: string
  serviceType: SchedulingServiceType
  bookingMode: SchedulingBookingMode
  name: string
  description: string
  basePrice: number
  capacity: number
  durationMinutes: number
  imageUrl: string | null
}): SchedulingService {
  const category = schedulingCategoryOrThrow(input.categoryId)
  let pricingModel: OpenPricingModel = 'flat'
  if (input.bookingMode === 'OPEN') {
    pricingModel = 'per_hour'
  }
  return {
    id: input.id,
    locationId: 'loc-1',
    categoryId: category.id,
    category,
    serviceType: input.serviceType,
    bookingMode: input.bookingMode,
    name: input.name,
    description: input.description,
    durationMinutes: input.durationMinutes,
    capacity: input.capacity,
    basePrice: input.basePrice,
    subscriptionPrice: null,
    requiresWaiver: false,
    ageMin: null,
    ageMax: null,
    isActive: true,
    minDurationMinutes: input.bookingMode === 'OPEN' ? 60 : null,
    maxDurationMinutes: input.bookingMode === 'OPEN' ? 240 : null,
    slotIncrementMinutes: input.bookingMode === 'OPEN' ? 60 : null,
    maxConcurrent: input.bookingMode === 'OPEN' ? 3 : null,
    minAdvanceHours: 0,
    maxAdvanceHours: 168,
    pricingModel,
    imageUrl: input.imageUrl,
    tags: [],
    addOns: [],
  }
}

export function buildScheduledWindowSlot(input: {
  id: string
  service: SchedulingService
  startAt: string
  endAt: string
}): SchedulingSlot {
  return {
    id: input.id,
    serviceId: input.service.id,
    service: input.service,
    locationId: input.service.locationId ?? 'loc-1',
    staffId: null,
    staffName: null,
    startAt: input.startAt,
    endAt: input.endAt,
    capacityOverride: null,
    priceOverride: null,
    bookedCount: 0,
    effectiveCapacity: input.service.capacity,
    effectivePrice: input.service.basePrice,
    status: 'SCHEDULED',
    isRecurring: false,
    notes: null,
  }
}
