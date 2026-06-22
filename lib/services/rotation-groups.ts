/** Rotation group reads and override payloads — API-backed with mock fallback. */

import { apiClient, isApiEnabled } from '@/lib/api/client'
import { API_PATHS } from '@/lib/constants/api'
import { MOCK_ROTATION_GROUPS } from '@/lib/mock-data'
import { rotationGroupSchema } from '@/lib/schemas/cafe'
import type { RotationGroup } from '@/lib/types'

function parseRows(rows: unknown): RotationGroup[] {
  return rotationGroupSchema.array().parse(rows) as RotationGroup[]
}

export async function listRotationGroups(): Promise<RotationGroup[]> {
  if (!isApiEnabled) {
    return parseRows(MOCK_ROTATION_GROUPS)
  }
  const { data } = await apiClient.get<RotationGroup[]>(API_PATHS.rotationGroups)
  return parseRows(data)
}

export async function patchRotationGroup(
  id: string,
  patch: Partial<RotationGroup>,
): Promise<RotationGroup> {
  if (!isApiEnabled) {
    const rows = await listRotationGroups()
    const row = rows.find((r) => r.id === id)
    if (!row) throw new Error('Rotation group not found')
    return rotationGroupSchema.parse({ ...row, ...patch }) as RotationGroup
  }
  const { data } = await apiClient.patch<RotationGroup>(`${API_PATHS.rotationGroups}/${id}`, patch)
  return rotationGroupSchema.parse(data) as RotationGroup
}

export async function setRotationOverride(
  groupId: string,
  productId: string,
): Promise<RotationGroup> {
  if (!isApiEnabled) {
    const row = (await listRotationGroups()).find((r) => r.id === groupId)
    if (!row) throw new Error('Rotation group not found')
    return rotationGroupSchema.parse({
      ...row,
      manualOverride: { productId, setAt: new Date().toISOString() },
      activeProductId: productId,
    }) as RotationGroup
  }
  const { data } = await apiClient.post<RotationGroup>(
    `${API_PATHS.rotationGroups}/${groupId}/override`,
    { productId },
  )
  return rotationGroupSchema.parse(data) as RotationGroup
}

export async function clearRotationOverride(groupId: string): Promise<RotationGroup> {
  if (!isApiEnabled) {
    const row = (await listRotationGroups()).find((r) => r.id === groupId)
    if (!row) throw new Error('Rotation group not found')
    return rotationGroupSchema.parse({
      ...row,
      manualOverride: null,
    }) as RotationGroup
  }
  const { data } = await apiClient.post<RotationGroup>(
    `${API_PATHS.rotationGroups}/${groupId}/clear-override`,
  )
  return rotationGroupSchema.parse(data) as RotationGroup
}
