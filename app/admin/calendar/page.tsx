/** Unified admin calendar — shared filters; sessions grid vs utilisation heatmap with crossfade. */
'use client'

import { Suspense, useMemo, useState, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { LayoutGrid, RefreshCw, ThermometerSun } from 'lucide-react'

import { AvailabilityHeatmap } from '@/components/admin/availability-heatmap'
import { CalendarGrid } from '@/components/admin/calendar-grid'
import { ServiceTypeBadge } from '@/components/customer/service-type-badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useCalendar } from '@/lib/calendar-store'
import { generateAvailabilityGrid } from '@/lib/mock-data'
import { useLocations } from '@/lib/location-store'
import { useScheduling } from '@/lib/scheduling-store'
import { cn } from '@/lib/utils'
import type { CalendarView, SchedulingServiceType, SchedulingSlot } from '@/lib/types'
import { SchedulingServiceTypeEnum } from '@/lib/types'

const allServiceTypes = Object.values(SchedulingServiceTypeEnum) as SchedulingServiceType[]

const calendarScopeOptions: { value: CalendarView; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
  { value: 'agenda', label: 'Agenda' },
]

type AdminCalendarMainView = 'sessions' | 'heatmap'

function FilterFieldLabel({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  )
}

function serviceTypeLabel(serviceType: string): string {
  switch (serviceType) {
    case 'GYM_CLASS':
      return 'Gym'
    case 'COURT_BOOKING':
      return 'Court'
    case 'SWIM_CLASS':
      return 'Swim'
    case 'OPEN_PLAY':
      return 'Open play'
    case 'COACHING_SESSION':
      return 'Coaching'
    case 'CAMP':
      return 'Camp'
    case 'PARTY_PACKAGE':
      return 'Party'
    case 'PRIVATE_HIRE':
      return 'Private hire'
    case 'WORKSHOP':
      return 'Workshop'
    case 'FITNESS_ASSESSMENT':
      return 'Assessment'
    default:
      return 'Service'
  }
}

function dotClass(serviceType: string): string {
  switch (serviceType) {
    case 'GYM_CLASS':
      return 'bg-blue-500'
    case 'COURT_BOOKING':
      return 'bg-green-500'
    case 'SWIM_CLASS':
      return 'bg-cyan-500'
    case 'OPEN_PLAY':
      return 'bg-orange-500'
    case 'COACHING_SESSION':
      return 'bg-purple-500'
    case 'CAMP':
      return 'bg-amber-500'
    case 'PARTY_PACKAGE':
      return 'bg-pink-500'
    case 'PRIVATE_HIRE':
      return 'bg-red-500'
    case 'WORKSHOP':
      return 'bg-slate-500'
    case 'FITNESS_ASSESSMENT':
      return 'bg-indigo-500'
    default:
      return 'bg-muted-foreground'
  }
}

function heatmapRangeForCalendarView(anchor: Date, calendarView: CalendarView): { from: Date; to: Date } {
  switch (calendarView) {
    case 'month':
      return { from: startOfMonth(anchor), to: endOfMonth(anchor) }
    case 'week':
      return {
        from: startOfWeek(anchor, { weekStartsOn: 1 }),
        to: endOfWeek(anchor, { weekStartsOn: 1 }),
      }
    case 'day':
      return { from: startOfDay(anchor), to: endOfDay(anchor) }
    case 'agenda':
    default:
      return {
        from: startOfWeek(anchor, { weekStartsOn: 1 }),
        to: endOfWeek(anchor, { weekStartsOn: 1 }),
      }
  }
}

function AdminCalendarPageInner() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { slots } = useScheduling()
  const { calendarFilters, setCalendarFilters } = useCalendar()
  const { locations } = useLocations()
  const [calendarView, setCalendarView] = useState<CalendarView>('month')
  const [date, setDate] = useState<Date>(new Date())
  const [, setRefreshKey] = useState(0)

  const mainView: AdminCalendarMainView =
    searchParams.get('view') === 'heatmap' ? 'heatmap' : 'sessions'

  function setMainView(next: AdminCalendarMainView) {
    const params = new URLSearchParams(searchParams.toString())
    if (next === 'heatmap') {
      params.set('view', 'heatmap')
    } else {
      params.delete('view')
    }
    const q = params.toString()
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false })
  }

  const staffOptions = useMemo(() => {
    const names = new Set<string>()
    for (const s of slots) {
      if (s.staffName) names.add(s.staffName)
    }
    return Array.from(names.values()).sort()
  }, [slots])

  const filteredSlots = useMemo(() => {
    let list = slots
    if (calendarFilters.locationId) {
      list = list.filter((s) => s.locationId === calendarFilters.locationId)
    }
    if (calendarFilters.serviceTypes.length > 0) {
      list = list.filter((s) =>
        calendarFilters.serviceTypes.includes(s.service.serviceType),
      )
    }
    if (calendarFilters.staffId) {
      if (calendarFilters.staffId === '__none__') {
        list = list.filter((s) => !s.staffName)
      } else {
        list = list.filter((s) => s.staffName === calendarFilters.staffId)
      }
    }
    return list
  }, [slots, calendarFilters])

  const heatmapRange = useMemo(
    () => heatmapRangeForCalendarView(date, calendarView),
    [date, calendarView],
  )

  const heatmapCells = useMemo(() => {
    return generateAvailabilityGrid(
      calendarFilters.locationId,
      heatmapRange.from,
      heatmapRange.to,
      {
        serviceTypes: calendarFilters.serviceTypes,
        staffId: calendarFilters.staffId,
      },
    )
  }, [calendarFilters.locationId, calendarFilters.serviceTypes, calendarFilters.staffId, heatmapRange])

  const legend = useMemo(() => {
    const types = new Set<string>()
    filteredSlots.forEach((s) => types.add(s.service.serviceType))
    return Array.from(types.values())
  }, [filteredSlots])

  function handleSlotClick(slot: SchedulingSlot) {
    router.push(`/admin/scheduling/${slot.id}`)
  }

  function handleEmptyClick(): void {
    router.push(`/admin/scheduling/new/recurring?returnTo=${encodeURIComponent('/admin/calendar')}`)
  }

  function toggleServiceType(t: SchedulingServiceType) {
    const next = new Set(calendarFilters.serviceTypes)
    if (next.has(t)) next.delete(t)
    else next.add(t)
    setCalendarFilters({ serviceTypes: Array.from(next.values()) })
  }

  const serviceTypeFilterActive = calendarFilters.serviceTypes.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
        <p className="mt-2 text-muted-foreground">
          One filter set drives both the session grid and the utilisation heatmap.
        </p>
      </div>

      <Card className="overflow-hidden py-0 shadow-sm">
        <CardHeader className="border-b border-border bg-muted/20 px-6 py-5">
          <CardTitle className="text-lg font-semibold tracking-tight">Filters &amp; navigation</CardTitle>
          <CardDescription>
            Refine by site and service, then choose how the calendar is laid out and which day you
            are viewing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-0 px-0 py-0">
          <div className="grid gap-0 lg:grid-cols-12">
            <div className="space-y-5 border-border p-6 lg:col-span-3 lg:border-r">
              <div className="space-y-2">
                <FilterFieldLabel>Location</FilterFieldLabel>
                <Select
                  value={calendarFilters.locationId ?? 'all'}
                  onValueChange={(v) =>
                    setCalendarFilters({ locationId: v === 'all' ? null : v })
                  }
                >
                  <SelectTrigger className="h-10 w-full bg-background" id="cal-filter-location">
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                  {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <FilterFieldLabel>Staff</FilterFieldLabel>
                <Select
                  value={calendarFilters.staffId ?? 'all'}
                  onValueChange={(v) =>
                    setCalendarFilters({
                      staffId: v === 'all' ? null : v === '__none__' ? '__none__' : v,
                    })
                  }
                >
                  <SelectTrigger className="h-10 w-full bg-background" id="cal-filter-staff">
                    <SelectValue placeholder="All staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All staff</SelectItem>
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {staffOptions.map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-border p-6 lg:col-span-6 lg:border-r">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <FilterFieldLabel>Service types</FilterFieldLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  disabled={!serviceTypeFilterActive}
                  onClick={() => setCalendarFilters({ serviceTypes: [] })}
                >
                  Clear selection
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {allServiceTypes.map((t) => {
                  const selected = calendarFilters.serviceTypes.includes(t)
                  return (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={selected}
                      aria-label={`${serviceTypeLabel(t)}${selected ? ', selected' : ''}`}
                      onClick={() => toggleServiceType(t)}
                      className={cn(
                        'rounded-full border-2 bg-background p-0.5 transition-all duration-200',
                        'hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        selected
                          ? 'border-accent shadow-sm ring-2 ring-accent/25'
                          : 'border-transparent opacity-75 hover:opacity-100',
                      )}
                    >
                      <ServiceTypeBadge
                        serviceType={t}
                        className={cn(
                          'pointer-events-none border-0',
                          !selected && 'grayscale-[0.35]',
                        )}
                      />
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                No selection includes every type. The same rule applies to sessions and utilisation.
              </p>
            </div>

            <div className="space-y-5 bg-muted/10 p-6 lg:col-span-3">
              <div className="space-y-2">
                <FilterFieldLabel>Calendar layout</FilterFieldLabel>
                <div
                  className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-background p-1 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4"
                  role="group"
                  aria-label="Calendar layout"
                >
                  {calendarScopeOptions.map(({ value: v, label }) => (
                    <Button
                      key={v}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'h-9 text-xs font-semibold shadow-none transition-colors',
                        calendarView === v
                          ? 'bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                      onClick={() => setCalendarView(v)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
              <Separator className="bg-border/80" />
              <div className="space-y-2">
                <FilterFieldLabel>Active date</FilterFieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-9 shrink-0 text-xs font-medium"
                    onClick={() => setDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs"
                    onClick={() => setDate((d) => new Date(d.getTime() - 86400000))}
                  >
                    Previous day
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs"
                    onClick={() => setDate((d) => new Date(d.getTime() + 86400000))}
                  >
                    Next day
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    aria-label="Refresh calendar data"
                    onClick={() => setRefreshKey((k) => k + 1)}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border bg-muted/10 px-6 py-3">
            <p className="text-center text-xs text-muted-foreground lg:text-left">
              Utilisation heatmap uses the same date range as your layout (for example, month view
              covers the full month).
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-foreground">View</p>
            <ToggleGroup
              type="single"
              value={mainView}
              onValueChange={(v) => {
                if (v === 'sessions' || v === 'heatmap') setMainView(v)
              }}
              variant="outline"
              className="w-full sm:w-auto transition-shadow duration-300 shadow-sm"
            >
              <ToggleGroupItem
                value="sessions"
                aria-label="Session calendar"
                className="gap-2 px-4 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground transition-colors duration-300"
              >
                <LayoutGrid className="h-4 w-4 shrink-0" />
                Sessions
              </ToggleGroupItem>
              <ToggleGroupItem
                value="heatmap"
                aria-label="Utilisation heatmap"
                className="gap-2 px-4 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground transition-colors duration-300"
              >
                <ThermometerSun className="h-4 w-4 shrink-0" />
                Utilisation
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="relative min-h-[min(28rem,70vh)] overflow-hidden rounded-lg border border-border bg-card/30">
            <div
              className={cn(
                'transition-[opacity,transform,filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                mainView === 'sessions'
                  ? 'relative z-10 opacity-100 scale-100 blur-0'
                  : 'pointer-events-none absolute inset-0 z-0 opacity-0 scale-[0.985] blur-[2px]',
              )}
              aria-hidden={mainView !== 'sessions'}
            >
              <div className="p-4 sm:p-6">
                <CalendarGrid
                  slots={filteredSlots}
                  view={calendarView}
                  date={date}
                  onSlotClick={handleSlotClick}
                  onEmptyClick={handleEmptyClick}
                  onViewChange={setCalendarView}
                  onDateChange={setDate}
                />

                {legend.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border mt-4">
                    {legend.map((t) => (
                      <div key={t} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className={cn('h-2.5 w-2.5 rounded-full', dotClass(t))} aria-hidden />
                        {serviceTypeLabel(t)}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div
              className={cn(
                'transition-[opacity,transform,filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                mainView === 'heatmap'
                  ? 'relative z-10 opacity-100 scale-100 blur-0'
                  : 'pointer-events-none absolute inset-0 z-0 opacity-0 scale-[0.985] blur-[2px]',
              )}
              aria-hidden={mainView !== 'heatmap'}
            >
              <div className="p-4 sm:p-6 overflow-x-auto">
                <p className="text-xs text-muted-foreground mb-4">
                  Hour × day occupancy for the selected scope and filters (aggregated from the same
                  slot pool as the grid).
                </p>
                {heatmapCells.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">
                    No cells in range (empty data or range over 60 days).
                  </p>
                ) : (
                  <AvailabilityHeatmap
                    cells={heatmapCells}
                    from={heatmapRange.from}
                    to={heatmapRange.to}
                  />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminCalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
            <p className="text-muted-foreground mt-2">Loading…</p>
          </div>
        </div>
      }
    >
      <AdminCalendarPageInner />
    </Suspense>
  )
}
