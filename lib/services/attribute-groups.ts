/** Attribute group CRUD boundary — API-backed with mock fallback. */

import { apiClient, isAdminApiReady, isApiEnabled } from '@/lib/api/client'
import { API_PATHS } from '@/lib/constants/api'
import { MOCK_ATTRIBUTE_GROUPS, MOCK_CAFE_PRODUCTS } from '@/lib/mock-data'
import { attributeGroupSchema } from '@/lib/schemas/cafe'
import type { AttributeGroup } from '@/lib/types'

function parseRows(rows: unknown): AttributeGroup[] {
  return attributeGroupSchema.array().parse(rows) as AttributeGroup[]
}

export async function listAttributeGroups(): Promise<AttributeGroup[]> {
  if (!isApiEnabled || !isAdminApiReady()) {
    return parseRows(MOCK_ATTRIBUTE_GROUPS)
  }
  const { data } = await apiClient.get<AttributeGroup[]>(API_PATHS.attributeGroups)
  return parseRows(data)
}

export async function createAttributeGroup(group: AttributeGroup): Promise<AttributeGroup> {
  if (!isApiEnabled || !isAdminApiReady()) {
    return attributeGroupSchema.parse(group) as AttributeGroup
  }
  const { data } = await apiClient.post<AttributeGroup>(API_PATHS.attributeGroups, group)
  return attributeGroupSchema.parse(data) as AttributeGroup
}

export async function updateAttributeGroup(group: AttributeGroup): Promise<AttributeGroup> {
  if (!isApiEnabled || !isAdminApiReady()) {
    return attributeGroupSchema.parse(group) as AttributeGroup
  }
  const { data } = await apiClient.patch<AttributeGroup>(
    `${API_PATHS.attributeGroups}/${group.id}`,
    group,
  )
  return attributeGroupSchema.parse(data) as AttributeGroup
}

export async function deleteAttributeGroupById(id: string): Promise<void> {
  if (!isApiEnabled || !isAdminApiReady()) {
    return
  }
  await apiClient.delete(`${API_PATHS.attributeGroups}/${id}`)
}

/** Count products that reference an attribute option within a group. */
export function countProductsUsingAttributeGroup(groupId: string): number {
  return MOCK_CAFE_PRODUCTS.filter(
    (p) => Object.hasOwn(p.attributeGroups, groupId),
  ).length
}
