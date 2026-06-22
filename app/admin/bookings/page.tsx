'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, CheckCircle, Clock, User } from 'lucide-react'
import { isAdminApiReady } from '@/lib/api/client'
import { listBookings, mapApiBooking, type ApiBookingRow } from '@/lib/api/bookings.api'

type BookingRow = {
  id: string
  customer: string
  facility: string
  date: string
  time: string
  status: string
  amount: number
}

function formatTimeRange(startAt: string, endAt: string): string {
  const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' }
  return `${new Date(startAt).toLocaleTimeString([], options)} - ${new Date(endAt).toLocaleTimeString([], options)}`
}

function toBookingRow(row: ApiBookingRow): BookingRow {
  const booking = mapApiBooking(row)
  return {
    id: booking.id,
    customer: booking.contactName || row.contactId || 'Guest',
    facility: booking.service?.name ?? row.service?.name ?? row.serviceId,
    date: booking.startAt,
    time: formatTimeRange(booking.startAt, booking.endAt),
    status: booking.status.toLowerCase(),
    amount: booking.totalAmount,
  }
}

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadBookings() {
      if (!isAdminApiReady()) {
        setLoading(false)
        setError('Sign in as an admin to view bookings.')
        return
      }

      try {
        setLoading(true)
        setError(null)
        const rows = await listBookings({ limit: 100 })
        if (!cancelled) {
          setBookings(rows.map(toBookingRow))
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load bookings from the API.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadBookings()

    return () => {
      cancelled = true
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'checked_in':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const confirmedBookings = useMemo(
    () => bookings.filter((b) => b.status === 'confirmed' || b.status === 'checked_in').length,
    [bookings],
  )
  const pendingBookings = useMemo(
    () => bookings.filter((b) => b.status === 'pending').length,
    [bookings],
  )
  const totalRevenue = useMemo(
    () =>
      bookings
        .filter((b) => b.status !== 'cancelled')
        .reduce((sum, b) => sum + b.amount, 0),
    [bookings],
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Bookings Management</h1>
        <p className="text-muted-foreground mt-2">View and manage facility bookings</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{bookings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{confirmedBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">Active bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{pendingBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <Calendar className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${totalRevenue}</div>
            <p className="text-xs text-muted-foreground mt-1">From bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>Facility reservations and customer bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Booking ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Facility</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="py-3 px-4 text-foreground font-mono font-semibold text-sm">{booking.id}</td>
                    <td className="py-3 px-4 text-foreground">{booking.customer}</td>
                    <td className="py-3 px-4 text-foreground">{booking.facility}</td>
                    <td className="py-3 px-4 text-muted-foreground text-sm">
                      {new Date(booking.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-sm">{booking.time}</td>
                    <td className="py-3 px-4 font-semibold text-accent">${booking.amount.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status.replaceAll('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm" className="text-xs">
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading bookings…</div>
            ) : null}
            {!loading && error ? (
              <div className="py-8 text-center text-sm text-destructive">{error}</div>
            ) : null}
            {!loading && !error && bookings.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No bookings found for this tenant yet.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
