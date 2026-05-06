/** Attribute group reads — mock-backed until API exists. */

import { MOCK_ATTRIBUTE_GROUPS, MOCK_CAFE_PRODUCTS } from '@/lib/mock-data'
import { attributeGroupSchema } from '@/lib/schemas/cafe'
import type { AttributeGroup } from '@/lib/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

function parseRows(rows: unknown): AttributeGroup[] {
  return attributeGroupSchema.array().parse(rows) as AttributeGroup[]
}

export async function listAttributeGroups(): Promise<AttributeGroup[]> {
  if (API_BASE) {
    const res = await fetch(`${API_BASE}/api/v1/attribute-groups`)
    if (!res.ok) throw new Error(`Failed to list attribute groups: ${res.status}`)
    const data: unknown = await res.json()
    return parseRows(data)
  }
  return parseRows(MOCK_ATTRIBUTE_GROUPS)
}

/** Count products that reference an attribute option within a group. */
export function countProductsUsingAttributeGroup(groupId: string): number {
  return MOCK_CAFE_PRODUCTS.filter(
    (p) => Object.hasOwn(p.attributeGroups, groupId),
  ).length
}
