/** Public cafe products API — fetches inventory products by cafe category. */

import { apiClient, isApiEnabled } from '@/lib/api/client'
import type { PaginatedResponse } from '@/lib/api/client'

export interface PublicProduct {
  id: string
  name: string
  description?: string | null
  price: number
  imageUrl?: string | null
  isFeatured: boolean
  sku: string
  isActive: boolean
}

export interface CafeProductsPage {
  products: PublicProduct[]
  hasMore: boolean
  page: number
}

function num(v: unknown, fallback = 0): number {
  if (v == null) return fallback
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback
  if (typeof v === 'object' && !Array.isArray(v)) {
    const dec = v as { s?: number; e?: number; d?: number[] }
    if (Array.isArray(dec.d) && dec.d.length > 0 && typeof dec.e === 'number') {
      const coeff = dec.d[0]
      const digits = coeff === 0 ? 1 : Math.floor(Math.log10(coeff)) + 1
      const val = coeff * Math.pow(10, dec.e - digits + 1) * (dec.s === -1 ? -1 : 1)
      return Number.isFinite(val) ? val : fallback
    }
    return fallback
  }
  const n = parseFloat(String(v))
  return Number.isFinite(n) ? n : fallback
}

export interface PublicProductCategory {
  id: string
  name: string
  displayOrder: unknown
  catalogSlug?: string | null
  description?: string | null
  imageUrl?: string | null
  isActive: boolean
}

export async function fetchCafeCategories(): Promise<PublicProductCategory[]> {
  if (!isApiEnabled) return []

  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID
  if (!tenantId) return []

  const params = new URLSearchParams({ tenantId, catalogSlug: 'cafe' })

  const res = await apiClient.get<PublicProductCategory[]>(
    `/product-categories/public?${params.toString()}`,
  )

  return res.data ?? []
}

export async function fetchCafeProductsByCategory(
  categoryId: string,
  page: number,
  limit: number,
): Promise<CafeProductsPage> {
  if (!isApiEnabled) return { products: [], hasMore: false, page }

  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID
  if (!tenantId) return { products: [], hasMore: false, page }

  const params = new URLSearchParams({
    tenantId,
    categoryId,
    page: String(page),
    limit: String(limit),
  })

  const res = await apiClient.get<PaginatedResponse<Record<string, unknown>>>(
    `/products/public?${params.toString()}`,
  )

  const items = res.data.items ?? []
  const total = res.data.total ?? 0

  const products: PublicProduct[] = items.map((item) => ({
    id: item.id as string,
    name: item.name as string,
    description: (item.description as string | null) ?? null,
    price: num(item.price),
    imageUrl: (item.imageUrl as string | null) ?? null,
    isFeatured: (item.isFeatured as boolean) ?? false,
    sku: (item.sku as string) ?? '',
    isActive: (item.isActive as boolean) ?? true,
  }))

  return {
    products,
    hasMore: page * limit < total,
    page,
  }
}
