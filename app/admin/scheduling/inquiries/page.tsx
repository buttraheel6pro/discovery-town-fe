/** Whole-venue event inquiries queue with approval actions. */
'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

import { CrudModal } from '@/components/admin/crud-modal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { BookingStatusBadge } from '@/components/customer/booking-status-badge'
import { useScheduling } from '@/lib/scheduling-store'

function formatWhen(iso: string | null): string {
  if (!iso) return '—'
  return format(new Date(iso), 'd MMM yyyy, HH:mm')
}

export default function AdminEventInquiriesPage() {
  const router = useRouter()
  const { bookings, packages, approveBooking, declineBooking } = useScheduling()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [approveId, setApproveId] = useState<string | null>(null)
  const [declineId, setDeclineId] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [search, setSearch] = useState('')

  const packageMap = useMemo(() => new Map(packages.map((pkg) => [pkg.id, pkg])), [packages])

  const inquiries = useMemo(() => {
    const query = search.trim().toLowerCase()
    return bookings
      .filter((booking) => {
        const pkg = booking.eventPackageId ? packageMap.get(booking.eventPackageId) : null
        return pkg?.isWholeVenue === true
      })
      .filter((booking) => {
        if (!query) return true
        const pkg = booking.eventPackageId ? packageMap.get(booking.eventPackageId) : null
        return (
          booking.contactName.toLowerCase().includes(query) ||
          (pkg?.name ?? '').toLowerCase().includes(query) ||
          (booking.participantName ?? '').toLowerCase().includes(query)
        )
      })
  }, [bookings, packageMap, search])

  const selected = useMemo(
    () => inquiries.find((booking) => booking.id === selectedId) ?? null,
    [inquiries, selectedId],
  )
  const approveTarget = useMemo(
    () => inquiries.find((booking) => booking.id === approveId) ?? null,
    [approveId, inquiries],
  )
  const declineTarget = useMemo(
    () => inquiries.find((booking) => booking.id === declineId) ?? null,
    [declineId, inquiries],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Event inquiries</h1>
        <p className="mt-2 text-muted-foreground">
          Review whole-venue requests awaiting operations approval.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Whole-venue inquiries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by contact or package..."
            className="max-w-sm"
          />
          {inquiries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No whole-venue inquiries are pending right now.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Date requested</TableHead>
                  <TableHead>Event type</TableHead>
                  <TableHead>Children</TableHead>
                  <TableHead>Adults</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map((booking) => {
                  const pkg = booking.eventPackageId
                    ? packageMap.get(booking.eventPackageId) ?? null
                    : null
                  const children = pkg?.maxChildSeats ?? Math.floor(booking.guestCount * 0.6)
                  const adults = pkg?.maxAdultSeats ?? Math.ceil(booking.guestCount * 0.4)
                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.contactName}</TableCell>
                      <TableCell>{pkg?.name ?? '—'}</TableCell>
                      <TableCell>{formatWhen(booking.startAt)}</TableCell>
                      <TableCell>{booking.participantName ?? 'Private event'}</TableCell>
                      <TableCell>{children}</TableCell>
                      <TableCell>{adults}</TableCell>
                      <TableCell>
                        <div
                          title={
                            booking.actedByStaffName
                              ? `${booking.status === 'CANCELLED' ? 'Declined' : 'Approved'} by ${booking.actedByStaffName}`
                              : booking.status === 'PENDING_APPROVAL'
                                ? 'Awaiting decision'
                                : 'No staff attribution recorded'
                          }
                          className="w-fit"
                        >
                          <BookingStatusBadge status={booking.status} />
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatWhen(booking.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedId(booking.id)}>
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(`/admin/scheduling/bookings/${booking.id}`)
                            }
                          >
                            Booking
                          </Button>
                          {booking.status !== 'CONFIRMED' ? (
                            <Button
                              size="sm"
                              className="bg-accent text-accent-foreground hover:bg-accent/90"
                              onClick={() => setApproveId(booking.id)}
                            >
                              Approve
                            </Button>
                          ) : null}
                          {booking.status !== 'CANCELLED' ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeclineId(booking.id)}
                            >
                              Decline
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CrudModal
        open={selected != null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
        title={selected?.contactName ?? 'Inquiry details'}
        description="Inquiry details for operations review."
        variant="view"
        size="md"
        footer={
          selected ? (
            <>
              <Button variant="outline" onClick={() => setSelectedId(null)}>
                Close
              </Button>
              <Button
                onClick={() => router.push(`/admin/scheduling/bookings/${selected.id}`)}
              >
                Open booking detail
              </Button>
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-3 text-sm">
            <p><span className="font-semibold">Package:</span> {packageMap.get(selected.eventPackageId ?? '')?.name ?? '—'}</p>
            <p><span className="font-semibold">Requested date:</span> {formatWhen(selected.startAt)}</p>
            <p><span className="font-semibold">Guests:</span> {selected.guestCount}</p>
            <p><span className="font-semibold">Notes:</span> {selected.notes ?? '—'}</p>
            <p><span className="font-semibold">Created:</span> {formatWhen(selected.createdAt)}</p>
          </div>
        ) : null}
      </CrudModal>

      <Dialog open={approveTarget != null} onOpenChange={(open) => !open && setApproveId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve whole-venue inquiry?</DialogTitle>
            <DialogDescription>
              This will confirm the booking and reserve the venue. Deposit required:{' '}
              {approveTarget?.eventPackageId
                ? `$${(packageMap.get(approveTarget.eventPackageId)?.depositAmount ?? 0).toFixed(2)}`
                : '$0.00'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveId(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!approveTarget) return
                approveBooking(approveTarget.id)
                router.push(`/admin/scheduling/bookings/${approveTarget.id}`)
                setApproveId(null)
              }}
            >
              Confirm approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={declineTarget != null}
        onOpenChange={(open) => {
          if (open) return
          setDeclineId(null)
          setDeclineReason('')
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline inquiry</DialogTitle>
            <DialogDescription>
              Provide a reason so the team can follow up with the customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="decline-reason">Reason</Label>
            <Textarea
              id="decline-reason"
              value={declineReason}
              onChange={(event) => setDeclineReason(event.target.value)}
              rows={4}
              placeholder="Venue unavailable on requested date..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!declineReason.trim()}
              onClick={() => {
                if (!declineTarget || !declineReason.trim()) return
                declineBooking(declineTarget.id, declineReason.trim())
                router.push(`/admin/scheduling/bookings/${declineTarget.id}`)
                setDeclineId(null)
                setDeclineReason('')
              }}
            >
              Decline inquiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
