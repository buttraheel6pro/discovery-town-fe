/** Recurring-session form used by the dedicated admin create page. */
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { LABELS } from '@/lib/constants/ui-labels'
import { locations, staff } from '@/lib/mock-data'
import { useScheduling } from '@/lib/scheduling-store'
import { cn } from '@/lib/utils'
import type { SchedulingService, SchedulingSlot } from '@/lib/types'

export type RecurrenceType = 'DAILY' | 'WEEKLY' | 'MONTHLY'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function stripTime(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function combineDateTime(date: Date, time: string): Date {
  const [h, m] = time.split(':').map((v) => Number.parseInt(v, 10))
  const d = new Date(date)
  d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0)
  return d
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map((v) => Number.parseInt(v, 10))
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0
  return h * 60 + m
}

function createSlotId(): string {
  return `slot-${Math.random().toString(16).slice(2, 10)}`
}

function eachCalendarDay(start: Date, end: Date): Date[] {
  const out: Date[] = []
  const cur = stripTime(start)
  const last = stripTime(end)
  while (cur.getTime() <= last.getTime()) {
    out.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

function buildOccurrenceDates(
  recurrenceType: RecurrenceType,
  daysOfWeek: number[],
  startDate: Date,
  endDate: Date,
): Date[] {
  const start = stripTime(startDate)
  const end = stripTime(endDate)
  if (end.getTime() < start.getTime()) return []

  if (recurrenceType === 'DAILY') {
    return eachCalendarDay(start, end)
  }

  if (recurrenceType === 'WEEKLY') {
    const set = new Set(daysOfWeek)
    return eachCalendarDay(start, end).filter((d) => set.has(d.getDay()))
  }

  const out: Date[] = []
  const cur = new Date(start)
  while (cur.getTime() <= end.getTime()) {
    out.push(new Date(cur))
    cur.setMonth(cur.getMonth() + 1)
  }
  return out
}

export interface SlotRecurringFormProps {
  readonly showCancel?: boolean
  readonly initialServiceId?: string
  readonly returnTo?: string
}

export function SlotRecurringForm({
  showCancel = true,
  initialServiceId = '',
  returnTo = '/admin/scheduling',
}: SlotRecurringFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { services, addSlots } = useScheduling()

  const [serviceId, setServiceId] = useState<string>('')
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('WEEKLY')
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5])
  const [rangeStart, setRangeStart] = useState<Date | undefined>(() => new Date())
  const [rangeEnd, setRangeEnd] = useState<Date | undefined>(() => {
    const d = new Date()
    d.setDate(d.getDate() + 28)
    return d
  })
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:30')
  const [capacity, setCapacity] = useState('20')
  const [staffId, setStaffId] = useState<string>('UNASSIGNED')
  const [locationId, setLocationId] = useState<string>(() => locations[0]?.id ?? 'loc-1')
  const [publishImmediately, setPublishImmediately] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [debounceToken, setDebounceToken] = useState(0)

  const service = useMemo<SchedulingService | undefined>(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId],
  )

  useEffect(() => {
    if (!initialServiceId) return
    const exists = services.some((entry) => entry.id === initialServiceId)
    if (!exists) return
    setServiceId((current) => (current === initialServiceId ? current : initialServiceId))
  }, [initialServiceId, services])

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebounceToken((k) => k + 1)
    }, 300)
    return () => window.clearTimeout(t)
  }, [recurrenceType, daysOfWeek, rangeStart, rangeEnd, startTime, endTime])

  const previewDates = useMemo(() => {
    void debounceToken
    if (!rangeStart || !rangeEnd) return []
    return buildOccurrenceDates(
      recurrenceType,
      recurrenceType === 'WEEKLY' ? daysOfWeek : [],
      rangeStart,
      rangeEnd,
    )
  }, [debounceToken, recurrenceType, daysOfWeek, rangeStart, rangeEnd])

  const timeValid = useMemo(() => {
    return timeToMinutes(endTime) > timeToMinutes(startTime)
  }, [startTime, endTime])

  const dateRangeValid = useMemo(() => {
    if (!rangeStart || !rangeEnd) return false
    return stripTime(rangeEnd).getTime() > stripTime(rangeStart).getTime()
  }, [rangeStart, rangeEnd])

  const weeklyValid = recurrenceType !== 'WEEKLY' || daysOfWeek.length > 0

  const capacityNum = useMemo(() => {
    const n = Number.parseInt(capacity, 10)
    return Number.isFinite(n) && n >= 1 ? n : null
  }, [capacity])

  const canSubmit = useMemo(() => {
    return (
      Boolean(service) &&
      previewDates.length > 0 &&
      timeValid &&
      dateRangeValid &&
      weeklyValid &&
      capacityNum !== null
    )
  }, [service, previewDates.length, timeValid, dateRangeValid, weeklyValid, capacityNum])

  const selectedStaff = useMemo(() => {
    if (staffId === 'UNASSIGNED') return null
    return staff.find((s) => s.id === staffId) ?? null
  }, [staffId])

  const effectiveLocationId = useMemo(() => {
    return service?.locationId ?? locationId
  }, [service?.locationId, locationId])

  const toggleDay = useCallback((day: number) => {
    setDaysOfWeek((prev) => {
      if (prev.includes(day)) {
        const next = prev.filter((d) => d !== day)
        return next.length > 0 ? next : prev
      }
      return [...prev, day].sort((a, b) => a - b)
    })
  }, [])

  function handleSubmit() {
    if (!service || !canSubmit || capacityNum === null) return
    setSubmitting(true)
    try {
      const slots: SchedulingSlot[] = previewDates.map((day) => {
        const startAt = combineDateTime(day, startTime).toISOString()
        const endAt = combineDateTime(day, endTime).toISOString()
        return {
          id: createSlotId(),
          serviceId: service.id,
          service,
          locationId: effectiveLocationId,
          staffId: selectedStaff?.id ?? null,
          staffName: selectedStaff
            ? `${selectedStaff.firstName} ${selectedStaff.lastName}`.trim()
            : null,
          startAt,
          endAt,
          capacityOverride: capacityNum,
          priceOverride: null,
          bookedCount: 0,
          checkInCount: 0,
          effectiveCapacity: capacityNum,
          effectivePrice: service.basePrice,
          status: 'SCHEDULED',
          isActive: publishImmediately,
          isRecurring: true,
          notes: null,
        }
      })
      addSlots(slots)
      toast({
        title: `${slots.length} sessions created`,
        description: `Added recurring ${LABELS.serviceSlots.toLowerCase()} for ${service.name}.`,
      })
      router.push(returnTo)
    } finally {
      setSubmitting(false)
    }
  }

  const previewShown = previewDates.slice(0, 20)
  const moreCount = Math.max(0, previewDates.length - previewShown.length)

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label>{LABELS.service}</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${LABELS.service.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Recurrence</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  ['DAILY', 'Every day'],
                  ['WEEKLY', 'Weekly'],
                  ['MONTHLY', 'Monthly'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRecurrenceType(value)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors',
                    recurrenceType === value
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:bg-secondary',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {recurrenceType === 'WEEKLY' ? (
            <div className="space-y-2">
              <Label>Days of week</Label>
              <div className="flex flex-wrap gap-1">
                {DAY_LABELS.map((label, day) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={cn(
                      'min-w-[2.5rem] rounded-md border px-2 py-1.5 text-xs font-semibold',
                      daysOfWeek.includes(day)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-muted text-muted-foreground',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start date</Label>
              <Calendar
                mode="single"
                selected={rangeStart}
                onSelect={setRangeStart}
                className="rounded-md border border-border p-2"
              />
            </div>
            <div className="space-y-2">
              <Label>End date</Label>
              <Calendar
                mode="single"
                selected={rangeEnd}
                onSelect={setRangeEnd}
                className="rounded-md border border-border p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="rec-start-time">Start time (override)</Label>
              <Input
                id="rec-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rec-end-time">End time (override)</Label>
              <Input
                id="rec-end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          {!timeValid ? (
            <p className="text-xs font-medium text-destructive">End time must be after start time.</p>
          ) : null}
          {!dateRangeValid && rangeStart && rangeEnd ? (
            <p className="text-xs font-medium text-destructive">End date must be after start date.</p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="rec-cap">Capacity per session (override)</Label>
            <Input
              id="rec-cap"
              inputMode="numeric"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Staff (override, optional)</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              {service?.locationId ? 'Location' : 'Location (override, optional)'}
            </Label>
            <Select
              value={locationId}
              onValueChange={setLocationId}
              disabled={Boolean(service?.locationId)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {service?.locationId ? (
              <p className="text-xs text-muted-foreground">
                Fixed for this {LABELS.service.toLowerCase()} (not an override).
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
            <div>
              <p className="text-sm font-semibold text-foreground">Publish immediately</p>
              <p className="text-xs text-muted-foreground">Off saves as draft (admin-only).</p>
            </div>
            <Switch checked={publishImmediately} onCheckedChange={setPublishImmediately} />
          </div>

          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-sm font-semibold text-foreground">Sessions to be created</p>
            <p className="mt-1 text-3xl font-black text-foreground" style={{ fontFamily: 'var(--font-barlow)' }}>
              Total: {previewDates.length}
            </p>
            <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
              {previewShown.map((d) => (
                <li key={d.toISOString()}>
                  {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
                  {startTime} – {endTime}
                </li>
              ))}
            </ul>
            {moreCount > 0 ? (
              <p className="mt-2 text-xs font-medium text-muted-foreground">+{moreCount} more</p>
            ) : null}
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          {showCancel ? (
            <Link href={returnTo}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          ) : null}
          <Button
            type="button"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
          >
            {submitting
              ? `Creating ${previewDates.length} sessions…`
              : `Create ${previewDates.length} sessions`}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
