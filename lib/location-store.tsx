/** Location store — in-memory CRUD for admin + shared selectors (mock-backed). */
'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { locations as initialLocations } from '@/lib/mock-data'
import {
  createLocation as createLocationRequest,
  deleteLocation as deleteLocationRequest,
  listLocations,
  updateLocation as updateLocationRequest,
} from '@/lib/services/locations'
import type {
  CreateLocationPayload,
  Location,
  OperatingHours,
  UpdateLocationPayload,
} from '@/lib/types'

interface LocationStore {
  locations: Location[]
  isLoading: boolean
  loadError: string | null
  addLocation: (payload: CreateLocationPayload) => Promise<Location>
  updateLocation: (locationId: string, payload: UpdateLocationPayload) => Promise<Location>
  deleteLocation: (locationId: string) => Promise<void>
}

const LocationContext = createContext<LocationStore | null>(null)

function defaultOperatingHours(): OperatingHours[] {
  return [
    { dayOfWeek: 0, openTime: '09:00', closeTime: '18:00', isClosed: false },
    { dayOfWeek: 1, openTime: '09:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 2, openTime: '09:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 3, openTime: '09:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 4, openTime: '09:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 5, openTime: '09:00', closeTime: '21:00', isClosed: false },
    { dayOfWeek: 6, openTime: '09:00', closeTime: '18:00', isClosed: false },
  ]
}

function withRequiredSettings(location: Location): Location {
  return {
    ...location,
    isActive: location.isActive ?? true,
    settings: {
      operatingHours:
        location.settings?.operatingHours?.length > 0
          ? location.settings.operatingHours
          : defaultOperatingHours(),
    },
  }
}

export function LocationProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [locations, setLocations] = useState<Location[]>(() =>
    initialLocations.map((l) => withRequiredSettings({ ...l })),
  )
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadLocations(): Promise<void> {
      setIsLoading(true)
      setLoadError(null)

      try {
        const result = await listLocations({
          page: 1,
          limit: 20,
        })
        if (!isMounted) {
          return
        }
        setLocations(result.locations.map((location) => withRequiredSettings({ ...location })))
      } catch (error) {
        if (!isMounted) {
          return
        }
        setLoadError(error instanceof Error ? error.message : 'Failed to load locations')
      } finally {
        if (!isMounted) {
          return
        }
        setIsLoading(false)
      }
    }

    void loadLocations()

    return () => {
      isMounted = false
    }
  }, [])

  const value = useMemo<LocationStore>(() => {
    async function addLocation(payload: CreateLocationPayload): Promise<Location> {
      const created = await createLocationRequest(payload)
      const normalized = withRequiredSettings({ ...created })
      setLocations((prev) => [normalized, ...prev])
      return normalized
    }

    async function updateLocation(
      locationId: string,
      payload: UpdateLocationPayload,
    ): Promise<Location> {
      const updated = await updateLocationRequest(locationId, payload)
      const normalized = withRequiredSettings({ ...updated })
      setLocations((prev) => prev.map((l) => (l.id === locationId ? normalized : l)))
      return normalized
    }

    async function deleteLocation(locationId: string): Promise<void> {
      await deleteLocationRequest(locationId)
      setLocations((prev) => prev.filter((l) => l.id !== locationId))
    }

    return {
      locations,
      isLoading,
      loadError,
      addLocation,
      updateLocation,
      deleteLocation,
    }
  }, [isLoading, loadError, locations])

  return (
    <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
  )
}

export function useLocations(): LocationStore {
  const ctx = useContext(LocationContext)
  if (!ctx) {
    throw new Error('useLocations must be used within LocationProvider')
  }
  return ctx
}

