/** Quick create modal — creates a new scheduled slot in local store. */

'use client'

import { useMemo, useState } from 'react'

import { CrudModal } from '@/components/admin/crud-modal'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LABELS } from '@/lib/constants/ui-labels'
import { locations, schedulingServices, staff } from '@/lib/mock-data'
import { useScheduling } from '@/lib/scheduling-store'
import { cn } from '@/lib/utils'
import type { SchedulingService, SchedulingSlot } from '@/lib/types'

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

function createSlotId(): string {
  return `slot-${Math.random().toString(16).slice(2, 10)}`
}

export function QuickCreateModal({
  defaultDate,
  defaultTime,
  open,
  onClose,
}: Readonly<{
  defaultDate: Date
  defaultTime?: string
  open: boolean
  onClose: () => void
}>) {
  const { addSlot } = useScheduling()

  const [serviceId, setServiceId] = useState<string>(schedulingServices[0]?.id ?? '')
  const [date, setDate] = useState<Date | undefined>(defaultDate)
  const [time, setTime] = useState<string>(defaultTime ?? '10:00')
  const [endTime, setEndTime] = useState<string>('11:00')
  const [locationId, setLocationId] = useState<string>(locations[0]?.id ?? 'loc-1')
  const [staffId, setStaffId] = useState<string>('UNASSIGNED')
  const [capacityOverride, setCapacityOverride] = useState<string>('')
  const [priceOverride, setPriceOverride] = useState<string>('')

  const selectedService = useMemo<SchedulingService | undefined>(() => {
    return schedulingServices.find((s) => s.id === serviceId)
  }, [serviceId])

  const effectiveLocationId = useMemo(() => {
    return selectedService?.locationId ?? locationId
  }, [locationId, selectedService?.locationId])

  const selectedStaff = useMemo(() => {
    if (staffId === 'UNASSIGNED') return null
    return staff.find((s) => s.id === staffId) ?? null
  }, [staffId])

  function handleSubmit() {
    if (!date || !selectedService) return

    const startAt = combineDateTime(date, time).toISOString()
    const derivedEndTime = addMinutesToTime(time, selectedService.durationMinutes)
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
      serviceId: selectedService.id,
      service: selectedService,
      locationId: effectiveLocationId,
      staffId: selectedStaff?.id ?? null,
      staffName: selectedStaff ? `${selectedStaff.firstName} ${selectedStaff.lastName}`.trim() : null,
      startAt,
      endAt,
      capacityOverride: normalizedCap,
      priceOverride: normalizedPrice,
      bookedCount: 0,
      checkInCount: 0,
      effectiveCapacity: normalizedCap ?? selectedService.capacity,
      effectivePrice: normalizedPrice ?? selectedService.basePrice,
      status: 'SCHEDULED',
      isActive: true,
      isRecurring: false,
      notes: null,
    }

    addSlot(slot)
    onClose()
  }

  return (
    <CrudModal
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
      title="New session"
      description="Pick a service, date, and start time."
      size="md"
      variant="create"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={handleSubmit}
            disabled={!selectedService || !date || !time}
          >
            Create
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{LABELS.service}</Label>
          <Select value={serviceId} onValueChange={setServiceId}>
            <SelectTrigger>
              <SelectValue placeholder={`Select an ${LABELS.service.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {schedulingServices.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Location</Label>
          <Select
            value={effectiveLocationId}
            onValueChange={(v) => setLocationId(v)}
            disabled={Boolean(selectedService?.locationId)}
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
        </div>

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
              if (selectedService) {
                setEndTime(addMinutesToTime(next, selectedService.durationMinutes))
              }
            }}
            placeholder="HH:MM"
            inputMode="numeric"
          />
          <p className={cn('text-xs text-muted-foreground')}>Use 24h time, e.g. 14:30.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="end-time">End time</Label>
          <Input
            id="end-time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            placeholder={selectedService ? addMinutesToTime(time, selectedService.durationMinutes) : '11:00'}
          />
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
              placeholder={String(selectedService?.capacity ?? 0)}
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
              placeholder={String(selectedService?.basePrice ?? 0)}
            />
          </div>
        </div>
      </div>
    </CrudModal>
  )
}
