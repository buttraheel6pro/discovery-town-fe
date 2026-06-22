/** Context for split play facility booking content + cart columns. */
'use client'

import { createContext, useContext, type ReactNode } from 'react'

import { usePlayFacilityBooking, type PlayFacilityBookingState } from '@/hooks/use-play-facility-booking'
import type { SchedulingService } from '@/lib/types'

const PlayFacilityBookingContext = createContext<PlayFacilityBookingState | null>(null)

export interface PlayFacilityBookingProviderProps {
  readonly service: SchedulingService | null
  readonly children: ReactNode
}

function PlayFacilityBookingProviderInner({
  service,
  children,
}: Readonly<{ service: SchedulingService; children: ReactNode }>) {
  const booking = usePlayFacilityBooking(service)
  return (
    <PlayFacilityBookingContext.Provider value={booking}>
      {children}
    </PlayFacilityBookingContext.Provider>
  )
}

export function PlayFacilityBookingProvider({
  service,
  children,
}: Readonly<PlayFacilityBookingProviderProps>) {
  if (!service) {
    return (
      <PlayFacilityBookingContext.Provider value={null}>
        {children}
      </PlayFacilityBookingContext.Provider>
    )
  }

  return (
    <PlayFacilityBookingProviderInner key={service.id} service={service}>
      {children}
    </PlayFacilityBookingProviderInner>
  )
}

export function usePlayFacilityBookingContext(): PlayFacilityBookingState | null {
  return useContext(PlayFacilityBookingContext)
}

/** Fixed height for the play service list column — room for ~5 items without clipping. */
export const PLAY_SERVICE_LIST_HEIGHT_CLASS =
  'h-[min(22rem,50vh)] min-h-[18rem]'
