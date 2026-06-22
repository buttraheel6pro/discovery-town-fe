/** Locations and staff API fetchers for admin forms. */
import { apiClient } from '@/lib/api/client'
import type { Location, Staff } from '@/lib/types'

interface ApiLocation {
  id: string
  tenantId: string
  name: string
  address: string
  city: string
  country?: string
  postcode?: string | null
  timezone: string
  isActive?: boolean
  phone?: string | null
  email?: string | null
  settings?: Record<string, unknown>
}

interface ApiStaff {
  id: string
  tenantId: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  role: string
  locationIds?: string[]
  hourlyRate?: number | null
  isActive: boolean
  hireDate?: string | null
}

function mapApiLocation(a: ApiLocation): Location {
  return {
    id: a.id,
    tenantId: a.tenantId,
    name: a.name,
    address: a.address,
    city: a.city,
    country: a.country,
    postcode: a.postcode ?? '',
    timezone: a.timezone,
    isActive: a.isActive ?? true,
    phone: a.phone ?? undefined,
    email: a.email ?? undefined,
    settings: (a.settings ?? {}) as Location['settings'],
  }
}

function mapApiStaff(a: ApiStaff): Staff {
  return {
    id: a.id,
    tenantId: a.tenantId,
    firstName: a.firstName,
    lastName: a.lastName,
    email: a.email,
    phone: a.phone ?? undefined,
    role: a.role as Staff['role'],
    locationIds: a.locationIds ?? [],
    hourlyRate: a.hourlyRate ?? undefined,
    isActive: a.isActive,
    hireDate: a.hireDate ?? undefined,
  }
}

export async function fetchLocations(): Promise<Location[]> {
  const res = await apiClient.get<{ items: ApiLocation[] }>('/locations', {
    params: { limit: 100 },
  })
  return (res.data.items ?? []).map(mapApiLocation)
}

export async function fetchStaff(): Promise<Staff[]> {
  const res = await apiClient.get<{ items: ApiStaff[] }>('/staff', {
    params: { limit: 100 },
  })
  return (res.data.items ?? []).map(mapApiStaff)
}
