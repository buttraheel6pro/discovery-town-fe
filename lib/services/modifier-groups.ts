/** Modifier group CRUD boundary — mock-backed fixtures until API exists. */

import { MOCK_CAFE_PRODUCTS, MOCK_MODIFIER_GROUPS } from '@/lib/mock-data'
import { modifierGroupSchema } from '@/lib/schemas/cafe'
import type { ModifierGroup } from '@/lib/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

function parseRows(rows: unknown): ModifierGroup[] {
  return modifierGroupSchema.array().parse(rows) as ModifierGroup[]
}

export async function listModifierGroups(): Promise<ModifierGroup[]> {
  if (API_BASE) {
    const res = await fetch(`${API_BASE}/api/v1/modifier-groups`)
    if (!res.ok) throw new Error(`Failed to list modifier groups: ${res.status}`)
    const data: unknown = await res.json()
    return parseRows(data)
  }
  return parseRows(MOCK_MODIFIER_GROUPS)
}

export async function getModifierGroup(id: string): Promise<ModifierGroup | null> {
  const rows = await listModifierGroups()
  return rows.find((g) => g.id === id) ?? null
}

/** Count products referencing a modifier group id. */
export function countProductsUsingModifierGroup(groupId: string): number {
  return MOCK_CAFE_PRODUCTS.filter((p) => p.modifierGroupIds.includes(groupId)).length
}
