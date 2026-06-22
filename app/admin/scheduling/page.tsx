/** Admin scheduling — sessions list and management. */

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

import { BookingModeBadge } from '@/components/admin/booking-mode-badge'
import { CapacityRing } from '@/components/admin/capacity-ring'
import { PublishStatusBadge } from '@/components/admin/publish-status-badge'
import { SlotStatusBadge } from '@/components/admin/slot-status-badge'
import { ServiceTypeBadge } from '@/components/customer/service-type-badge'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LABELS } from '@/lib/constants/ui-labels'
import { useScheduling } from '@/lib/scheduling-store'
import { isAdminApiReady } from '@/lib/api/client'
import { cancelSlot as cancelSlotApi } from '@/lib/services/slots'
import { cn, formatSlotDate, formatSlotTimeRange, formatPrice } from '@/lib/utils'
import type { SchedulingSlotStatus, SchedulingServiceType } from '@/lib/types'

const statusOptions: Array<SchedulingSlotStatus | 'ALL'> = [
  'ALL',
  'SCHEDULED',
  'FULL',
  'COMPLETED',
  'CANCELLED',
]

export default function AdminSchedulingPage() {
  const { slots, cancelSlot } = useScheduling()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<SchedulingSlotStatus | 'ALL'>('ALL')
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const filtered = useMemo(() => {
    let result = slots.slice()

    if (q.trim()) {
      const query = q.trim().toLowerCase()
      result = result.filter(
        (s) =>
          s.service.name.toLowerCase().includes(query) ||
          (s.staffName ?? '').toLowerCase().includes(query),
      )
    }

    if (status !== 'ALL') {
      result = result.filter((s) => s.status === status)
    }

    result.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    return result
  }, [q, slots, status])

  const selectedIds = useMemo(() => {
    return Object.entries(selected)
      .filter(([, v]) => v)
      .map(([id]) => id)
  }, [selected])

  function toggleAll(checked: boolean) {
    if (!checked) {
      setSelected({})
      return
    }

    setSelected(
      Object.fromEntries(filtered.map((s) => [s.id, true])),
    )
  }

  function handleConfirmCancelSelected() {
    const reason = cancelReason.trim() || 'Cancelled by admin'
    selectedIds.forEach((id) => {
      cancelSlot(id, reason)
      if (isAdminApiReady()) {
        cancelSlotApi(id, reason).catch(() => {})
      }
    })
    setSelected({})
    setCancelReason('')
    setCancelOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{LABELS.services}</h1>
          <p className="text-muted-foreground mt-2">
            Manage scheduled {LABELS.serviceSlots.toLowerCase()} and open {LABELS.services.toLowerCase()}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href={`/admin/scheduling/new/recurring?returnTo=${encodeURIComponent('/admin/scheduling')}`}>
              Recurring series
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${LABELS.service.toLowerCase()} or instructor...`}
            className="max-w-sm"
          />
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === 'ALL' ? 'All statuses' : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedIds.length > 0 ? (
            <Button
              variant="outline"
              className="text-destructive border-destructive"
              onClick={() => setCancelOpen(true)}
            >
              Cancel Selected ({selectedIds.length})
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">{LABELS.serviceSlots}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-border">
                  <th className="p-3 text-left w-10">
                    <Checkbox
                      checked={filtered.length > 0 && selectedIds.length === filtered.length}
                      onCheckedChange={(v) => toggleAll(Boolean(v))}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="p-3 text-left">{LABELS.service}</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Time</th>
                  <th className="p-3 text-left">Instructor</th>
                  <th className="p-3 text-left">Enrolled</th>
                  <th className="p-3 text-left">Publish</th>
                  <th className="p-3 text-left">Check-ins</th>
                  <th className="p-3 text-left">Slot status</th>
                  <th className="p-3 text-left">Price</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {filtered.map((s) => {
                  const isOpen = s.service.bookingMode === 'OPEN'
                  const checked = Boolean(selected[s.id])

                  return (
                    <tr key={s.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-3">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) =>
                            setSelected((prev) => ({ ...prev, [s.id]: Boolean(v) }))
                          }
                          aria-label={`Select ${s.id}`}
                        />
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground">
                              {s.service.name}
                            </span>
                            <ServiceTypeBadge serviceType={s.service.serviceType} />
                            <BookingModeBadge mode={s.service.bookingMode} />
                          </div>
                          {isOpen ? (
                            <span className="text-xs text-muted-foreground">
                              Open {LABELS.service}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {formatSlotDate(s.startAt)}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {formatSlotTimeRange(s.startAt, s.endAt)}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {s.staffName ?? '—'}
                      </td>
                      <td className="p-3">
                        <CapacityRing
                          booked={s.bookedCount}
                          capacity={s.effectiveCapacity}
                          size="sm"
                        />
                      </td>
                      <td className="p-3">
                        <PublishStatusBadge isActive={s.isActive !== false} />
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {(s.checkInCount ?? 0)}/{s.bookedCount}
                      </td>
                      <td className="p-3">
                        <SlotStatusBadge status={s.status} />
                      </td>
                      <td className="p-3 font-semibold">
                        {formatPrice(s.effectivePrice)}
                      </td>
                      <td className="p-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/scheduling/${s.id}`}>
                                View Roster
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                            <DropdownMenuItem disabled>Cancel</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}

                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-muted-foreground">
                      No {LABELS.serviceSlots.toLowerCase()} yet. Create your first {LABELS.serviceSlot.toLowerCase()}.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel selected {LABELS.serviceSlots.toLowerCase()}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will mark {selectedIds.length} {LABELS.serviceSlot.toLowerCase()}
            {selectedIds.length === 1 ? '' : 's'} as cancelled.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Reason (optional)</label>
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Maintenance, staff unavailable..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Keep
            </Button>
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleConfirmCancelSelected}
              disabled={selectedIds.length === 0}
            >
              Cancel {LABELS.serviceSlots.toLowerCase()}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

