/** Cafe product reads and pickup-slot helpers — uses public products API when configured. */

import { apiClient, isApiEnabled } from '@/lib/api/client'
import type { PaginatedResponse } from '@/lib/api/client'
import { extractListRows } from '@/lib/api/pagination'
import { MOCK_CAFE_PRODUCTS, MOCK_ROTATION_GROUPS } from '@/lib/mock-data'
import {
  cafeProductSchema,
  cafePickupSlotSchema,
  type CafeProductParsed,
} from '@/lib/schemas/cafe'
import type { CafePickupSlot, CafeProduct } from '@/lib/types'

function parseProducts(rows: unknown): CafeProduct[] {
  return cafeProductSchema.array().parse(rows) as CafeProduct[]
}

function num(v: unknown, fallback = 0): number {
  if (v == null) return fallback
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback
  const n = parseFloat(String(v))
  return Number.isFinite(n) ? n : fallback
}

function mapPublicProductToCafeProduct(item: Record<string, unknown>): CafeProduct {
  return cafeProductSchema.parse({
    id: item.id,
    name: item.name,
    description: item.description ?? '',
    price: num(item.price),
    category: 'General',
    isActive: item.isActive ?? true,
    isFeatured: item.isFeatured ?? false,
    imageUrl: item.imageUrl ?? null,
    modifierGroupIds: [],
    attributeGroups: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }) as CafeProduct
}

/** Lists cafe products (API public catalog when configured, else fixtures). */
export async function listCafeProducts(): Promise<CafeProduct[]> {
  if (!isApiEnabled) {
    return parseProducts(MOCK_CAFE_PRODUCTS)
  }

  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID
  if (!tenantId) {
    return parseProducts(MOCK_CAFE_PRODUCTS)
  }

  try {
    const params = new URLSearchParams({ tenantId, page: '1', limit: '200' })
    const res = await apiClient.get<PaginatedResponse<Record<string, unknown>>>(
      `/products/public?${params.toString()}`,
      { skipAuth: true } as never,
    )
    const rows = extractListRows<Record<string, unknown>>(res.data)
    if (rows.length === 0) {
      return parseProducts(MOCK_CAFE_PRODUCTS)
    }
    return rows.map(mapPublicProductToCafeProduct)
  } catch {
    return parseProducts(MOCK_CAFE_PRODUCTS)
  }
}

/** Single product by id. */
export async function getCafeProduct(productId: string): Promise<CafeProduct | null> {
  const all = await listCafeProducts()
  return all.find((p) => p.id === productId) ?? null
}

/** Active rotation specials — one highlighted item per rotation group pool head. */
export async function getDailySpecials(): Promise<CafeProduct[]> {
  const products = isApiEnabled ? await listCafeProducts() : parseProducts(MOCK_CAFE_PRODUCTS)
  const rotationIds = new Set(
    MOCK_ROTATION_GROUPS.map((g) => g.activeProductId).filter(Boolean) as string[],
  )
  const out: CafeProduct[] = []
  for (const id of rotationIds) {
    const p = products.find((row) => row.id === id)
    if (p) out.push(p)
  }
  const featured = products.find((p) => p.category === 'Specialty' && p.id === 'cp-002')
  if (featured && !out.some((x) => x.id === featured.id)) {
    out.unshift(featured)
  }
  return out.slice(0, 8)
}

/** Generates 15-minute pickup slots for a date (mock capacity rules). */
export async function getPickupSlots(dateIso: string): Promise<CafePickupSlot[]> {
  const day = new Date(`${dateIso}T12:00:00`)
  if (Number.isNaN(day.getTime())) {
    throw new Error('Invalid date for pickup slots')
  }

  const openMin = 9 * 60 + 20
  const closeMin = 20 * 60 - 15
  const slots: CafePickupSlot[] = []
  let t = openMin
  const maxOrdersPerSlot = 4

  while (t <= closeMin) {
    const h = Math.floor(t / 60)
    const m = t % 60
    const label = new Date(2000, 0, 1, h, m).toLocaleTimeString('en-GB', {
      hour: 'numeric',
      minute: '2-digit',
    })
    const timeIso = `${dateIso}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
    const hash = (timeIso.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + day.getDate()) % 7
    const taken = hash % (maxOrdersPerSlot + 1)
    const available = taken < maxOrdersPerSlot
    slots.push(cafePickupSlotSchema.parse({ timeIso, available, label }))
    t += 15
  }

  return slots
}

export type CafeProductCreateInput = Omit<
  CafeProductParsed,
  'id' | 'createdAt' | 'updatedAt'
>

/** Validates a create payload (store assigns ids/timestamps locally when offline). */
export function validateCafeProductCreate(input: unknown): CafeProductCreateInput {
  return cafeProductSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(input)
}
