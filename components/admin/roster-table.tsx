/** Roster table — admin view of bookings for a slot/service. */

'use client'

import { useMemo } from 'react'

import { BookingStatusBadge } from '@/components/customer/booking-status-badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useScheduling } from '@/lib/scheduling-store'
import { formatSlotDate, formatSlotTime } from '@/lib/utils'
import type { SchedulingBooking } from '@/lib/types'

function toCsvValue(value: string): string {
  const escaped = value.replaceAll('"', '""')
  return `"${escaped}"`
}

function downloadCsv(filename: string, rows: string[][]) {
  const content = rows.map((r) => r.map(toCsvValue).join(',')).join('\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()

  URL.revokeObjectURL(url)
}

export function RosterTable({
  slotId,
}: Readonly<{
  slotId: string
}>) {
  const { bookings, checkIn } = useScheduling()

  const rows = useMemo(() => {
    return bookings.filter((b) => b.serviceSlotId === slotId)
  }, [bookings, slotId])

  function handleExport() {
    const header = ['Contact', 'Participant', 'Booked At', 'Status', 'Checked In']
    const data = rows.map((b) => [
      b.contactName,
      b.participantName ?? '—',
      b.createdAt,
      b.status,
      b.checkedInAt ? 'Yes' : 'No',
    ])
    downloadCsv(`roster-${slotId}.csv`, [header, ...data])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-foreground">
          Roster ({rows.length})
        </p>
        <Button variant="outline" size="sm" onClick={handleExport}>
          Export CSV
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contact</TableHead>
            <TableHead>Participant</TableHead>
            <TableHead>Booked</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Check-in</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="font-semibold">{b.contactName}</TableCell>
              <TableCell>{b.participantName ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatSlotDate(b.createdAt)} · {formatSlotTime(b.createdAt)}
              </TableCell>
              <TableCell>
                <BookingStatusBadge status={b.status} />
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => checkIn(b.id)}
                  disabled={Boolean(b.checkedInAt)}
                >
                  {b.checkedInAt ? 'Checked in' : 'Check in'}
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No bookings yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  )
}

