'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, CheckCircle, Clock, ShoppingCart } from 'lucide-react'

export default function OrdersManagement() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [orders] = useState([
    {
      id: 'ORD-001',
      customer: 'John Smith',
      email: 'john@example.com',
      date: '2025-03-28',
      status: 'completed',
      total: 245.99,
      items: [
        { name: 'Yoga Mat', quantity: 2, price: 29.99 },
        { name: 'Water Bottle', quantity: 1, price: 19.99 },
        { name: 'Resistance Bands', quantity: 1, price: 34.99 },
      ],
      shippingAddress: '123 Main St, Springfield, IL 62701',
      paymentMethod: 'Credit Card',
    },
    {
      id: 'ORD-002',
      customer: 'Sarah Johnson',
      email: 'sarah@example.com',
      date: '2025-03-27',
      status: 'pending',
      total: 159.98,
      items: [
        { name: 'Dumbbell Set', quantity: 1, price: 79.99 },
        { name: 'Exercise Ball', quantity: 1, price: 39.99 },
      ],
      shippingAddress: '456 Oak Ave, Chicago, IL 60601',
      paymentMethod: 'PayPal',
    },
    {
      id: 'ORD-003',
      customer: 'Michael Brown',
      email: 'michael@example.com',
      date: '2025-03-26',
      status: 'shipped',
      total: 89.97,
      items: [
        { name: 'Sports Headband', quantity: 3, price: 14.99 },
      ],
      shippingAddress: '789 Pine Rd, Milwaukee, WI 53201',
      paymentMethod: 'Debit Card',
    },
    {
      id: 'ORD-004',
      customer: 'Emily Davis',
      email: 'emily@example.com',
      date: '2025-03-25',
      status: 'completed',
      total: 310.00,
      items: [
        { name: 'Premium Yoga Bag', quantity: 1, price: 79.99 },
        { name: 'Foam Roller', quantity: 2, price: 34.99 },
        { name: 'Stretching Strap', quantity: 2, price: 15.01 },
      ],
      shippingAddress: '321 Elm St, Madison, WI 53703',
      paymentMethod: 'Credit Card',
    },
    {
      id: 'ORD-005',
      customer: 'James Wilson',
      email: 'james@example.com',
      date: '2025-03-24',
      status: 'pending',
      total: 124.95,
      items: [
        { name: 'Jump Rope', quantity: 2, price: 24.99 },
        { name: 'Agility Cones', quantity: 1, price: 29.97 },
      ],
      shippingAddress: '654 Maple Dr, Green Bay, WI 54301',
      paymentMethod: 'Apple Pay',
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'shipped':
        return 'bg-blue-100 text-blue-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'shipped':
        return <ShoppingCart className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Orders Management</h1>
        <p className="text-muted-foreground mt-2">View and manage customer orders</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{orders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{orders.filter(o => o.status === 'completed').length}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{orders.filter(o => o.status === 'pending').length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting shipment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <ShoppingCart className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">From orders</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>All customer orders and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Order ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Total</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4 text-foreground font-mono font-semibold text-sm">{order.id}</td>
                      <td className="py-3 px-4 text-foreground">{order.customer}</td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">
                        {new Date(order.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-accent">${order.total.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          className="gap-1 text-xs"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        {selectedOrder ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Details</CardTitle>
              <CardDescription>{selectedOrder.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-foreground mb-2">Customer Information</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-foreground">{selectedOrder.customer}</p>
                  <p className="text-muted-foreground">{selectedOrder.email}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold text-foreground mb-2">Items</h3>
                <div className="space-y-2 text-sm">
                  {selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-muted-foreground">
                      <span>{item.name} x {item.quantity}</span>
                      <span className="text-foreground font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border mt-3 pt-3 flex justify-between font-semibold text-foreground">
                  <span>Total</span>
                  <span className="text-accent">${selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Shipping */}
              <div>
                <h3 className="font-semibold text-foreground mb-2">Shipping Address</h3>
                <p className="text-sm text-muted-foreground">{selectedOrder.shippingAddress}</p>
              </div>

              {/* Payment */}
              <div>
                <h3 className="font-semibold text-foreground mb-2">Payment Method</h3>
                <p className="text-sm text-muted-foreground">{selectedOrder.paymentMethod}</p>
              </div>

              {/* Status */}
              <div className="border-t border-border pt-4">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusIcon(selectedOrder.status)}
                  {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                </span>
              </div>

              <Button className="w-full">Update Status</Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-96">
              <p className="text-muted-foreground text-center">Select an order to view details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
