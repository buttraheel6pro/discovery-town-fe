/** Location list API schemas for typed location retrieval. */
import { z } from 'zod'

export const operatingHoursSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  openTime: z.string(),
  closeTime: z.string(),
  isClosed: z.boolean(),
})

export const apiLocationSettingsSchema = z
  .object({
    operatingHours: z.array(operatingHoursSchema).optional(),
  })
  .passthrough()

export const apiLocationSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  address: z.string(),
  city: z.string(),
  country: z.string().optional(),
  postcode: z.string().optional(),
  timezone: z.string(),
  isActive: z.boolean().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  settings: apiLocationSettingsSchema.default({}),
  imageUrl: z.string().nullable().optional(),
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

export const locationsListSchema = z.union([
  z.array(apiLocationSchema),
  z.object({
    data: z.array(apiLocationSchema),
    meta: paginationMetaSchema.optional(),
    success: z.boolean().optional(),
  }),
])

export type LocationsListResponse = z.infer<typeof locationsListSchema>
