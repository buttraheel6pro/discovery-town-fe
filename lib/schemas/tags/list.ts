/** Tags list API schemas and response typing. */
import { z } from 'zod'

const paginationMetaSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
})

export const apiTagSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  isAuto: z.boolean(),
  contactCount: z.number().int().nonnegative().optional(),
})

export const createTagRequestSchema = z.object({
  name: z.string().trim().min(1),
  color: z.string().trim().min(1),
  isAuto: z.boolean(),
})

export const tagsListSchema = z.union([
  z.array(apiTagSchema),
  z.object({
    data: z.array(apiTagSchema),
    meta: paginationMetaSchema.optional(),
    success: z.boolean().optional(),
  }),
])

export type ApiTag = z.infer<typeof apiTagSchema>
export type TagsListResponse = z.infer<typeof tagsListSchema>
