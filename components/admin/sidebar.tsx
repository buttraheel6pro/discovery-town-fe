"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  BarChart2,
  Building2,
  Calendar,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  Monitor,
  Package,
  Share2,
  ShoppingCart,
  Tag,
  Timer,
  TrendingUp,
  UserCircle,
  Users,
  Users2,
} from "lucide-react";
import { SidebarGroup, SidebarItem } from "./sidebar-group";

const topLevelItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: BarChart3,
  },
  {
    label: "Bookings",
    href: "/admin/bookings",
    icon: ClipboardList,
  },
  {
    label: "Staff",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Memberships",
    href: "/admin/memberships",
    icon: Users,
  },
  {
    label: "Coupons",
    href: "/admin/inventory/coupons",
    icon: Tag,
  },
];

const sidebarGroups = [
  {
    label: "Operations",
    icon: Calendar,
    items: [
      {
        label: "Schedule Events",
        href: "/admin/scheduling",
        icon: Timer,
      },
      {
        label: "Calendar",
        href: "/admin/calendar",
        icon: CalendarDays,
      },
      {
        label: "Locations",
        href: "/admin/scheduling/locations",
        icon: Building2,
      },
      {
        label: "Event Type",
        href: "/admin/scheduling/services",
        icon: Timer,
      },
      {
        label: "Private Hire",
        href: "/admin/calendar/private-hire",
        icon: Building2,
      },
      {
        label: "Packages",
        href: "/admin/scheduling/packages",
        icon: Package,
      },
      {
        label: "Waivers",
        href: "/admin/waivers",
        icon: FileText,
      },
      {
        label: "Class Packs",
        href: "/admin/class-packs",
        icon: CreditCard,
      },
    ],
  },
  {
    label: "Inventory",
    icon: Package,
    items: [
      {
        label: "Overview",
        href: "/admin/inventory",
        icon: Package,
      },
      {
        label: "Products",
        href: "/admin/inventory/products",
        icon: Package,
      },
      {
        label: "Orders",
        href: "/admin/orders",
        icon: ShoppingCart,
      },
      {
        label: "POS",
        href: "/admin/inventory/pos",
        icon: Monitor,
      },
    ],
  },
  {
    label: "Analytics",
    icon: BarChart2,
    items: [
      {
        label: "Dashboard",
        href: "/admin/reports",
        icon: LayoutDashboard,
      },
      {
        label: "Revenue",
        href: "/admin/reports/revenue",
        icon: TrendingUp,
      },
      {
        label: "Client Activity",
        href: "/admin/reports/clients",
        icon: Users,
      },
      {
        label: "Referrals",
        href: "/admin/reports/referrals",
        icon: Share2,
      },
      {
        label: "Staff Performance",
        href: "/admin/reports/staff",
        icon: Users2,
      },
      {
        label: "Invoices",
        href: "/admin/reports/invoices",
        icon: FileText,
      },
    ],
  },
  {
    label: "Customers",
    icon: Users,
    items: [
      {
        label: "Directory",
        href: "/admin/clients",
        icon: UserCircle,
      },
      {
        label: "Labels & Tags",
        href: "/admin/clients/tags",
        icon: Tag,
      },
    ],
  },
];

const SECTION_ROOTS = [
  "/admin/inventory",
  "/admin/scheduling",
  "/admin/calendar",
  "/admin/clients",
  "/admin/reports",
  "/admin"
];

function isItemActive(href: string, pathname: string) {
  if (pathname === href) return true;
  if (SECTION_ROOTS.includes(href)) return pathname === href;
  return pathname.startsWith(href + "/");
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar pt-6 flex flex-col">
      <div className="px-6 mb-8 flex-shrink-0">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-sidebar-foreground">
            Discovery Town
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1.5 px-3 overflow-y-auto scrollbar-none pb-12">
        <div className="space-y-0.5">
          {topLevelItems.map((item) => (
            <SidebarItem
              key={item.href}
              item={item}
              isActive={isItemActive(item.href, pathname)}
            />
          ))}
        </div>

        <div className="space-y-1.5 pt-0.5">
          {sidebarGroups.map((group) => (
            <SidebarGroup
              key={group.label}
              label={group.label}
              icon={group.icon}
              items={group.items}
              pathname={pathname}
            />
          ))}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-4 flex-shrink-0">
        <div className="text-xs text-sidebar-foreground/40 text-center font-medium">
          © 2025 Discovery Town
        </div>
      </div>
    </aside>
  );
}
