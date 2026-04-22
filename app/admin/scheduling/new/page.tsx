/** Admin scheduling new session — guided creation flow. */

'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { BookingModeBadge } from '@/components/admin/booking-mode-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LABELS } from '@/lib/constants/ui-labels'
import { locations, staff } from '@/lib/mock-data'
import { useScheduling } from '@/lib/scheduling-store'
import { cn } from '@/lib/utils'
import type { SchedulingService, SchedulingSlot } from '@/lib/types'

type Step = 1 | 2 | 3 | 4
const DEFAULT_START_TIME = '10:00'

function createSlotId(): string {
  return `slot-${Math.random().toString(16).slice(2, 10)}`
}

function combineDateTime(date: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(date)
  d.setHours(h, m, 0, 0)
  return d
}

function addMinutesToTime(time: string, minutesToAdd: number): string {
  const [hRaw, mRaw] = time.split(':').map(Number)
  const baseMinutes = (Number.isFinite(hRaw) ? hRaw : 0) * 60 + (Number.isFinite(mRaw) ? mRaw : 0)
  const next = (baseMinutes + minutesToAdd + 24 * 60) % (24 * 60)
  const h = Math.floor(next / 60)
  const m = next % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function AdminSchedulingNewPageInner() {
  const searchParams = useSearchParams()
  const { addSlot, services } = useScheduling()
  const requestedServiceId = searchParams.get('serviceId')?.trim() ?? ''
  const defaultServiceId = useMemo(() => {
    if (requestedServiceId && services.some((entry) => entry.id === requestedServiceId)) {
      return requestedServiceId
    }
    return services[0]?.id ?? ''
  }, [requestedServiceId, services])

  const [step, setStep] = useState<Step>(1)
  const [serviceId, setServiceId] = useState<string>('')
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState<string>(DEFAULT_START_TIME)
  const [endTime, setEndTime] = useState<string>('11:00')
  const [notes, setNotes] = useState<string>('')
  const [locationId, setLocationId] = useState<string>(locations[0]?.id ?? 'loc-1')
  const [staffId, setStaffId] = useState<string>('UNASSIGNED')
  const [capacityOverride, setCapacityOverride] = useState<string>('')
  const [priceOverride, setPriceOverride] = useState<string>('')

  useEffect(() => {
    if (!defaultServiceId) return
    setServiceId((current) => (current === defaultServiceId ? current : defaultServiceId))
  }, [defaultServiceId])

  const service = useMemo<SchedulingService | undefined>(() => {
    return services.find((entry) => entry.id === serviceId)
  }, [serviceId, services])

  useEffect(() => {
    if (!service) return
    setEndTime(addMinutesToTime(DEFAULT_START_TIME, service.durationMinutes))
    if (service.locationId) {
      setLocationId(service.locationId)
    }
  }, [service])

  const isOpenMode = service?.bookingMode === 'OPEN'

  const effectiveLocationId = useMemo(() => {
    return service?.locationId ?? locationId
  }, [locationId, service?.locationId])

  const selectedStaff = useMemo(() => {
    if (staffId === 'UNASSIGNED') return null
    return staff.find((s) => s.id === staffId) ?? null
  }, [staffId])

  function handleCreate(isActive: boolean) {
    if (!service || !date) return

    const startAt = combineDateTime(date, time).toISOString()
    const derivedEndTime = addMinutesToTime(time, service.durationMinutes)
    const safeEndTime = endTime.trim().length > 0 ? endTime : derivedEndTime
    const endAtCandidate = combineDateTime(date, safeEndTime)
    const endAt =
      endAtCandidate.getTime() > new Date(startAt).getTime()
        ? endAtCandidate.toISOString()
        : combineDateTime(date, derivedEndTime).toISOString()

    const capOverride =
      capacityOverride.trim().length > 0 ? Number.parseInt(capacityOverride.trim(), 10) : null
    const priceOverrideNum =
      priceOverride.trim().length > 0 ? Number.parseFloat(priceOverride.trim()) : null

    const normalizedCap =
      capOverride !== null && Number.isFinite(capOverride) && capOverride > 0 ? capOverride : null
    const normalizedPrice =
      priceOverrideNum !== null && Number.isFinite(priceOverrideNum) && priceOverrideNum >= 0
        ? priceOverrideNum
        : null

    const slot: SchedulingSlot = {
      id: createSlotId(),
      serviceId: service.id,
      service,
      locationId: effectiveLocationId,
      staffId: selectedStaff?.id ?? null,
      staffName: selectedStaff ? `${selectedStaff.firstName} ${selectedStaff.lastName}`.trim() : null,
      startAt,
      endAt,
      capacityOverride: normalizedCap,
      priceOverride: normalizedPrice,
      bookedCount: 0,
      checkInCount: 0,
      effectiveCapacity: normalizedCap ?? service.capacity,
      effectivePrice: normalizedPrice ?? service.basePrice,
      status: 'SCHEDULED',
      isActive,
      isRecurring: false,
      notes: notes.trim() ? notes.trim() : null,
    }

    addSlot(slot)
    window.location.href = `/admin/scheduling/${slot.id}`
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{LABELS.createSlot}</h1>
        <p className="text-muted-foreground mt-2">
          Create a new scheduled {LABELS.serviceSlot.toLowerCase()}. Open-mode {LABELS.services.toLowerCase()} don’t require {LABELS.serviceSlots.toLowerCase()}.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Step {step} of 4</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {step === 1 ? (
            <div className="space-y-3">
              <Label>{LABELS.service}</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select an ${LABELS.service.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {services.map((entry) => (
                    <SelectItem key={entry.id} value={entry.id}>
                      {entry.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {service ? (
                <div className="flex items-center gap-2">
                  <BookingModeBadge mode={service.bookingMode} />
                  <span className="text-xs text-muted-foreground">
                    {service.bookingMode === 'OPEN'
                      ? 'Customers choose time windows'
                      : `Customers book a specific ${LABELS.serviceSlot.toLowerCase()}`}
                  </span>
                </div>
              ) : null}

              <div className="flex justify-end">
                <Button
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => setStep(2)}
                  disabled={!service}
                >
                  Continue
                </Button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            isOpenMode ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border bg-secondary">
                  <p className="font-bold">This is an open-booking {LABELS.service.toLowerCase()}.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Customers choose their own time windows. No {LABELS.serviceSlots.toLowerCase()} needed.
                  </p>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Link href="/admin/scheduling">
                      <Button variant="outline">View {LABELS.serviceSlots}</Button>
                    </Link>
                    <Link href="/admin/scheduling/services">
                      <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                        View {LABELS.services}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select
                    value={effectiveLocationId}
                    onValueChange={(v) => setLocationId(v)}
                    disabled={Boolean(service?.locationId)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {service?.locationId ? (
                    <p className="text-xs text-muted-foreground">
                      This event already has a fixed location.
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Calendar mode="single" selected={date} onSelect={setDate} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Start time</Label>
                  <Input
                    id="time"
                    value={time}
                    onChange={(e) => {
                      const next = e.target.value
                      setTime(next)
                      if (service) {
                        setEndTime(addMinutesToTime(next, service.durationMinutes))
                      }
                    }}
                    placeholder="HH:MM"
                  />
                  <p className={cn('text-xs text-muted-foreground')}>
                    Use 24h time, e.g. 14:30.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">End time</Label>
                  <Input
                    id="end-time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder={service ? addMinutesToTime(time, service.durationMinutes) : '11:00'}
                  />
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={() => setStep(3)}
                    disabled={!date || !time || !endTime}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Staff (optional)</Label>
                <Select value={staffId} onValueChange={setStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                    {staff
                      .filter((s) => s.isActive)
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.firstName} {s.lastName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cap-override">Capacity override (optional)</Label>
                  <Input
                    id="cap-override"
                    type="number"
                    min={1}
                    value={capacityOverride}
                    onChange={(e) => setCapacityOverride(e.target.value)}
                    placeholder={String(service?.capacity ?? 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price-override">Price override (optional)</Label>
                  <Input
                    id="price-override"
                    type="number"
                    min={0}
                    step={0.01}
                    value={priceOverride}
                    onChange={(e) => setPriceOverride(e.target.value)}
                    placeholder={String(service?.basePrice ?? 0)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes"
                />
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => setStep(4)}
                >
                  Continue
                </Button>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-border bg-card space-y-1">
                <p className="font-bold">Review</p>
                <p className="text-sm text-muted-foreground">
                  {LABELS.service}: {service?.name ?? '—'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Location: {locations.find((l) => l.id === effectiveLocationId)?.name ?? '—'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Staff: {selectedStaff ? `${selectedStaff.firstName} ${selectedStaff.lastName}` : 'Unassigned'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Date: {date ? date.toLocaleDateString('en-GB') : '—'}
                </p>
                <p className="text-sm text-muted-foreground">Time: {time}</p>
                <p className="text-sm text-muted-foreground">End: {endTime}</p>
                <p className="text-sm text-muted-foreground">
                  Capacity override: {capacityOverride.trim() ? capacityOverride.trim() : '—'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Price override: {priceOverride.trim() ? priceOverride.trim() : '—'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Notes: {notes.trim() ? notes.trim() : '—'}
                </p>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>
                  Back
                </Button>
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleCreate(false)}
                    disabled={!service || !date || !time}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    type="button"
                    className="bg-green-600 text-white hover:bg-green-600/90"
                    onClick={() => handleCreate(true)}
                    disabled={!service || !date || !time}
                  >
                    Publish {LABELS.serviceSlot}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminSchedulingNewPage() {
  return (
    <Suspense>
      <AdminSchedulingNewPageInner />
    </Suspense>
  )
}
