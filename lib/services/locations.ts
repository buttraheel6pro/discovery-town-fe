/** Locations API service for listing available tenant locations. */
import { apiClient } from '@/lib/api/client'
import { extractListRows, extractPaginationMeta } from '@/lib/api/pagination'
import { API_PATHS } from '@/lib/constants/api'
import {
  apiLocationSchema,
  operatingHoursSchema,
} from '@/lib/schemas/locations/list'
import type {
  CreateLocationPayload,
  ListLocationsParams,
  Location,
  OperatingHours,
  PaginationMeta,
  UpdateLocationPayload,
} from '@/lib/types'

export interface ListLocationsResult {
  readonly locations: Location[]
  readonly meta: PaginationMeta | null
}

function normalizeParams(params: ListLocationsParams): Required<ListLocationsParams> {
  return {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  }
}

function toOperatingHours(value: unknown): OperatingHours[] {
  const parsed = operatingHoursSchema.array().safeParse(value)
  return parsed.success ? parsed.data : []
}

function mapResponseToLocations(payload: unknown): Location[] {
  const rows = extractListRows<unknown>(payload)

  return rows.map((row) => {
    const parsed = apiLocationSchema.parse(row)
    return {
      id: parsed.id,
      tenantId: parsed.tenantId,
      name: parsed.name,
      address: parsed.address,
      city: parsed.city,
      country: parsed.country,
      postcode: parsed.postcode ?? '',
      timezone: parsed.timezone,
      isActive: parsed.isActive ?? true,
      phone: parsed.phone,
      email: parsed.email,
      settings: {
        operatingHours: toOperatingHours(parsed.settings?.operatingHours),
      },
      imageUrl: parsed.imageUrl ?? undefined,
      createdAt: parsed.createdAt,
      updatedAt: parsed.updatedAt,
    }
  })
}

function mapApiLocationToLocation(row: {
  id: string
  tenantId: string
  name: string
  address: string
  city: string
  country?: string
  postcode?: string
  timezone: string
  isActive?: boolean
  phone?: string
  email?: string
  settings: {
    operatingHours?: OperatingHours[]
  } & Record<string, unknown>
  imageUrl?: string | null
  createdAt: string
  updatedAt: string
}): Location {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    address: row.address,
    city: row.city,
    country: row.country,
    postcode: row.postcode ?? '',
    timezone: row.timezone,
    isActive: row.isActive ?? true,
    phone: row.phone,
    email: row.email,
    settings: {
      operatingHours: toOperatingHours(row.settings?.operatingHours),
    },
    imageUrl: row.imageUrl ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function listLocations(
  params: ListLocationsParams = {},
): Promise<ListLocationsResult> {
  const normalized = normalizeParams(params)
  const response = await apiClient.get(API_PATHS.locations, {
    params: normalized,
  })

  const locations = mapResponseToLocations(response.data)

  return {
    locations,
    meta: extractPaginationMeta(response.data),
  }
}

export async function createLocation(payload: CreateLocationPayload): Promise<Location> {
  const response = await apiClient.post(API_PATHS.locations, payload)

  const raw = response.data as unknown
  const parsed = apiLocationSchema.safeParse(raw)
  if (parsed.success) {
    return mapApiLocationToLocation(parsed.data)
  }

  const wrapped = apiLocationSchema.safeParse(
    typeof raw === 'object' && raw !== null && 'data' in raw
      ? (raw as { data: unknown }).data
      : raw,
  )
  if (!wrapped.success) {
    throw new Error('Invalid create location response')
  }

  return mapApiLocationToLocation(wrapped.data)
}

export async function updateLocation(
  locationId: string,
  payload: UpdateLocationPayload,
): Promise<Location> {
  const response = await apiClient.patch(`${API_PATHS.locations}/${locationId}`, payload)

  const raw = response.data as unknown
  const parsed = apiLocationSchema.safeParse(raw)
  if (parsed.success) {
    return mapApiLocationToLocation(parsed.data)
  }

  const wrapped = apiLocationSchema.safeParse(
    typeof raw === 'object' && raw !== null && 'data' in raw
      ? (raw as { data: unknown }).data
      : raw,
  )
  if (!wrapped.success) {
    throw new Error('Invalid update location response')
  }

  return mapApiLocationToLocation(wrapped.data)
}

export async function deleteLocation(locationId: string): Promise<void> {
  await apiClient.delete(`${API_PATHS.locations}/${locationId}`)
}
