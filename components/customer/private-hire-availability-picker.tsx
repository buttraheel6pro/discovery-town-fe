/** Private hire availability — shared open-booking UI; duration-first + check, then range-labelled slots. */
'use client'

import { useEffect, useMemo, useState } from 'react'

import { OpenBookingAvailabilitySection } from '@/components/customer/open-booking-availability-section'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLocations } from '@/lib/location-store'
import { useScheduling } from '@/lib/scheduling-store'
import { generateDurationOptions } from '@/lib/utils'
import type { AvailableWindow, SchedulingService } from '@/lib/types'

export interface PrivateHireAvailabilityPickerProps {
  readonly serviceId?: string
  readonly locationId?: string
  readonly onWindowSelected?: (startAt: string, endAt: string) => void
}

export function PrivateHireAvailabilityPicker({
  serviceId: initialServiceId,
  locationId: initialLocationId,
  onWindowSelected,
}: Readonly<PrivateHireAvailabilityPickerProps>) {
  const { services } = useScheduling()
  const { locations } = useLocations()
  const hireServices = useMemo(
    () => services.filter((s) => s.serviceType === 'PRIVATE_HIRE' && s.isActive),
    [services],
  )

  const [locationId, setLocationId] = useState<string>(
    initialLocationId ?? locations[0]?.id ?? '',
  )
  const [serviceId, setServiceId] = useState<string>(
    initialServiceId ?? hireServices[0]?.id ?? '',
  )
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedWindow, setSelectedWindow] = useState<AvailableWindow | null>(null)
  const [durationMinutes, setDurationMinutes] = useState<number>(60)
  const [availabilityChecked, setAvailabilityChecked] = useState(false)

  const service: SchedulingService | undefined = useMemo(
    () => hireServices.find((s) => s.id === serviceId) ?? hireServices[0],
    [hireServices, serviceId],
  )

  const durationOptions = useMemo(() => {
    if (!service) return []
    const min = service.minDurationMinutes
    const max = service.maxDurationMinutes
    const inc = service.slotIncrementMinutes
    if (!min || !max || !inc || max <= min) return []
    return generateDurationOptions(min, max, inc)
  }, [service])

  useEffect(() => {
    if (!service) return
    const min = service.minDurationMinutes
    const max = service.maxDurationMinutes
    const inc = service.slotIncrementMinutes
    if (!min || !max || !inc || max <= min) return
    const opts = generateDurationOptions(min, max, inc)
    if (opts.length === 0) return
    setDurationMinutes((prev) => (opts.includes(prev) ? prev : opts[0]))
  }, [service])

  const maxAdvanceHours = service?.maxAdvanceHours ?? 0
  const maxAdvanceDate = useMemo(() => {
    if (maxAdvanceHours <= 0) return null
    return new Date(Date.now() + maxAdvanceHours * 3_600_000)
  }, [maxAdvanceHours])

  function handleSelectedWindowChange(w: AvailableWindow | null) {
    setSelectedWindow(w)
    if (!w || !service) return
    onWindowSelected?.(w.startAt, w.endAt)
  }

  function resetAvailabilityCheck() {
    setAvailabilityChecked(false)
    setSelectedWindow(null)
  }

  if (hireServices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Venue information coming soon.
      </p>
    )
  }

  if (!service) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Select a package to see availability.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {!initialLocationId ? (
        <div className="space-y-2">
          <Label>Location</Label>
          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {!initialServiceId ? (
        <div className="space-y-2">
          <Label>Package</Label>
          <Select value={serviceId} onValueChange={setServiceId}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Select package" />
            </SelectTrigger>
            <SelectContent>
              {hireServices.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <OpenBookingAvailabilitySection
        service={service}
        weekOffset={weekOffset}
        onWeekOffsetChange={setWeekOffset}
        selectedDate={selectedDate}
        onSelectedDateChange={setSelectedDate}
        selectedWindow={selectedWindow}
        onSelectedWindowChange={handleSelectedWindowChange}
        durationMinutes={durationMinutes}
        onDurationMinutesChange={setDurationMinutes}
        durationOptions={durationOptions}
        mode="private_hire"
        availabilityChecked={availabilityChecked}
        onCheckAvailability={() => setAvailabilityChecked(true)}
        onResetAvailabilityCheck={resetAvailabilityCheck}
        maxAdvanceDate={maxAdvanceDate}
      />
    </div>
  )
}
