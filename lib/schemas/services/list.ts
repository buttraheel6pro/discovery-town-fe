/** Scheduling services list API schemas and response typing. */
import { z } from 'zod'

const decimalLikeSchema = z.union([
  z.number(),
  z.string(),
  z.object({
    s: z.number().optional(),
    e: z.number().optional(),
    d: z.array(z.number()).optional(),
  }),
])

const schedulingServiceTypeSchema = z.enum([
  'GYM_CLASS',
  'COURT_BOOKING',
  'COACHING_SESSION',
  'OPEN_PLAY',
  'CAMP',
  'PARTY_PACKAGE',
  'PRIVATE_HIRE',
  'WORKSHOP',
  'SWIM_CLASS',
  'FITNESS_ASSESSMENT',
])

const schedulingBookingModeSchema = z.enum(['SCHEDULED', 'OPEN'])

export const apiSchedulingServiceSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  locationId: z.string().nullable().optional(),
  categoryId: z.string(),
  serviceType: schedulingServiceTypeSchema,
  name: z.string(),
  description: z.string().nullable().optional(),
  durationMinutes: z.number().int(),
  capacity: z.number().int(),
  basePrice: decimalLikeSchema,
  subscriptionPrice: decimalLikeSchema.nullable().optional(),
  requiresWaiver: z.boolean(),
  ageMin: z.number().int().nullable().optional(),
  ageMax: z.number().int().nullable().optional(),
  isActive: z.boolean(),
  bookingMode: schedulingBookingModeSchema,
  minDurationMinutes: z.number().int().nullable().optional(),
  maxDurationMinutes: z.number().int().nullable().optional(),
  slotIncrementMinutes: z.number().int().nullable().optional(),
  maxConcurrent: z.number().int().nullable().optional(),
  minAdvanceHours: z.number().int().nullable().optional(),
  maxAdvanceHours: z.number().int().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
})

const paginationMetaSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
})

export const schedulingServicesListSchema = z.union([
  z.array(apiSchedulingServiceSchema),
  z.object({
    data: z.array(apiSchedulingServiceSchema),
    meta: paginationMetaSchema.optional(),
    success: z.boolean().optional(),
  }),
])

export type ApiSchedulingService = z.infer<typeof apiSchedulingServiceSchema>
export type SchedulingServicesListResponse = z.infer<typeof schedulingServicesListSchema>
