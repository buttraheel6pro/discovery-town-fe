/** Helpers for NestJS paginated list responses (`{ items, total, page, limit }`). */
import type { PaginationMeta } from '@/lib/types'

export interface PaginatedItems<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

function isPaginatedItems(value: unknown): value is PaginatedItems<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as PaginatedItems<unknown>).items) &&
    typeof (value as PaginatedItems<unknown>).total === 'number' &&
    typeof (value as PaginatedItems<unknown>).page === 'number' &&
    typeof (value as PaginatedItems<unknown>).limit === 'number'
  )
}

function isDataWrapper(value: unknown): value is { data: unknown[]; meta?: PaginationMeta } {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as { data: unknown[] }).data)
  )
}

/** Extract rows from array, `{ items }`, or legacy `{ data }` API payloads. */
export function extractListRows<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[]
  }
  if (isPaginatedItems(payload)) {
    return payload.items as T[]
  }
  if (isDataWrapper(payload)) {
    return payload.data as T[]
  }
  return []
}

/** Build pagination meta from Nest paginated payload or legacy wrapper. */
export function extractPaginationMeta(payload: unknown): PaginationMeta | null {
  if (isPaginatedItems(payload)) {
    const { page, limit, total } = payload
    return {
      page,
      limit,
      total,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    }
  }
  if (isDataWrapper(payload) && payload.meta) {
    return payload.meta
  }
  return null
}
