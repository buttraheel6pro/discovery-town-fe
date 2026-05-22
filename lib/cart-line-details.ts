/** Helpers for cart line “view details” dialog (cafe metadata, shop options, ids). */

import type { CartItem } from '@/lib/types'

export function extractCartLineServiceId(metadata: CartItem['metadata']): string {
  if (!metadata || typeof metadata !== 'object') return ''
  const id = (metadata as { serviceId?: unknown }).serviceId
  return typeof id === 'string' ? id : ''
}

export function extractCartLineProductId(metadata: CartItem['metadata']): string {
  if (!metadata || typeof metadata !== 'object') return ''
  const id = (metadata as { productId?: unknown }).productId
  return typeof id === 'string' ? id : ''
}

export function extractCafeCustomerNoteFromMetadata(metadata: CartItem['metadata']): string {
  if (!metadata || typeof metadata !== 'object') return ''
  const note = (metadata as { customerNote?: unknown }).customerNote
  return typeof note === 'string' ? note.trim() : ''
}

export function extractCafeSelectedAttributeLinesFromMetadata(
  metadata: CartItem['metadata'],
): string[] {
  if (!metadata || typeof metadata !== 'object') return []
  const selectedAttributes = (
    metadata as {
      selectedAttributes?: Array<{ groupName?: unknown; optionLabel?: unknown }>
    }
  ).selectedAttributes
  if (!Array.isArray(selectedAttributes)) return []
  return selectedAttributes
    .map((entry) =>
      typeof entry.groupName === 'string' && typeof entry.optionLabel === 'string'
        ? `${entry.groupName}: ${entry.optionLabel}`
        : '',
    )
    .filter((entry) => entry.length > 0)
}

export function buildShopSelectedOptionLines(item: CartItem): string[] {
  if (!item.selectedShopAttributes) return []
  const grouped = item.shopAttributeGroupsSnapshot ?? []
  return grouped
    .map((group) => {
      const labels = item.selectedShopAttributes?.[group.id] ?? []
      if (labels.length === 0) return ''
      return `${group.name}: ${labels.join(', ')}`
    })
    .filter((entry) => entry.length > 0)
}
