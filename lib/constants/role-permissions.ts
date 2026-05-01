/** Role permissions catalog — menu-linked permission groups for role assignment. */

export interface RolePermissionItem {
  key: string
  label: string
}

export interface RolePermissionGroup {
  key: string
  label: string
  permissions: RolePermissionItem[]
}

export const ROLE_PERMISSION_GROUPS: RolePermissionGroup[] = [
  {
    key: 'top-level',
    label: 'Top level',
    permissions: [
      { key: 'dashboard', label: 'Dashboard' },
      { key: 'bookings', label: 'Bookings' },
      { key: 'staff', label: 'Staff' },
      { key: 'memberships', label: 'Memberships' },
      { key: 'coupons', label: 'Coupons' },
    ],
  },
  {
    key: 'operations',
    label: 'Operations',
    permissions: [
      { key: 'schedule-events', label: 'Schedule Events' },
      { key: 'calendar', label: 'Calendar' },
      { key: 'locations', label: 'Locations' },
      { key: 'customer-locations', label: 'Customer Locations' },
      { key: 'event-type', label: 'Event Type' },
      { key: 'private-hire', label: 'Private Hire' },
      { key: 'packages', label: 'Packages' },
      { key: 'waivers', label: 'Waivers' },
      { key: 'class-packs', label: 'Class Packs' },
      { key: 'roles', label: 'Roles' },
    ],
  },
  {
    key: 'inventory',
    label: 'Inventory',
    permissions: [
      { key: 'inventory-overview', label: 'Overview' },
      { key: 'inventory-products', label: 'Products' },
      { key: 'inventory-orders', label: 'Orders' },
      { key: 'inventory-pos', label: 'POS' },
    ],
  },
  {
    key: 'analytics',
    label: 'Analytics',
    permissions: [
      { key: 'analytics-dashboard', label: 'Dashboard' },
      { key: 'analytics-revenue', label: 'Revenue' },
      { key: 'analytics-client-activity', label: 'Client Activity' },
      { key: 'analytics-referrals', label: 'Referrals' },
      { key: 'analytics-staff-performance', label: 'Staff Performance' },
      { key: 'analytics-invoices', label: 'Invoices' },
    ],
  },
  {
    key: 'customers',
    label: 'Customers',
    permissions: [
      { key: 'customers-directory', label: 'Directory' },
      { key: 'customers-labels-tags', label: 'Labels & Tags' },
    ],
  },
]

const PERMISSION_LABEL_MAP = new Map<string, string>(
  ROLE_PERMISSION_GROUPS.flatMap((group) =>
    group.permissions.map((permission) => [permission.key, permission.label]),
  ),
)

export function getPermissionLabel(permissionKey: string): string {
  return PERMISSION_LABEL_MAP.get(permissionKey) ?? permissionKey
}
