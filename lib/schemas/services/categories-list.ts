/** Scheduling service categories list API schemas and response typing. */
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

export const apiSchedulingServiceCategorySchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  icon: z.string().nullable().optional(),
  displayOrder: decimalLikeSchema,
  isActive: z.boolean(),
  createdAt: z.string(),
  deletedAt: z.string().nullable().optional(),
})

const paginationMetaSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
})

export const schedulingServiceCategoriesListSchema = z.union([
  z.array(apiSchedulingServiceCategorySchema),
  z.object({
    data: z.array(apiSchedulingServiceCategorySchema),
    meta: paginationMetaSchema.optional(),
    success: z.boolean().optional(),
  }),
])

export type ApiSchedulingServiceCategory = z.infer<typeof apiSchedulingServiceCategorySchema>
export type SchedulingServiceCategoriesListResponse = z.infer<
  typeof schedulingServiceCategoriesListSchema
>
