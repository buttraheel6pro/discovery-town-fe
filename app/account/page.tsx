"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  ShoppingBag,
  Settings,
  LogOut,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  FileText,
  CreditCard,
  Building2,
  Wallet,
  Tag,
} from "lucide-react";
import { CustomerNavbar } from "@/components/customer/navbar";
import { CustomerFooter } from "@/components/customer/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { bookings, orders } from "@/lib/mock-data";
import type { SchedulingServiceType } from "@/lib/types";
import { BookingHistoryCard } from "@/components/customer/booking-history-card";
import { CrudModal } from "@/components/admin/crud-modal";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useScheduling } from "@/lib/scheduling-store";
import { CreditBalanceDisplay } from "@/components/customer/credit-balance-display";
import { useClients } from "@/lib/client-store";
import { useInventory } from "@/lib/inventory-store";
import { formatPrice, isDocumentSignedAndValid } from "@/lib/utils";
import { getCurrentUserProfile } from "@/lib/services/auth";
import type { CurrentUserProfile } from "@/lib/types";

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

function getProfileErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Failed to load profile.";
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [authProfile, setAuthProfile] = useState<CurrentUserProfile | null>(
    null,
  );
  const [authProfileError, setAuthProfileError] = useState<string | null>(null);
  const myBookings = bookings.slice(0, 4);
  const myOrders = orders.slice(0, 3);
  const { bookings: schedulingBookings, cancelBooking } = useScheduling();
  const { contacts: cmContacts, documents: clientDocs } = useClients();

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUserProfile(): Promise<void> {
      try {
        const profile = await getCurrentUserProfile();
        if (!isMounted) {
          return;
        }
        setAuthProfile(profile);
        setAuthProfileError(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setAuthProfile(null);
        setAuthProfileError(getProfileErrorMessage(error));
      }
    }

    void loadCurrentUserProfile();

    return () => {
      isMounted = false;
    };
  }, []);
  const { orders: shopOrders } = useInventory();

  const primaryContact =
    cmContacts.find((c) => c.contactType === "CUSTOMER") ?? cmContacts[0];

  const primaryCreditBalance =
    primaryContact?.creditLedger?.[0]?.balanceAfter ?? 0;

  const primarySubscription = primaryContact?.subscriptions?.find(
    (s) => s.status === "ACTIVE" || s.status === "TRIALING",
  );

  const displayEmail = authProfile?.email ?? "—";
  const displayName = authProfile?.name?.trim() ?? "";
  const displayInitial = displayName.charAt(0).toUpperCase();
  const displayAvatar = primaryContact?.avatarUrl ?? undefined;
  const memberSinceText = authProfile?.createdAt
    ? new Date(authProfile.createdAt).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      })
    : "—";
  const profileNameParts = (authProfile?.name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const firstNameFromProfile = profileNameParts[0] ?? "Not set";
  const lastNameFromProfile =
    profileNameParts.length > 1
      ? profileNameParts.slice(1).join(" ")
      : "Not set";

  const pendingDocumentsCount = primaryContact
    ? clientDocs.filter(
        (doc) =>
          doc.isRequired &&
          !isDocumentSignedAndValid(primaryContact.documents, doc.id),
      ).length
    : 0;

  const familyMembersCount = cmContacts.filter(
    (c) => c.contactType === "CHILD",
  ).length;

  const mySchedulingBookings = schedulingBookings.filter(
    (b) => b.contactId === "contact-1",
  );

  const spendContactId = primaryContact?.id ?? "contact-1";

  const mySpendTotal = useMemo(() => {
    const bookingSpend = mySchedulingBookings
      .filter((b) => b.status !== "CANCELLED")
      .reduce((sum, b) => sum + b.totalAmount, 0);
    const shopSpend = shopOrders
      .filter((o) => o.contactId === spendContactId)
      .reduce((sum, o) => sum + o.total, 0);
    return bookingSpend + shopSpend;
  }, [mySchedulingBookings, shopOrders, spendContactId]);

  const eventBookingTypes: SchedulingServiceType[] = [
    "PARTY_PACKAGE",
    "WORKSHOP",
    "CAMP",
  ];
  const myEventBookings = mySchedulingBookings.filter((b) =>
    eventBookingTypes.includes(b.bookingType),
  );

  const upcoming = mySchedulingBookings.filter(
    (b) => b.status !== "CANCELLED" && b.status !== "COMPLETED",
  );
  const past = mySchedulingBookings.filter((b) => b.status === "COMPLETED");
  const cancelled = mySchedulingBookings.filter(
    (b) => b.status === "CANCELLED",
  );

  function openCancelDialog(id: string) {
    setCancelBookingId(id);
    setCancelReason("");
    setCancelOpen(true);
  }

  return (
    <>
      <CustomerNavbar />
      <main>
        {/* Profile header */}
        <section className="bg-primary py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6">
            <Avatar className="h-20 w-20 border-4 border-accent">
              <AvatarImage src={displayAvatar} alt={displayName} />
              {displayInitial ? (
                <AvatarFallback className="text-xl font-bold bg-accent text-accent-foreground">
                  {displayInitial}
                </AvatarFallback>
              ) : null}
            </Avatar>
            <div>
              <h1
                className="text-2xl font-black text-white"
                style={{ fontFamily: "var(--font-barlow)" }}
              >
                {displayName}
              </h1>
              <p className="text-white/70 text-sm mt-1">{displayEmail}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-white/60">
                  Member since {memberSinceText}
                </span>
                {authProfile?.isActive ? (
                  <Badge className="bg-accent text-accent-foreground text-xs">
                    Active Member
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="ml-auto hidden sm:flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-black text-accent">
                  {mySchedulingBookings.length}
                </p>
                <p className="text-xs text-white/60 uppercase tracking-wider">
                  Bookings
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-accent">—</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="flex items-center gap-4 pt-5">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-primary">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs text-muted-foreground">My spend</p>
                      <p
                        className="text-2xl font-black text-foreground truncate"
                        style={{ fontFamily: "var(--font-barlow)" }}
                      >
                        {formatPrice(mySpendTotal)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Credits {formatPrice(primaryCreditBalance)} ·{" "}
                        {primarySubscription
                          ? "Membership active"
                          : "No membership"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center gap-4 pt-5">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-emerald-600">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Credit Balance
                      </p>
                      <CreditBalanceDisplay balance={primaryCreditBalance} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center gap-4 pt-5">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-blue-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-foreground">
                        {primarySubscription ? "Active" : "None"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Membership
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center gap-4 pt-5">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-amber-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-foreground">
                        {pendingDocumentsCount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Pending Documents
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center gap-4 pt-5">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-violet-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-foreground">
                        {familyMembersCount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Family Members
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {[
                  {
                    href: "/account/profile",
                    title: "Profile & Preferences",
                    description:
                      "Update your details and communication settings.",
                    icon: Settings,
                  },
                  {
                    href: "/account/family",
                    title: "Family",
                    description: "Manage children and linked family members.",
                    icon: Users,
                  },
                  {
                    href: "/account/documents",
                    title: "Documents & Waivers",
                    description: "Review and sign any required waivers.",
                    icon: FileText,
                  },
                  {
                    href: "/account/membership",
                    title: "Membership & Credits",
                    description: "Manage memberships and class packs.",
                    icon: CreditCard,
                  },
                  {
                    href: "/account/coupons",
                    title: "Coupons & offers",
                    description: "See plan-linked codes and where to use promos.",
                    icon: Tag,
                  },
                  {
                    href: "/account/private-hire",
                    title: "Private Hire",
                    description: "Track venue hire enquiries and status.",
                    icon: Building2,
                  },
                ].map(({ href, title, description, icon: Icon }) => (
                  <Link key={href} href={href}>
                    <Card className="h-full hover:shadow-md transition-shadow">
                      <CardContent className="flex items-start gap-4 pt-5">
                        <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-accent">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
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
                              ${booking.totalPrice}
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
                              ${order.total.toFixed(2)}
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
              <div className="space-y-8">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold">My Bookings</h2>
                  <Link href="/classes">
                    <Button
                      size="sm"
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      Browse Classes
                    </Button>
                  </Link>
                </div>

                <Tabs defaultValue="upcoming">
                  <TabsList className="flex flex-wrap h-auto gap-1">
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="past">Past</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                  </TabsList>

                  <TabsContent value="upcoming" className="space-y-3 mt-4">
                    {upcoming.length === 0 ? (
                      <div className="text-center py-16 border border-border rounded-xl bg-card">
                        <p className="text-muted-foreground">
                          No upcoming bookings
                        </p>
                        <Link href="/classes">
                          <Button className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
                            Browse Classes
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      upcoming.map((b) => (
                        <BookingHistoryCard
                          key={b.id}
                          booking={b}
                          onCancel={() => openCancelDialog(b.id)}
                        />
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="past" className="space-y-3 mt-4">
                    {past.length === 0 ? (
                      <div className="text-center py-16 border border-border rounded-xl bg-card">
                        <p className="text-muted-foreground">
                          No past bookings
                        </p>
                      </div>
                    ) : (
                      past.map((b) => (
                        <BookingHistoryCard key={b.id} booking={b} />
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="cancelled" className="space-y-3 mt-4">
                    {cancelled.length === 0 ? (
                      <div className="text-center py-16 border border-border rounded-xl bg-card">
                        <p className="text-muted-foreground">
                          No cancelled bookings
                        </p>
                      </div>
                    ) : (
                      cancelled.map((b) => (
                        <BookingHistoryCard key={b.id} booking={b} />
                      ))
                    )}
                  </TabsContent>
                </Tabs>

                <Separator />

                <div className="space-y-3">
                  <h3 className="text-base font-bold">Facility bookings</h3>
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
                              ${booking.totalPrice}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
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
                {myEventBookings.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground">
                      No events registered yet.
                    </p>
                  </div>
                ) : (
                  myEventBookings.map((b) => (
                    <BookingHistoryCard
                      key={b.id}
                      booking={b}
                      onCancel={() => openCancelDialog(b.id)}
                    />
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
                              ${order.total.toFixed(2)}
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
                              <span>${item.total.toFixed(2)}</span>
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
                <h2 className="text-lg font-bold">Profile</h2>
                <p className="text-sm text-muted-foreground">
                  Your account uses the same contact record as reception and
                  CRM. Full editing (address, preferences) lives on the profile
                  editor page.
                </p>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    {authProfileError ? (
                      <p className="text-xs text-muted-foreground">
                        {authProfileError}
                      </p>
                    ) : null}
                    {authProfile ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              First name
                            </label>
                            <p className="text-sm font-semibold mt-1">
                              {firstNameFromProfile}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Last name
                            </label>
                            <p className="text-sm font-semibold mt-1">
                              {lastNameFromProfile}
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Email
                          </label>
                          <p className="text-sm font-semibold mt-1">
                            {displayEmail}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Phone
                          </label>
                          <p className="text-sm font-semibold mt-1">Not set</p>
                        </div>
                        <Separator />
                        <div className="flex gap-3">
                          <Button
                            className="bg-accent text-accent-foreground hover:bg-accent/90 flex-1"
                            asChild
                          >
                            <Link href="/account/profile">Edit profile</Link>
                          </Button>
                          <Button
                            variant="outline"
                            className="text-destructive border-destructive hover:bg-destructive/5 gap-2"
                          >
                            <LogOut className="w-4 h-4" /> Sign out
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          No CRM contact is loaded in this demo. Open the editor
                          to review the form.
                        </p>
                        <Button
                          className="bg-accent text-accent-foreground hover:bg-accent/90 w-full"
                          asChild
                        >
                          <Link href="/account/profile">
                            Go to profile editor
                          </Link>
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <CustomerFooter />

      <CrudModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel booking"
        description="Tell us why you're cancelling. This helps us improve."
        size="sm"
        variant="delete"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelOpen(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!cancelBookingId) return;
                cancelBooking(
                  cancelBookingId,
                  cancelReason.trim() || "Cancelled by user",
                );
                setCancelOpen(false);
              }}
              disabled={!cancelBookingId}
            >
              Confirm cancel
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Reason (optional)</Label>
          <Textarea
            id="cancel-reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Cancellation reason"
          />
        </div>
      </CrudModal>
    </>
  );
}
