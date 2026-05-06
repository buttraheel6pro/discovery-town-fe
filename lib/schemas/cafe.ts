/** Zod schemas for cafe module fixtures and future API responses. */
import { z } from 'zod'

export const cafeCategorySchema = z.enum([
  'Coffee',
  'Cold Drinks',
  'Specialty',
  'Pizza',
  'Sandwiches',
  'Kids Corner',
  'Salads & Snacks',
  'Sweets',
  'Pastries',
])

export const cafeModifierSchema = z.object({
  id: z.string(),
  name: z.string(),
  priceDelta: z.number(),
  isDefault: z.boolean(),
})

export const modifierGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  isRequired: z.boolean(),
  maxSelect: z.number().int().min(1),
  modifiers: z.array(cafeModifierSchema),
})

export const attributeOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  emoji: z.string(),
  color: z.string(),
})

export const attributeGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  selectionType: z.enum(['single', 'multiple']),
  maxSelect: z.number().int().min(1).optional(),
  isRequired: z.boolean(),
  options: z.array(attributeOptionSchema),
  predefinedTemplate: z.string().optional(),
})

export const rotationGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  period: z.enum(['daily', 'monthly', 'seasonal']),
  seasonalRange: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .optional(),
  pool: z.array(z.string()),
  activeProductId: z.string().nullable(),
  nextProductId: z.string().optional(),
  nextActivationAt: z.string().optional(),
  manualOverride: z
    .object({
      productId: z.string(),
      setAt: z.string(),
    })
    .nullable(),
})

export const cafeProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string().optional(),
  subtype: z.string().optional(),
  category: cafeCategorySchema,
  basePrice: z.number(),
  stockCount: z.number().int().min(0).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  printNotesOnTicket: z.boolean(),
  preparationTimeMinutes: z.number().optional(),
  isActive: z.boolean().default(true),
  isAvailable: z.boolean(),
  availableDaysOfWeek: z.array(z.number().int().min(0).max(6)),
  rotatable: z.boolean(),
  rotationGroupId: z.string().optional(),
  isActiveInRotation: z.boolean().optional(),
  modifierGroupIds: z.array(z.string()),
  attributeGroups: z.record(z.string(), z.array(z.string())),
  imageUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const cafePickupSlotSchema = z.object({
  timeIso: z.string(),
  available: z.boolean(),
  label: z.string(),
})

export type CafeProductParsed = z.infer<typeof cafeProductSchema>
export type ModifierGroupParsed = z.infer<typeof modifierGroupSchema>
export type AttributeGroupParsed = z.infer<typeof attributeGroupSchema>
export type RotationGroupParsed = z.infer<typeof rotationGroupSchema>
