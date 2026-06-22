/**
 * Scheduling API functions — service categories, services, event packages, occasions.
 * All functions use the shared apiClient (with x-tenant-id header and auth token injection).
 */
import { apiClient, type PaginatedResponse } from '@/lib/api/client'
import {
  mapCategory,
  mapEventPackage,
  mapOccasion,
  mapService,
  type ApiCategory,
  type ApiEventPackage,
  type ApiOccasion,
  type ApiService,
} from '@/lib/api/mappers'
import { API_PATHS } from '@/lib/constants/api'
import type {
  EventPackage,
  SchedulingCategory,
  SchedulingOccasion,
  SchedulingService,
} from '@/lib/types'

const PUBLIC_CATALOG_REQUEST = { skipAuth: true, skipRefresh: true } as const

// ─── Categories ────────────────────────────────────────────────────────────────

interface FetchCategoriesParams {
  catalogSlug?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export async function fetchCategories(
  params: FetchCategoriesParams = {},
): Promise<SchedulingCategory[]> {
  const { data } = await apiClient.get<PaginatedResponse<ApiCategory>>(
    API_PATHS.serviceCategories,
    { params: { limit: 200, ...params }, ...PUBLIC_CATALOG_REQUEST } as any,
  )
  return data.items.map(mapCategory)
}

// ─── Services ─────────────────────────────────────────────────────────────────

interface FetchServicesParams {
  categoryId?: string
  catalogSlug?: string
  isActive?: boolean
  isFeatured?: boolean
  bookingMode?: string
  page?: number
  limit?: number
}

export async function fetchServices(
  params: FetchServicesParams = {},
  categoryMap: Map<string, SchedulingCategory> = new Map(),
): Promise<SchedulingService[]> {
  const { data } = await apiClient.get<PaginatedResponse<ApiService>>(
    API_PATHS.services,
    { params: { limit: 200, ...params }, ...PUBLIC_CATALOG_REQUEST } as any,
  )
  return data.items.map((s) => mapService(s, categoryMap))
}

// ─── Event Packages ────────────────────────────────────────────────────────────

interface FetchEventPackagesParams {
  serviceId?: string
  tier?: string
  isActive?: boolean
  displayPages?: string[]
  schedulingCategoryIds?: string[]
  page?: number
  limit?: number
}

export async function fetchEventPackages(
  params: FetchEventPackagesParams = {},
): Promise<EventPackage[]> {
  const { data } = await apiClient.get<PaginatedResponse<ApiEventPackage>>(
    API_PATHS.eventPackages,
    { params: { limit: 200, ...params }, ...PUBLIC_CATALOG_REQUEST } as any,
  )
  return data.items.map(mapEventPackage)
}

// ─── Occasions ─────────────────────────────────────────────────────────────────

export async function fetchOccasions(): Promise<SchedulingOccasion[]> {
  const { data } = await apiClient.get<PaginatedResponse<ApiOccasion>>(
    API_PATHS.schedulingOccasions,
    { params: { limit: 200 }, ...PUBLIC_CATALOG_REQUEST } as any,
  )
  return data.items.map(mapOccasion)
}

// ─── Paginated services for a single section ──────────────────────────────────

export interface SectionServicesPage {
  services: SchedulingService[]
  total: number
  page: number
  hasMore: boolean
}

export async function fetchServiceById(
  serviceId: string,
  categoryMap: Map<string, SchedulingCategory> = new Map(),
): Promise<SchedulingService | null> {
  try {
    const { data } = await apiClient.get<ApiService>(
      `${API_PATHS.services}/${serviceId}`,
      PUBLIC_CATALOG_REQUEST as any,
    )
    return mapService(data, categoryMap)
  } catch {
    return null
  }
}

export async function fetchServicesByCategory(
  categoryId: string,
  page: number,
  limit: number,
  categoryMap: Map<string, SchedulingCategory> = new Map(),
): Promise<SectionServicesPage> {
  const { data } = await apiClient.get<PaginatedResponse<ApiService>>(API_PATHS.services, {
    params: { categoryId, isActive: true, page, limit },
    ...PUBLIC_CATALOG_REQUEST,
  } as any)
  return {
    services: data.items.map((s) => mapService(s, categoryMap)),
    total: data.total,
    page: data.page,
    hasMore: data.page * data.limit < data.total,
  }
}

// ─── Combined catalog fetch ────────────────────────────────────────────────────

export interface SchedulingCatalogResult {
  categories: SchedulingCategory[]
  services: SchedulingService[]
  packages: EventPackage[]
  occasions: SchedulingOccasion[]
}

/**
 * Fetch all play-section catalog data in parallel.
 * Called once on app mount to hydrate the Redux scheduling slice.
 */
export async function fetchSchedulingCatalog(): Promise<SchedulingCatalogResult> {
  const [categories, packages, occasions] = await Promise.all([
    fetchCategories({ isActive: true }),
    fetchEventPackages({ isActive: true }),
    fetchOccasions(),
  ])

  const categoryMap = new Map(categories.map((c) => [c.id, c]))
  const services = await fetchServices({ isActive: true }, categoryMap)

  return { categories, services, packages, occasions }
}
