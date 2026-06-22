/** Inventory products & categories API integration for admin management. */
import { apiClient } from '@/lib/api/client'

const PRODUCTS = '/products'
const PRODUCT_CATEGORIES = '/product-categories'

export interface CreateProductPayload {
  categoryId: string
  name: string
  sku: string
  price: string
  description?: string
  stockCount?: number
  lowStockThreshold?: number
  trackInventory?: boolean
  allowBackorders?: boolean
  taxable?: boolean
  taxRate?: string
  availableOnline?: boolean
  availablePOS?: boolean
  isActive?: boolean
  compareAtPrice?: string
  costPrice?: string
  subscriptionPrice?: string
}

export interface ApiProduct {
  id: string
  categoryId: string
  name: string
  sku: string
  price: string
  isActive: boolean
}

export interface CreateProductCategoryPayload {
  name: string
  parentId?: string | null
  displayOrder?: string | number
  isActive?: boolean
  productType?: string
  catalogSlug?: string
}

export interface ApiProductCategory {
  id: string
  name: string
  parentId?: string | null
  displayOrder?: number
  isActive: boolean
}

export async function createProduct(payload: CreateProductPayload): Promise<ApiProduct> {
  const response = await apiClient.post(PRODUCTS, payload)
  return response.data as ApiProduct
}

export async function updateProduct(
  id: string,
  patch: Partial<CreateProductPayload>,
): Promise<ApiProduct> {
  const response = await apiClient.patch(`${PRODUCTS}/${id}`, patch)
  return response.data as ApiProduct
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`${PRODUCTS}/${id}`)
}

export async function createProductCategory(
  payload: CreateProductCategoryPayload,
): Promise<ApiProductCategory> {
  const body: Record<string, unknown> = { name: payload.name }
  if (payload.parentId) body.parentId = payload.parentId
  if (payload.displayOrder !== undefined) body.displayOrder = String(payload.displayOrder)
  if (payload.isActive !== undefined) body.isActive = payload.isActive
  if (payload.productType) body.productType = payload.productType
  if (payload.catalogSlug) body.catalogSlug = payload.catalogSlug
  const response = await apiClient.post(PRODUCT_CATEGORIES, body)
  return response.data as ApiProductCategory
}

export async function updateProductCategory(
  id: string,
  patch: Partial<CreateProductCategoryPayload>,
): Promise<ApiProductCategory> {
  const body: Record<string, unknown> = {}
  if (patch.name !== undefined) body.name = patch.name
  if (patch.parentId !== undefined) body.parentId = patch.parentId
  if (patch.displayOrder !== undefined) body.displayOrder = String(patch.displayOrder)
  if (patch.isActive !== undefined) body.isActive = patch.isActive
  if (patch.productType !== undefined) body.productType = patch.productType
  const response = await apiClient.patch(`${PRODUCT_CATEGORIES}/${id}`, body)
  return response.data as ApiProductCategory
}

export async function deleteProductCategory(id: string): Promise<void> {
  await apiClient.delete(`${PRODUCT_CATEGORIES}/${id}`)
}
