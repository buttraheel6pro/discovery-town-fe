/** Inline facility booking — content + cart via provider (legacy standalone layout). */
'use client'

import {
  PlayFacilityBookingContentFromContext,
  PlayFacilityBookingCartFromContext,
} from '@/components/customer/play-category-booking-panel'
import { PlayFacilityBookingProvider } from '@/components/customer/play-facility-booking-provider'
import type { SchedulingService } from '@/lib/types'

export interface PlayInlineFacilityBookingProps {
  readonly service: SchedulingService
}

export function PlayInlineFacilityBooking({
  service,
}: Readonly<PlayInlineFacilityBookingProps>) {
  return (
    <PlayFacilityBookingProvider service={service}>
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PlayFacilityBookingContentFromContext />
        </div>
        <aside className="lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
          <PlayFacilityBookingCartFromContext />
        </aside>
      </div>
    </PlayFacilityBookingProvider>
  )
}
