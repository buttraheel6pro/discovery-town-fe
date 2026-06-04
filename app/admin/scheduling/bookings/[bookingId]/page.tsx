/** Admin booking detail with balance collection status banner. */
'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { addDays, format } from 'date-fns'

import { Badge } from '@/components/ui/badge'
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
import { schedulingTransactions } from '@/lib/mock-data'
import { useScheduling } from '@/lib/scheduling-store'

type BannerState = 'PENDING' | 'COMPLETED' | 'FAILED'

export default function AdminSchedulingBookingDetailPage() {
  const params = useParams<{ bookingId: string }>()
  const { bookings, packages } = useScheduling()
  const [collectOpen, setCollectOpen] = useState(false)
  const [stateByTransactionId, setStateByTransactionId] = useState<Record<string, BannerState>>({})

  const booking = useMemo(
    () => bookings.find((row) => row.id === params.bookingId) ?? null,
    [bookings, params.bookingId],
  )
  const eventPackage = useMemo(
    () => packages.find((row) => row.id === booking?.eventPackageId) ?? null,
    [booking?.eventPackageId, packages],
  )
  const balanceTransaction = useMemo(
    () => schedulingTransactions.find((row) => row.bookingId === booking?.id && row.type === 'BALANCE_PAYMENT') ?? null,
    [booking?.id],
  )
  const bannerState: BannerState | null = useMemo(() => {
    if (!balanceTransaction) return null
    return stateByTransactionId[balanceTransaction.id] ?? (balanceTransaction.status as BannerState)
  }, [balanceTransaction, stateByTransactionId])

  if (!booking) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Booking not found</h1>
        <p className="text-sm text-muted-foreground">
          The requested booking does not exist in the current scheduling store.
        </p>
      </div>
    )
  }

  const autoCollectionDate = booking.startAt
    ? format(addDays(new Date(booking.startAt), -14), 'd MMM yyyy')
    : '—'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Booking detail</h1>
        <p className="mt-2 text-muted-foreground">Review package, guests, and balance collection status.</p>
      </div>

      {balanceTransaction && bannerState === 'PENDING' ? (
        <Card className="border-yellow-500/40 bg-yellow-500/10">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Outstanding balance pending</p>
              <p className="text-sm text-muted-foreground">
                Amount due ${balanceTransaction.netAmount.toFixed(2)}. Auto-collection on {autoCollectionDate}.
              </p>
            </div>
            <Button className="bg-yellow-600 text-white hover:bg-yellow-700" onClick={() => setCollectOpen(true)}>
              Collect now
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {balanceTransaction && bannerState === 'COMPLETED' ? (
        <Card className="border-emerald-500/40 bg-emerald-500/10">
          <CardContent className="flex items-center justify-between gap-3 pt-6">
            <p className="text-sm font-medium text-foreground">
              Balance paid successfully for ${balanceTransaction.netAmount.toFixed(2)}.
            </p>
            <Badge className="bg-emerald-600 text-white">PAID</Badge>
          </CardContent>
        </Card>
      ) : null}

      {balanceTransaction && bannerState === 'FAILED' ? (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <p className="text-sm font-medium text-foreground">
              Balance collection failed. Retry charge or send a payment link.
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() =>
                  setStateByTransactionId((prev) => ({ ...prev, [balanceTransaction.id]: 'COMPLETED' }))
                }
              >
                Retry
              </Button>
              <Button variant="outline">Send payment link</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="font-semibold">Contact:</span> {booking.contactName}</p>
          <p><span className="font-semibold">Package:</span> {eventPackage?.name ?? '—'}</p>
          <p><span className="font-semibold">Date:</span> {booking.startAt ? format(new Date(booking.startAt), 'd MMM yyyy, HH:mm') : '—'}</p>
          <p><span className="font-semibold">Guests:</span> {booking.guestCount}</p>
          <p><span className="font-semibold">Total:</span> ${booking.totalAmount.toFixed(2)}</p>
          <p><span className="font-semibold">Balance due:</span> ${booking.balanceDue.toFixed(2)}</p>
          <div>
            <p className="mb-1 font-semibold">Add-ons:</p>
            {booking.addOns.length > 0 ? (
              <ul className="space-y-1">
                {booking.addOns.map((addOn) => (
                  <li key={addOn.id} className="text-muted-foreground">
                    {addOn.name} x{addOn.quantity} (${addOn.totalPrice.toFixed(2)})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No add-ons selected.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={collectOpen} onOpenChange={setCollectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Collect outstanding balance now?</DialogTitle>
            <DialogDescription>
              This marks the pending balance transaction as completed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCollectOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!balanceTransaction) return
                setStateByTransactionId((prev) => ({ ...prev, [balanceTransaction.id]: 'COMPLETED' }))
                setCollectOpen(false)
              }}
            >
              Confirm collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
