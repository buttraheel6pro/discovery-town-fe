/** Hour cell detail — sessions overlapping the selected heatmap cell (dialog). */
'use client'

import Link from 'next/link'
import { format, setHours } from 'date-fns'

import { CapacityRing } from '@/components/admin/capacity-ring'
import { SlotStatusBadge } from '@/components/admin/slot-status-badge'
import { ServiceTypeBadge } from '@/components/customer/service-type-badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatSlotTimeRange } from '@/lib/utils'
import type { AvailabilityCell } from '@/lib/types'

export interface TimeSlotDetailPopoverProps {
  readonly cell: AvailabilityCell | null
  readonly open: boolean
  readonly onClose: () => void
}

export function TimeSlotDetailPopover({
  cell,
  open,
  onClose,
}: Readonly<TimeSlotDetailPopoverProps>) {
  if (!cell) return null

  const dayDate = new Date(`${cell.date}T12:00:00`)
  const hourStart = setHours(new Date(dayDate), cell.hour)
  const hourEnd = setHours(new Date(dayDate), cell.hour + 1)
  const title = `${format(dayDate, 'EEEE d MMM')}, ${format(hourStart, 'h:mm a')} – ${format(hourEnd, 'h:mm a')}`

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          {cell.slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions this hour.</p>
          ) : (
            <ul className="space-y-3">
              {cell.slots.map((sl) => (
                <li
                  key={sl.id}
                  className="rounded-lg border border-border p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {sl.service.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatSlotTimeRange(sl.startAt, sl.endAt)}
                      </p>
                    </div>
                    <ServiceTypeBadge serviceType={sl.service.serviceType} />
                  </div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {sl.staffName ?? '—'}
                    </span>
                    <div className="flex items-center gap-2">
                      <CapacityRing
                        booked={sl.bookedCount}
                        capacity={sl.effectiveCapacity}
                        size="sm"
                      />
                      <SlotStatusBadge status={sl.status} />
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/admin/scheduling/${sl.id}`}>View session</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
