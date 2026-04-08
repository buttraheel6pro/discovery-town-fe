/** Calendar grid — CSS Grid scheduling calendar (month/week/day/agenda). */

'use client'

import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { cn, formatSlotDate, formatSlotTimeRange } from '@/lib/utils'
import type { CalendarView, SchedulingSlot } from '@/lib/types'

interface CalendarGridProps {
  slots: SchedulingSlot[]
  view: CalendarView
  date: Date
  onSlotClick: (slot: SchedulingSlot) => void
  onEmptyClick: (date: Date, time?: string) => void
  onViewChange: (v: CalendarView) => void
  onDateChange: (d: Date) => void
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function toYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function serviceTypeDotClass(serviceType: string): string {
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

export function CalendarGrid({
  slots,
  view,
  date,
  onSlotClick,
  onEmptyClick,
  onViewChange,
  onDateChange,
}: Readonly<CalendarGridProps>) {
  const day = startOfDay(date)

  const agenda = useMemo(() => {
    return slots
      .slice()
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  }, [slots])

  if (view === 'agenda') {
    return (
      <div className="space-y-2">
        {agenda.map((s) => (
          <button
            key={s.id}
            type="button"
            className="w-full text-left p-3 rounded-lg border border-border hover:bg-secondary transition-colors"
            onClick={() => onSlotClick(s)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">
                  {s.service.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatSlotDate(s.startAt)} · {formatSlotTimeRange(s.startAt, s.endAt)}
                </p>
              </div>
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-full shrink-0',
                  serviceTypeDotClass(s.service.serviceType),
                )}
                aria-hidden
              />
            </div>
          </button>
        ))}
        {agenda.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-10">
            No sessions for this range.
          </div>
        ) : null}
      </div>
    )
  }

  if (view === 'day') {
    const hours = Array.from({ length: 15 }, (_, i) => 8 + i) // 08–22
    const ymd = toYmd(day)
    const daySlots = slots.filter((s) => s.startAt.startsWith(ymd))

    return (
      <div className="grid grid-cols-[80px_1fr] gap-2">
        <div className="space-y-2">
          {hours.map((h) => (
            <div key={h} className="h-14 text-xs text-muted-foreground flex items-start pt-1">
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          {hours.map((h) => {
            const timeLabel = `${String(h).padStart(2, '0')}:00`
            const rowDate = new Date(day)
            rowDate.setHours(h, 0, 0, 0)

            const inHour = daySlots.filter((s) => {
              const d = new Date(s.startAt)
              return isSameDay(d, day) && d.getHours() === h
            })

            return (
              <div
                key={h}
                className="h-14 border-b border-border last:border-b-0 relative"
                onClick={() => onEmptyClick(rowDate, timeLabel)}
                role="button"
                tabIndex={0}
              >
                {inHour.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={cn(
                      'absolute left-2 right-2 top-1 bottom-1 rounded-md px-2 py-1 text-xs text-white',
                      serviceTypeDotClass(s.service.serviceType),
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSlotClick(s)
                    }}
                  >
                    <span className="font-semibold">{s.service.name}</span>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (view === 'week') {
    const start = addDays(day, -day.getDay()) // Sunday
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
    const hours = Array.from({ length: 15 }, (_, i) => 8 + i)

    return (
      <div className="grid grid-cols-[80px_repeat(7,1fr)] border border-border rounded-lg overflow-hidden">
        <div className="bg-secondary/40 border-b border-border" />
        {days.map((d) => (
          <div key={toYmd(d)} className="bg-secondary/40 border-b border-border p-2 text-xs font-semibold">
            {d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}
          </div>
        ))}

        {hours.map((h) => (
          <div key={h} className="contents">
            <div className="border-b border-border p-2 text-xs text-muted-foreground">
              {String(h).padStart(2, '0')}:00
            </div>
            {days.map((d) => {
              const cellDate = new Date(d)
              cellDate.setHours(h, 0, 0, 0)
              const cellSlots = slots.filter((s) => {
                const startAt = new Date(s.startAt)
                return isSameDay(startAt, d) && startAt.getHours() === h
              })

              return (
                <div
                  key={`${toYmd(d)}-${h}`}
                  className="border-b border-border border-l border-border relative min-h-12 p-1"
                  onClick={() => onEmptyClick(cellDate, `${String(h).padStart(2, '0')}:00`)}
                  role="button"
                  tabIndex={0}
                >
                  {cellSlots.slice(0, 2).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={cn(
                        'w-full rounded-md px-2 py-1 text-[10px] text-white mb-1 text-left',
                        serviceTypeDotClass(s.service.serviceType),
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSlotClick(s)
                      }}
                    >
                      {s.service.name}
                    </button>
                  ))}
                  {cellSlots.length > 2 ? (
                    <div className="text-[10px] text-muted-foreground px-1">
                      +{cellSlots.length - 2} more
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  // month
  const first = new Date(day.getFullYear(), day.getMonth(), 1)
  const last = new Date(day.getFullYear(), day.getMonth() + 1, 0)
  const start = addDays(first, -first.getDay())
  const end = addDays(last, 6 - last.getDay())

  const cells: Date[] = []
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    cells.push(new Date(d))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onDateChange(addDays(day, -30))}>
            Prev
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDateChange(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDateChange(addDays(day, 30))}>
            Next
          </Button>
        </div>
        <div className="text-sm font-semibold text-foreground">
          {day.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </div>
        <div className="flex gap-2">
          {(['month', 'week', 'day', 'agenda'] as const).map((v) => (
            <Button
              key={v}
              variant={view === v ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => onViewChange(v)}
            >
              {v}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => (
          <div key={w} className="text-xs font-semibold text-muted-foreground px-2 py-1">
            {w}
          </div>
        ))}

        {cells.map((d) => {
          const inMonth = d.getMonth() === day.getMonth()
          const ymd = toYmd(d)
          const daySlots = slots.filter((s) => s.startAt.startsWith(ymd))

          return (
            <div
              key={ymd}
              className={cn(
                'min-h-24 rounded-lg border border-border bg-card p-2',
                !inMonth && 'opacity-50',
              )}
              onClick={() => onEmptyClick(d)}
              role="button"
              tabIndex={0}
            >
              <div className="text-xs font-semibold text-muted-foreground">
                {d.getDate()}
              </div>
              <div className="mt-2 space-y-1">
                {daySlots.slice(0, 2).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={cn(
                      'w-full rounded-md px-2 py-1 text-[10px] text-white text-left',
                      serviceTypeDotClass(s.service.serviceType),
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSlotClick(s)
                    }}
                  >
                    {s.service.name}
                  </button>
                ))}
                {daySlots.length > 2 ? (
                  <div className="text-[10px] text-muted-foreground px-1">
                    +{daySlots.length - 2} more
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

