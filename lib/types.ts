// Discovery Town - Sports Complex ERP Platform Types
// Based on the official SRS document

// ============================================
// ENUMS
// ============================================

export type BookingMode = 'SCHEDULED' | 'OPEN'
export type ServiceType =
  | 'CLASS'
  | 'COURT'
  | 'PLAY_AREA'
  | 'SWIMMING'
  | 'PARTY'
  | 'WORKSHOP'
  | 'CAMP'
  | 'COACHING'

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

export type SlotStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'CANCELLED'
  | 'COMPLETED'

export type ContactType =
  | 'CUSTOMER'
  | 'CHILD'
  | 'CORPORATE'
  | 'LEAD'
  | 'VENDOR'
  | 'STAFF'

export type RelationshipType =
  | 'PARENT_CHILD'
  | 'GUARDIAN'
  | 'CORPORATE_MEMBER'
  | 'EMERGENCY_CONTACT'

export type StaffRole =
  | 'ORG_ADMIN'
  | 'MANAGER'
  | 'INSTRUCTOR'
  | 'COACH'
  | 'FRONT_DESK'
  | 'COORDINATOR'

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'CANCELLED'
  | 'PAST_DUE'
  | 'EXPIRED'

export type BillingCycle = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'

export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIAL'

export type LeadStage =
  | 'NEW'
  | 'CONTACTED'
  | 'TRIAL_OFFERED'
  | 'TRIAL_ATTENDED'
  | 'ENROLLED'
  | 'LOST'

export type CouponType = 'PERCENTAGE' | 'FIXED_AMOUNT'

export type PricingModel = 'FLAT' | 'PER_HOUR' | 'PER_PERSON'

export type TransactionType =
  | 'BOOKING'
  | 'MEMBERSHIP'
  | 'CLASS_PACK'
  | 'SHOP'
  | 'REFUND'

// ============================================
// CORE MODELS
// ============================================

export interface Tenant {
  id: string
  name: string
  slug: string
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'
  activeModules: string[]
  createdAt: string
  updatedAt: string
}

export interface TenantSetting {
  id: string
  tenantId: string
  bookingRules: BookingRules
  branding: BrandingSettings
  currency: string
  timezone: string
}

export interface BookingRules {
  minAdvanceHours: number
  maxAdvanceDays: number
  cancellationHours: number
  noShowPenalty: number
}

export interface BrandingSettings {
  logo?: string
  primaryColor: string
  secondaryColor: string
}

export interface Location {
  id: string
  tenantId: string
  name: string
  address: string
  city: string
  postcode: string
  timezone: string
  phone?: string
  email?: string
  settings: LocationSettings
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

export interface LocationSettings {
  operatingHours: OperatingHours[]
}

export interface OperatingHours {
  dayOfWeek: number
  openTime: string
  closeTime: string
  isClosed: boolean
}

// ============================================
// SERVICE & SCHEDULING
// ============================================

export interface ServiceCategory {
  id: string
  tenantId: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  displayOrder: number
  color?: string
  serviceCount?: number
}

export interface Service {
  id: string
  tenantId: string
  categoryId: string
  category?: ServiceCategory
  name: string
  slug: string
  description?: string
  shortDescription?: string
  bookingMode: BookingMode
  serviceType: ServiceType
  capacity: number
  basePrice: number
  memberPrice?: number
  duration: number
  minDurationMinutes?: number
  maxDurationMinutes?: number
  maxConcurrent?: number
  slotIncrementMinutes?: number
  minAdvanceHours?: number
  maxAdvanceHours?: number
  minAge?: number
  maxAge?: number
  locationId: string
  location?: Location
  imageUrl?: string
  galleryImages?: string[]
  instructorId?: string
  instructor?: Staff
  isActive: boolean
  isFeatured: boolean
  metadata?: ServiceMetadata
  createdAt: string
  updatedAt: string
}

export interface ServiceMetadata {
  pricingModel?: PricingModel
  requirements?: string[]
  whatToBring?: string[]
  cancellationPolicy?: string
}

export interface ServiceSlot {
  id: string
  tenantId: string
  serviceId: string
  service?: Service
  locationId: string
  location?: Location
  instructorId?: string
  instructor?: Staff
  startAt: string
  endAt: string
  bookedCount: number
  effectiveCapacity: number
  priceOverride?: number
  status: SlotStatus
  notes?: string
  recurringRuleId?: string
  createdAt: string
  updatedAt: string
}

export interface RecurringRule {
  id: string
  tenantId: string
  serviceId: string
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  daysOfWeek: number[]
  startTime: string
  endTime: string
  validFrom: string
  validUntil: string
  isActive: boolean
}

export interface Booking {
  id: string
  date: string
  startTime: string
  endTime: string
  durationHours: number
  facilityName: string
  tenantId: string
  contactId: string
  contact?: Contact
  serviceId: string
  service?: Service
  serviceSlotId?: string
  serviceSlot?: ServiceSlot
  startAt: string
  endAt: string
  attendeeCount: number
  attendees?: BookingAttendee[]
  totalAmount: number
  paidAmount: number
  status: BookingStatus
  paymentStatus: PaymentStatus
  checkInAt?: string
  notes?: string
  addOns?: BookingAddOn[]
  creditPackPurchaseId?: string
  createdAt: string
  updatedAt: string
  totalPrice: number
}

export interface BookingAttendee {
  id: string
  bookingId: string
  contactId: string
  contact?: Contact
  isCheckedIn: boolean
  checkedInAt?: string
}

export interface AddOn {
  id: string
  tenantId: string
  name: string
  description?: string
  pricingType: 'FLAT' | 'PER_PERSON'
  price: number
  applicableServiceTypes: ServiceType[]
  isActive: boolean
}

export interface BookingAddOn {
  id: string
  bookingId: string
  addOnId: string
  addOn?: AddOn
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface WaitlistEntry {
  id: string
  tenantId: string
  serviceSlotId: string
  serviceSlot?: ServiceSlot
  contactId: string
  contact?: Contact
  position: number
  status: 'WAITING' | 'NOTIFIED' | 'CONVERTED' | 'EXPIRED' | 'CANCELLED'
  notifiedAt?: string
  expiresAt?: string
  createdAt: string
}

export interface Resource {
  id: string
  tenantId: string
  name: string
  resourceType: string
  capacity: number
  locationId: string
  location?: Location
  isActive: boolean
}

// ============================================
// CONTACTS & CRM
// ============================================

export interface Contact {
  id: string
  tenantId: string
  contactType: ContactType
  firstName: string
  lastName: string
  email?: string
  phone?: string
  dateOfBirth?: string
  address?: string
  city?: string
  postcode?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  avatarUrl?: string
  creditBalance: number
  totalSpend: number
  notes?: string
  tags?: Tag[]
  relationships?: ContactRelationship[]
  subscriptions?: Subscription[]
  creditPacks?: CreditPackPurchase[]
  documents?: Document[]
  createdAt: string
  updatedAt: string
}

export interface ContactRelationship {
  id: string
  contactIdA: string
  contactA?: Contact
  contactIdB: string
  contactB?: Contact
  relationshipType: RelationshipType
  permissions?: Record<string, boolean>
}

export interface Tag {
  id: string
  tenantId: string
  name: string
  color: string
  isAuto: boolean
  contactCount?: number
}

export interface Document {
  id: string
  tenantId: string
  name: string
  description?: string
  fileUrl?: string
  templateContent?: string
  requiresSignature: boolean
  isRequired: boolean
  applicableServiceTypes?: ServiceType[]
  createdAt: string
}

export interface DocumentSignature {
  id: string
  documentId: string
  document?: Document
  contactId: string
  contact?: Contact
  signedAt: string
  signatureUrl?: string
  ipAddress?: string
}

// ============================================
// MEMBERSHIPS & CREDITS
// ============================================

export interface Plan {
  id: string
  tenantId: string
  name: string
  description?: string
  billingCycle: BillingCycle
  price: number
  benefits: PlanBenefit[]
  gatewayPriceId?: string
  isActive: boolean
  isFeatured: boolean
  displayOrder: number
  createdAt: string
}

export interface PlanBenefit {
  title: string
  description?: string
}

export interface Subscription {
  id: string
  tenantId: string
  contactId: string
  contact?: Contact
  planId: string
  plan?: Plan
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelledAt?: string
  pausedAt?: string
  resumeAt?: string
  gatewaySubscriptionId?: string
  createdAt: string
  updatedAt: string
}

export interface CreditPackDefinition {
  id: string
  tenantId: string
  name: string
  description?: string
  creditCount: number
  price: number
  validityDays: number
  applicableServiceTypes: ServiceType[]
  isActive: boolean
  isFeatured: boolean
  displayOrder: number
}

export interface CreditPackPurchase {
  id: string
  tenantId: string
  contactId: string
  contact?: Contact
  creditPackDefinitionId: string
  creditPackDefinition?: CreditPackDefinition
  creditsPurchased: number
  creditsRemaining: number
  purchasedAt: string
  expiresAt: string
  status: 'ACTIVE' | 'EXPIRED' | 'DEPLETED'
}

export interface CreditLedger {
  id: string
  tenantId: string
  contactId: string
  creditPackPurchaseId?: string
  bookingId?: string
  transactionType: 'PURCHASE' | 'DEDUCTION' | 'REFUND' | 'ADJUSTMENT' | 'EXPIRY'
  creditsChange: number
  balanceAfter: number
  description?: string
  createdAt: string
}

// ============================================
// STAFF & PAYROLL
// ============================================

export interface Staff {
  id: string
  tenantId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: StaffRole
  locationIds: string[]
  locations?: Location[]
  avatarUrl?: string
  bio?: string
  specializations?: string[]
  qualifications?: StaffQualification[]
  hourlyRate?: number
  isActive: boolean
  hireDate?: string
  createdAt: string
  updatedAt: string
}

export interface StaffQualification {
  name: string
  issuedBy?: string
  issuedAt?: string
  expiresAt?: string
  certificateUrl?: string
}

export interface StaffShift {
  id: string
  tenantId: string
  staffId: string
  staff?: Staff
  locationId: string
  location?: Location
  clockInAt: string
  clockOutAt?: string
  breakMinutes?: number
  totalMinutes?: number
  regularMinutes?: number
  overtimeMinutes?: number
  notes?: string
}

// ============================================
// INVENTORY & ORDERS
// ============================================

export interface ProductCategory {
  id: string
  tenantId: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  displayOrder: number
}

export interface Product {
  id: string
  tenantId: string
  categoryId: string
  category?: ProductCategory
  name: string
  slug: string
  description?: string
  sku?: string
  price: number
  memberPrice?: number
  costPrice?: number
  stockCount: number
  lowStockThreshold: number
  allowBackorders: boolean
  imageUrl?: string
  galleryImages?: string[]
  isActive: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

export interface StockMovement {
  id: string
  tenantId: string
  productId: string
  product?: Product
  movementType: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE'
  quantity: number
  previousStock: number
  newStock: number
  notes?: string
  createdAt: string
}

export interface Order {
  id: string
  tenantId: string
  orderNumber: string
  contactId: string
  contact?: Contact
  channel: 'ONLINE' | 'POS'
  items: OrderItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentGateway?: 'STRIPE' | 'SQUARE' | 'CASH'
  couponId?: string
  coupon?: Coupon
  shippingAddress?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  product?: Product
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  total: number
}

export interface Coupon {
  id: string
  tenantId: string
  code: string
  name: string
  description?: string
  type: CouponType
  value: number
  minPurchase?: number
  maxDiscount?: number
  usageLimit?: number
  usageCount: number
  validFrom: string
  validUntil: string
  restrictToTagId?: string
  restrictToTag?: Tag
  requiresSubscription: boolean
  applicableTo: ('BOOKING' | 'SHOP' | 'MEMBERSHIP')[]
  isActive: boolean
}

// ============================================
// LEADS & MARKETING
// ============================================

export interface Lead {
  id: string
  tenantId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  source: 'WEBSITE_FORM' | 'PHONE' | 'WALK_IN' | 'REFERRAL' | 'SOCIAL' | 'OTHER'
  stage: LeadStage
  interestedServices?: string[]
  notes?: string
  assignedToId?: string
  assignedTo?: Staff
  followUpDate?: string
  convertedContactId?: string
  convertedAt?: string
  createdAt: string
  updatedAt: string
}

export interface SmartList {
  id: string
  tenantId: string
  name: string
  description?: string
  criteria: SmartListCriteria
  contactCount?: number
  createdAt: string
  updatedAt: string
}

export interface SmartListCriteria {
  filters: SmartListFilter[]
  operator: 'AND' | 'OR'
}

export interface SmartListFilter {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: string | number | string[] | number[]
}

export interface CommunicationTemplate {
  id: string
  tenantId: string
  name: string
  subject?: string
  content: string
  type: 'EMAIL' | 'SMS'
  category: 'WELCOME' | 'REMINDER' | 'PROMOTION' | 'FOLLOW_UP' | 'CUSTOM'
  variables?: string[]
  isActive: boolean
}

// ============================================
// FINANCIAL
// ============================================

export interface Transaction {
  id: string
  tenantId: string
  type: TransactionType
  category: string
  contactId?: string
  contact?: Contact
  bookingId?: string
  orderId?: string
  subscriptionId?: string
  grossAmount: number
  discount: number
  tax: number
  netAmount: number
  paymentGateway: 'STRIPE' | 'SQUARE' | 'CASH' | 'CREDIT'
  gatewayTransactionId?: string
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED'
  createdAt: string
}

export interface Invoice {
  id: string
  tenantId: string
  invoiceNumber: string
  contactId: string
  contact?: Contact
  lineItems: InvoiceLineItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  paidAmount: number
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  dueDate: string
  pdfFileId?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

// ============================================
// REPORTS & ANALYTICS
// ============================================

export interface RevenueReport {
  period: string
  totalRevenue: number
  bookingRevenue: number
  membershipRevenue: number
  classPackRevenue: number
  shopRevenue: number
  refunds: number
  netRevenue: number
}

export interface BookingReport {
  period: string
  totalBookings: number
  confirmedBookings: number
  cancelledBookings: number
  noShows: number
  checkIns: number
  averageAttendees: number
  occupancyRate: number
}

export interface ClientInsights {
  totalContacts: number
  newContactsThisPeriod: number
  activeMembers: number
  averageSpend: number
  topSpenders: Contact[]
  atRiskClients: Contact[]
}

export interface StaffReport {
  staffId: string
  staff?: Staff
  totalHours: number
  regularHours: number
  overtimeHours: number
  sessionsLed: number
  totalEarnings: number
}

// ============================================
// NOTIFICATIONS & AUDIT
// ============================================

export interface NotificationLog {
  id: string
  tenantId: string
  contactId?: string
  staffId?: string
  type: 'EMAIL' | 'SMS' | 'PUSH'
  templateId?: string
  subject?: string
  content: string
  status: 'SENT' | 'FAILED' | 'BOUNCED'
  sentAt: string
  errorMessage?: string
}

export interface AuditLog {
  id: string
  tenantId: string
  staffId?: string
  action: string
  entityType: string
  entityId: string
  beforeState?: Record<string, unknown>
  afterState?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: PaginationMeta
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// ============================================
// UI SPECIFIC TYPES
// ============================================

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resourceId?: string
  backgroundColor?: string
  borderColor?: string
  extendedProps?: {
    service?: Service
    slot?: ServiceSlot
    booking?: Booking
    type: 'slot' | 'booking' | 'maintenance'
  }
}

export interface CartItem {
  id: string
  type: 'product' | 'booking' | 'membership' | 'class-pack'
  name: string
  description?: string
  price: number
  quantity: number
  imageUrl?: string
  metadata?: Record<string, unknown>
}

export interface Cart {
  items: CartItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  couponCode?: string
}

export interface DashboardKPI {
  label: string
  value: string | number
  change: number
  changeLabel: string
  trend: 'up' | 'down' | 'neutral'
}

export interface RevenueDataPoint {
  period: string
  revenue: number
  bookings: number
  memberships: number
}

export interface Facility {
  id: string
  tenantId: string
  name: string
  description: string
  sport: string
  pricePerHour: number
  reviewCount: number
  capacity: number
  floor: number
  amenities: string[]
  imageUrl: string
  isActive: boolean
  isAvailable: boolean
  createdAt: string
  updatedAt: string
  rating: number
  hourlyRate: number
}

export interface Event {
  id: string
  tenantId: string
  name: string
  description: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  ticketPrice: number
  location: string
  price: number
  sport: string
  imageUrl: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  maxAttendees: number
  registeredCount: number
  title: string
  date: string
  ticketsAvailable: number
  capacity: number
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED' | 'Upcoming' | 'Ongoing' | 'Past'
  organizer: string
  agenda: { time: string; description: string }[]
  tags: string[]
}

export interface Class {
  id: string
  tenantId: string
  name: string
  description: string
  schedule: { dayOfWeek: string; startTime: string, endTime: string }[]
  facilityName: string
  instructor: string
  instructorId: string
  price: number
  imageUrl: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  maxCapacity: number
  enrolledCount: number
  sport: string
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels'
  instructorName: string
  durationMinutes: number
  currentParticipants: number
  maxParticipants: number
}


export interface Instructors {
  id: string
  instructorId: string
  avatarUrl: string
  tenantId: string
  name: string
  bio: string
  rating: number
  specializations: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface EventRegistration {
  ticketCount: number
  contactId: string
  eventId: string
  id: string
  tenantId: string
  createdAt: string
  updatedAt: string
  registeredAt: string
  totalPaid: number
  eventTitle: string
}

export interface Inventory {
  name: string
  quantity: number
  unit: string
  id: 'inv-1'
  tenantId: 'tenant-1'
  createdAt: '2024-01-01T00:00:00Z'
  updatedAt: '2024-01-01T00:00:00Z'
  sku: string
  category: string
  price: number
}

export interface Users {
  id: string
  tenantId: string
  name: string
  email: string
  role: 'user' | 'admin' | 'instructor' | 'coach' | 'front_desk' | 'coordinator' | 'manager' | 'CUSTOMER'
  isActive: boolean
  createdAt: string
  updatedAt: string
  joinDate: string
  phone: string
  avatarUrl: string
  firstName: string
  lastName: string
  bookings: number
  totalSpent: number
  joinedAt: string

}

