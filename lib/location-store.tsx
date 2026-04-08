/** Location store — in-memory CRUD for admin + shared selectors (mock-backed). */
'use client'

import React, { createContext, useContext, useMemo, useState } from 'react'

import { locations as initialLocations } from '@/lib/mock-data'
import type { Location, OperatingHours } from '@/lib/types'

interface LocationStore {
  locations: Location[]
  addLocation: (location: Location) => void
  updateLocation: (locationId: string, patch: Partial<Location>) => void
  deleteLocation: (locationId: string) => void
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

  const value = useMemo<LocationStore>(() => {
    function addLocation(location: Location) {
      setLocations((prev) => [withRequiredSettings({ ...location }), ...prev])
    }

    function updateLocation(locationId: string, patch: Partial<Location>) {
      setLocations((prev) =>
        prev.map((l) =>
          l.id === locationId
            ? withRequiredSettings({
                ...l,
                ...patch,
                settings: patch.settings ?? l.settings,
                updatedAt: patch.updatedAt ?? new Date().toISOString(),
              })
            : l,
        ),
      )
    }

    function deleteLocation(locationId: string) {
      setLocations((prev) => prev.filter((l) => l.id !== locationId))
    }

    return { locations, addLocation, updateLocation, deleteLocation }
  }, [locations])

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

