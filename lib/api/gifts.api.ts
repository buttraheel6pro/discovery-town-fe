/** Public gifts products API — fetches inventory products by gift category. */

import { apiClient, isApiEnabled } from '@/lib/api/client'
import type { PaginatedResponse } from '@/lib/api/client'

export interface GiftPublicProduct {
  id: string
  name: string
  description?: string | null
  price: number
  imageUrl?: string | null
  isFeatured: boolean
  sku: string
  isActive: boolean
}

export interface GiftProductsPage {
  products: GiftPublicProduct[]
  hasMore: boolean
  page: number
}

export interface GiftPublicCategory {
  id: string
  name: string
  displayOrder: unknown
  catalogSlug?: string | null
  description?: string | null
  imageUrl?: string | null
  isActive: boolean
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

export async function fetchGiftCategories(): Promise<GiftPublicCategory[]> {
  if (!isApiEnabled) return []

  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID
  if (!tenantId) return []

  const params = new URLSearchParams({ tenantId, catalogSlug: 'gifts' })

  const res = await apiClient.get<GiftPublicCategory[]>(
    `/product-categories/public?${params.toString()}`,
  )

  return res.data ?? []
}

export async function fetchGiftProductsByCategory(
  categoryId: string,
  page: number,
  limit: number,
): Promise<GiftProductsPage> {
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

  const products: GiftPublicProduct[] = items.map((item) => ({
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
