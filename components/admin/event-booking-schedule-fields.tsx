/** Admin fields for event customer date/time selection mode. */
'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { EventBookingScheduleDraft } from '@/lib/event-booking-schedule'
import {
  EVENT_BOOKING_SCHEDULE_MODE_OPTIONS,
  EventBookingScheduleModeEnum,
  type EventBookingScheduleMode,
} from '@/lib/types'

export type { EventBookingScheduleDraft } from '@/lib/event-booking-schedule'

interface EventBookingScheduleFieldsProps {
  readonly draft: EventBookingScheduleDraft
  readonly onChange: (patch: Partial<EventBookingScheduleDraft>) => void
}

export function EventBookingScheduleFields({
  draft,
  onChange,
}: Readonly<EventBookingScheduleFieldsProps>) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
      <div className="space-y-1">
        <Label htmlFor="event-booking-schedule-mode">Customer date &amp; time selection</Label>
        <p className="text-xs text-muted-foreground">
          Controls how customers pick dates and times when booking. Nothing is shown on the
          customer page until a mode is selected here.
        </p>
      </div>

      <Select
        value={draft.eventBookingScheduleMode}
        onValueChange={(value) =>
          onChange({ eventBookingScheduleMode: value as EventBookingScheduleMode })
        }
      >
        <SelectTrigger id="event-booking-schedule-mode" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {EVENT_BOOKING_SCHEDULE_MODE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {draft.eventBookingScheduleMode === EventBookingScheduleModeEnum.PER_EVENT ? (
        <p className="text-xs text-muted-foreground">
          Customers see the availability calendar with all scheduled sessions listed as
          view-only — they cannot change date or time.
        </p>
      ) : null}

      {draft.eventBookingScheduleMode === EventBookingScheduleModeEnum.PER_HOUR ? (
        <p className="text-xs text-muted-foreground">
          Customers pick a day, then choose an available time slot on that same day.
        </p>
      ) : null}

      {draft.eventBookingScheduleMode === EventBookingScheduleModeEnum.PER_DAY ? (
        <p className="text-xs text-muted-foreground">
          Customers book by day on the availability calendar. Only days with scheduled sessions
          are selectable; when sessions run on multiple days, they choose a from–to range there.
        </p>
      ) : null}
    </div>
  )
}
