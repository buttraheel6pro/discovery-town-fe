/** Rotation group reads and override payloads — mock-backed until API exists. */

import { MOCK_ROTATION_GROUPS } from '@/lib/mock-data'
import { rotationGroupSchema } from '@/lib/schemas/cafe'
import type { RotationGroup } from '@/lib/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

function parseRows(rows: unknown): RotationGroup[] {
  return rotationGroupSchema.array().parse(rows) as RotationGroup[]
}

export async function listRotationGroups(): Promise<RotationGroup[]> {
  if (API_BASE) {
    const res = await fetch(`${API_BASE}/api/v1/rotation-groups`)
    if (!res.ok) throw new Error(`Failed to list rotation groups: ${res.status}`)
    const data: unknown = await res.json()
    return parseRows(data)
  }
  return parseRows(MOCK_ROTATION_GROUPS)
}

export async function patchRotationGroup(
  id: string,
  patch: Partial<RotationGroup>,
): Promise<RotationGroup> {
  if (API_BASE) {
    const res = await fetch(`${API_BASE}/api/v1/rotation-groups/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) throw new Error(`Failed to patch rotation group: ${res.status}`)
    const data: unknown = await res.json()
    return rotationGroupSchema.parse(data) as RotationGroup
  }
  const rows = await listRotationGroups()
  const row = rows.find((r) => r.id === id)
  if (!row) throw new Error('Rotation group not found')
  return rotationGroupSchema.parse({ ...row, ...patch }) as RotationGroup
}

export async function setRotationOverride(
  groupId: string,
  productId: string,
): Promise<RotationGroup> {
  if (API_BASE) {
    const res = await fetch(`${API_BASE}/api/v1/rotation-groups/${groupId}/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    })
    if (!res.ok) throw new Error(`Failed to set override: ${res.status}`)
    const data: unknown = await res.json()
    return rotationGroupSchema.parse(data) as RotationGroup
  }
  const row = (await listRotationGroups()).find((r) => r.id === groupId)
  if (!row) throw new Error('Rotation group not found')
  return rotationGroupSchema.parse({
    ...row,
    manualOverride: { productId, setAt: new Date().toISOString() },
    activeProductId: productId,
  }) as RotationGroup
}

export async function clearRotationOverride(groupId: string): Promise<RotationGroup> {
  if (API_BASE) {
    const res = await fetch(`${API_BASE}/api/v1/rotation-groups/${groupId}/override`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error(`Failed to clear override: ${res.status}`)
    const data: unknown = await res.json()
    return rotationGroupSchema.parse(data) as RotationGroup
  }
  const row = (await listRotationGroups()).find((r) => r.id === groupId)
  if (!row) throw new Error('Rotation group not found')
  return rotationGroupSchema.parse({
    ...row,
    manualOverride: null,
  }) as RotationGroup
}
