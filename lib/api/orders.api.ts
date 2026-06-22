/**
 * Orders API — storefront checkout and admin/account list reads.
 */
import { apiClient, type PaginatedResponse } from '@/lib/api/client'
import { extractListRows } from '@/lib/api/pagination'
import { API_PATHS } from '@/lib/constants/api'
import type { Order, OrderItem } from '@/lib/types'

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? ''

export interface CheckoutOrderItem {
  productId: string
  quantity: number
}

export interface CheckoutOrderPayload {
  contactId?: string
  guestEmail?: string
  locationId?: string
  channel: 'ONLINE' | 'POS'
  items: CheckoutOrderItem[]
  couponCode?: string
}

export interface CheckoutResponse {
  clientSecret: string | null
  orderId: string
}

export async function checkoutOrder(order: CheckoutOrderPayload): Promise<CheckoutResponse> {
  const { data } = await apiClient.post<CheckoutResponse>(
    `${API_PATHS.orders}/checkout`,
    { tenantId: TENANT_ID, order },
    { skipAuth: true } as never,
  )
  return data
}

export interface ApiOrderRow {
  id: string
  tenantId: string
  orderNumber?: string | null
  contactId?: string | null
  contactName?: string | null
  contactEmail?: string | null
  channel: 'ONLINE' | 'POS'
  status: Order['status']
  paymentStatus: Order['paymentStatus']
  paymentGateway?: Order['paymentGateway'] | null
  subtotal: number | string
  discountAmount?: number | string
  taxAmount?: number | string
  total: number | string
  createdAt: string
  updatedAt: string
  items?: Array<{
    id: string
    orderId: string
    productId: string
    quantity: number
    unitPrice: number | string
    lineTotal?: number | string
    product?: { name?: string }
  }>
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  const n = parseFloat(String(value))
  return Number.isFinite(n) ? n : 0
}

export function mapApiOrder(row: ApiOrderRow): Order {
  const items: OrderItem[] = (row.items ?? []).map((item) => {
    const unitPrice = toNumber(item.unitPrice)
    const lineTotal = toNumber(item.lineTotal ?? unitPrice * item.quantity)
    return {
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      productName: item.product?.name ?? item.productId,
      quantity: item.quantity,
      unitPrice,
      totalPrice: lineTotal,
      total: lineTotal,
    }
  })

  return {
    id: row.id,
    tenantId: row.tenantId,
    orderNumber: row.orderNumber ?? row.id,
    contactId: row.contactId ?? '',
    contactName: row.contactName ?? undefined,
    contactEmail: row.contactEmail ?? undefined,
    channel: row.channel,
    items,
    subtotal: toNumber(row.subtotal),
    discount: toNumber(row.discountAmount),
    tax: toNumber(row.taxAmount),
    total: toNumber(row.total),
    status: row.status,
    paymentStatus: row.paymentStatus,
    paymentGateway: row.paymentGateway ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function listOrders(params?: {
  page?: number
  limit?: number
  contactId?: string
  status?: string
}): Promise<Order[]> {
  const { data } = await apiClient.get<PaginatedResponse<ApiOrderRow>>(API_PATHS.orders, {
    params: { limit: 100, ...params },
  })
  return extractListRows<ApiOrderRow>(data).map(mapApiOrder)
}

export async function getOrder(id: string): Promise<Order> {
  const { data } = await apiClient.get<ApiOrderRow>(`${API_PATHS.orders}/${id}`)
  return mapApiOrder(data)
}
