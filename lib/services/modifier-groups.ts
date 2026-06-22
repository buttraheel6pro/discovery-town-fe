/** Modifier group CRUD boundary — API-backed with mock fallback. */

import { apiClient } from '@/lib/api/client'
import { isApiEnabled } from '@/lib/api/client'
import { API_PATHS } from '@/lib/constants/api'
import { MOCK_CAFE_PRODUCTS, MOCK_MODIFIER_GROUPS } from '@/lib/mock-data'
import { modifierGroupSchema } from '@/lib/schemas/cafe'
import type { ModifierGroup } from '@/lib/types'

function parseRows(rows: unknown): ModifierGroup[] {
  return modifierGroupSchema.array().parse(rows) as ModifierGroup[]
}

export async function listModifierGroups(): Promise<ModifierGroup[]> {
  if (!isApiEnabled) {
    return parseRows(MOCK_MODIFIER_GROUPS)
  }
  const { data } = await apiClient.get<ModifierGroup[]>(API_PATHS.modifierGroups)
  return parseRows(data)
}

export async function getModifierGroup(id: string): Promise<ModifierGroup | null> {
  if (!isApiEnabled) {
    const rows = await listModifierGroups()
    return rows.find((g) => g.id === id) ?? null
  }
  try {
    const { data } = await apiClient.get<ModifierGroup>(`${API_PATHS.modifierGroups}/${id}`)
    return modifierGroupSchema.parse(data) as ModifierGroup
  } catch {
    return null
  }
}

/** Count products referencing a modifier group id. */
export function countProductsUsingModifierGroup(groupId: string): number {
  return MOCK_CAFE_PRODUCTS.filter((p) => p.modifierGroupIds.includes(groupId)).length
}
