'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, CheckCircle, Clock, User } from 'lucide-react'
import { mockData } from '@/lib/mock-data'

export default function BookingsManagement() {
  const bookings = [
    {
      id: 'BK-001',
      customer: 'John Smith',
      facility: 'Basketball Court',
      date: '2025-04-05',
      time: '10:00 AM - 12:00 PM',
      status: 'confirmed',
      amount: 60,
    },
    {
      id: 'BK-002',
      customer: 'Sarah Johnson',
      facility: 'Swimming Pool',
      date: '2025-04-06',
      time: '2:00 PM - 3:30 PM',
      status: 'confirmed',
      amount: 45,
    },
    {
      id: 'BK-003',
      customer: 'Michael Brown',
      facility: 'Tennis Court',
      date: '2025-04-07',
      time: '9:00 AM - 11:00 AM',
      status: 'pending',
      amount: 80,
    },
    {
      id: 'BK-004',
      customer: 'Emily Davis',
      facility: 'Gym - Weight Room',
      date: '2025-04-05',
      time: '6:00 PM - 7:30 PM',
      status: 'confirmed',
      amount: 35,
    },
    {
      id: 'BK-005',
      customer: 'James Wilson',
      facility: 'Basketball Court',
      date: '2025-04-08',
      time: '7:00 PM - 9:00 PM',
      status: 'cancelled',
      amount: 60,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length
  const pendingBookings = bookings.filter(b => b.status === 'pending').length
  const totalRevenue = bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + b.amount, 0)

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
                    <td className="py-3 px-4 font-semibold text-accent">${booking.amount}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
