"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  Calendar,
  ShoppingBag,
  Settings,
  LogOut,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { CustomerNavbar } from "@/components/customer/navbar";
import { CustomerFooter } from "@/components/customer/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { bookings, orders, eventRegistrations, users } from "@/lib/mock-data";
import { EventRegistration } from "@/lib/types";

const currentUser = users.find((u) => u.role === "CUSTOMER")!;

const bookingStatusBadge: Record<string, { label: string; className: string }> =
  {
    CONFIRMED: { label: "CONFIRMED", className: "bg-green-100 text-green-700" },
    PENDING: { label: "PENDING", className: "bg-yellow-100 text-yellow-700" },
    COMPLETED: { label: "COMPLETED", className: "bg-blue-100 text-blue-700" },
    CANCELLED: { label: "CANCELLED", className: "bg-red-100 text-red-700" },
    CHECKED_IN: {
      label: "CHECKED IN",
      className: "bg-green-100 text-green-700",
    },
    NO_SHOW: { label: "NO SHOW", className: "bg-red-100 text-red-700" },
  };

const orderStatusBadge: Record<string, { label: string; className: string }> = {
  PROCESSING: {
    label: "Processing",
    className: "bg-yellow-100 text-yellow-700",
  },
  SHIPPED: { label: "Shipped", className: "bg-blue-100 text-blue-700" },
  DELIVERED: { label: "Delivered", className: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const myBookings = bookings.slice(0, 4);
  const myOrders = orders.slice(0, 3);
  const myEvents: EventRegistration[] = eventRegistrations.slice(0, 2);

  return (
    <>
      <CustomerNavbar />
      <main>
        {/* Profile header */}
        <section className="bg-primary py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6">
            <Avatar className="h-20 w-20 border-4 border-accent">
              <AvatarImage
                src={currentUser.avatarUrl}
                alt={currentUser.firstName}
              />
              <AvatarFallback className="text-xl font-bold bg-accent text-accent-foreground">
                {currentUser.firstName[0]}
                {currentUser.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1
                className="text-2xl font-black text-white"
                style={{ fontFamily: "var(--font-barlow)" }}
              >
                {currentUser.firstName} {currentUser.lastName}
              </h1>
              <p className="text-white/70 text-sm mt-1">{currentUser.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-white/60">
                  Member since{" "}
                  {new Date(currentUser.joinedAt).toLocaleDateString("en-GB", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <Badge className="bg-accent text-accent-foreground text-xs">
                  Active Member
                </Badge>
              </div>
            </div>
            <div className="ml-auto hidden sm:flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-black text-accent">
                  {currentUser.bookings}
                </p>
                <p className="text-xs text-white/60 uppercase tracking-wider">
                  Bookings
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-accent">
                  £{currentUser.totalSpent.toLocaleString()}
                </p>
                <p className="text-xs text-white/60 uppercase tracking-wider">
                  Total Spent
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8 flex flex-wrap h-auto gap-1">
              <TabsTrigger value="overview" className="gap-2">
                <TrendingUp className="w-3.5 h-3.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="bookings" className="gap-2">
                <Calendar className="w-3.5 h-3.5" />
                Bookings
              </TabsTrigger>
              <TabsTrigger value="events" className="gap-2">
                <Star className="w-3.5 h-3.5" />
                Events
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-2">
                <ShoppingBag className="w-3.5 h-3.5" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-2">
                <Settings className="w-3.5 h-3.5" />
                Profile
              </TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    icon: Calendar,
                    label: "Upcoming Bookings",
                    value: 3,
                    color: "text-blue-600",
                  },
                  {
                    icon: CheckCircle2,
                    label: "Completed Sessions",
                    value: 9,
                    color: "text-green-600",
                  },
                  {
                    icon: Star,
                    label: "Events Registered",
                    value: 2,
                    color: "text-yellow-600",
                  },
                  {
                    icon: ShoppingBag,
                    label: "Orders",
                    value: 3,
                    color: "text-accent",
                  },
                ].map(({ icon: Icon, label, value, color }) => (
                  <Card key={label}>
                    <CardContent className="flex items-center gap-4 pt-5">
                      <div
                        className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center ${color}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-foreground">
                          {value}
                        </p>
                        <p className="text-xs text-muted-foreground">{label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center justify-between">
                      Recent Bookings
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab("bookings")}
                        className="text-xs text-accent"
                      >
                        View all
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {myBookings.slice(0, 3).map((booking) => {
                      const status = bookingStatusBadge[booking.status];
                      return (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between py-2 border-b border-border last:border-0"
                        >
                          <div>
                            <p className="text-sm font-semibold">
                              {booking.facilityName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {booking.date} · {booking.startTime}–
                              {booking.endTime}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.className}`}
                            >
                              {status.label}
                            </span>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              £{booking.totalPrice}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center justify-between">
                      Recent Orders
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab("orders")}
                        className="text-xs text-accent"
                      >
                        View all
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {myOrders.map((order) => {
                      const status = orderStatusBadge[order.status];
                      return (
                        <div
                          key={order.id}
                          className="flex items-center justify-between py-2 border-b border-border last:border-0"
                        >
                          <div>
                            <p className="text-sm font-semibold">
                              {order.orderNumber}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.items.length} item
                              {order.items.length > 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.className}`}
                            >
                              {status.label}
                            </span>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              £{order.total.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Bookings tab */}
            <TabsContent value="bookings">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">My Bookings</h2>
                  <Link href="/facilities">
                    <Button
                      size="sm"
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      Book a Facility
                    </Button>
                  </Link>
                </div>
                {myBookings.map((booking) => {
                  const status = bookingStatusBadge[booking.status];
                  return (
                    <Card key={booking.id}>
                      <CardContent className="flex items-center gap-4 pt-5 pb-4">
                        <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm">
                            {booking.facilityName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(
                              booking.date + "T00:00:00",
                            ).toLocaleDateString("en-GB", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}{" "}
                            · {booking.startTime}–{booking.endTime} (
                            {booking.durationHours}h)
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.className}`}
                          >
                            {status.label}
                          </span>
                          <p className="font-bold text-sm mt-1">
                            £{booking.totalPrice}
                          </p>
                        </div>
                        {booking.status === "CONFIRMED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive hover:bg-destructive/5 shrink-0"
                          >
                            Cancel
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Events tab */}
            <TabsContent value="events">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">My Events</h2>
                  <Link href="/events">
                    <Button
                      size="sm"
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      Browse Events
                    </Button>
                  </Link>
                </div>
                {myEvents.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground">
                      No events registered yet.
                    </p>
                  </div>
                ) : (
                  myEvents.map((reg) => (
                    <Card key={reg.id}>
                      <CardContent className="flex items-center gap-4 pt-5 pb-4">
                        <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                          <Star className="w-5 h-5 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm">{reg.eventTitle}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {reg.ticketCount} ticket
                            {reg.ticketCount > 1 ? "s" : ""} · Registered{" "}
                            {new Date(reg.registeredAt).toLocaleDateString(
                              "en-GB",
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs">
                            Registered
                          </Badge>
                          <p className="font-bold text-sm mt-1">
                            £{reg.totalPaid}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Orders tab */}
            <TabsContent value="orders">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Order History</h2>
                  <Link href="/shop">
                    <Button
                      size="sm"
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      Visit Shop
                    </Button>
                  </Link>
                </div>
                {myOrders.map((order) => {
                  const status = orderStatusBadge[order.status];
                  return (
                    <Card key={order.id}>
                      <CardContent className="pt-5 pb-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm">
                              {order.orderNumber}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(order.createdAt).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.className}`}
                            >
                              {status.label}
                            </span>
                            <p className="font-black text-sm mt-1">
                              £{order.total.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-1">
                          {order.items.map((item) => (
                            <div
                              key={item.productId}
                              className="flex justify-between text-xs text-muted-foreground"
                            >
                              <span>
                                {item.productName} × {item.quantity}
                              </span>
                              <span>£{item.total.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Profile settings tab */}
            <TabsContent value="profile">
              <div className="max-w-lg space-y-6">
                <h2 className="text-lg font-bold">Profile Settings</h2>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          First Name
                        </label>
                        <p className="text-sm font-semibold mt-1">
                          {currentUser.firstName}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Last Name
                        </label>
                        <p className="text-sm font-semibold mt-1">
                          {currentUser.lastName}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Email
                      </label>
                      <p className="text-sm font-semibold mt-1">
                        {currentUser.email}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Phone
                      </label>
                      <p className="text-sm font-semibold mt-1">
                        {currentUser.phone ?? "Not set"}
                      </p>
                    </div>
                    <Separator />
                    <div className="flex gap-3">
                      <Button className="bg-accent text-accent-foreground hover:bg-accent/90 flex-1">
                        Edit Profile
                      </Button>
                      <Button
                        variant="outline"
                        className="text-destructive border-destructive hover:bg-destructive/5 gap-2"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <CustomerFooter />
    </>
  );
}
