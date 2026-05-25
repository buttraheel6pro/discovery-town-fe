// Discovery Town - Sports Complex ERP Platform Types
// Based on the official SRS document

// ============================================
// ENUMS
// ============================================

export type BookingMode = "SCHEDULED" | "OPEN";
export type ServiceType =
  | "CLASS"
  | "COURT"
  | "PLAY_AREA"
  | "SWIMMING"
  | "PARTY"
  | "WORKSHOP"
  | "CAMP"
  | "COACHING";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type SlotStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";

export type ContactType =
  | "CUSTOMER"
  | "CHILD"
  | "CORPORATE"
  | "LEAD"
  | "VENDOR"
  | "STAFF";

export type RelationshipType =
  | "PARENT_CHILD"
  | "GUARDIAN"
  | "CORPORATE_MEMBER"
  | "EMERGENCY_CONTACT";

export type StaffRole =
  | "ORG_ADMIN"
  | "MANAGER"
  | "INSTRUCTOR"
  | "COACH"
  | "FRONT_DESK"
  | "COORDINATOR";

export type SubscriptionStatus =
  | "ACTIVE"
  | "TRIALING"
  | "PAUSED"
  | "CANCELLED"
  | "PAST_DUE"
  | "EXPIRED";

export type BillingCycle = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL";

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type RentalOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "OUT"
  | "RETURNED"
  | "COMPLETED";

export type RentalFulfillmentMode = "PICKUP" | "DELIVERY";
export type RentalFulfillmentType = "SHOP" | "RENTAL" | "INVITATION";
export type RentalBillingType =
  | "PER_DAY"
  | "PER_HALF_DAY"
  | "PER_EVENT"
  | "PER_HOUR";
export type StaffAssignmentRole =
  | "CHARACTER"
  | "PARTY_HOST"
  | "PHOTOGRAPHER"
  | "GENERAL"
  | "DRIVER"
  | "HOST";
export type StaffAssignmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

export type RentalProductFulfillment =
  | "DELIVERY_REQUIRED"
  | "STAFF_INCLUDED"
  | "STAFF_REQUIRED"
  | "BOOKING_REQUIRED"
  | "SELF_OPERATED"
  | "DELIVERY_REQUIRED+STAFF";

/**
 * Rental checkout acknowledgment key — short summary text, or `text + unit separator + url`
 * when a detail link is configured (`rentalAcknowledgmentCartId` in `lib/rental-acknowledgments`).
 */
export type RentalAcknowledgmentType = string;

/** One acknowledgment line for a rental product sub-category (summary + optional policy URL). */
export interface RentalCategoryAcknowledgment {
  readonly text: string;
  /** Optional link to full waiver, PDF, or policy page. */
  readonly detailUrl?: string | null;
}

/** Checkbox row built from category acknowledgments for cart / rental checkout UI. */
export interface RentalAcknowledgmentCheckoutOption {
  readonly id: string;
  readonly label: string;
  readonly detailUrl?: string;
}

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIAL";

export type LeadStage =
  | "NEW"
  | "CONTACTED"
  | "TRIAL_OFFERED"
  | "TRIAL_ATTENDED"
  | "ENROLLED"
  | "LOST";

export type CouponType = "PERCENTAGE" | "FIXED_AMOUNT";

/** Checkout surface for coupon eligibility (ORDER maps to SHOP in `Coupon.applicableTo`). */
export type CouponContext = "BOOKING" | "ORDER" | "MEMBERSHIP";

export type PricingModel = "FLAT" | "PER_HOUR" | "PER_PERSON";

export type TransactionType =
  | "BOOKING"
  | "MEMBERSHIP"
  | "CLASS_PACK"
  | "SHOP"
  | "REFUND"
  | "BALANCE_PAYMENT";

// ============================================
// CORE MODELS
// ============================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
  activeModules: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TenantSetting {
  id: string;
  tenantId: string;
  bookingRules: BookingRules;
  branding: BrandingSettings;
  currency: string;
  timezone: string;
}

export interface BookingRules {
  minAdvanceHours: number;
  maxAdvanceDays: number;
  cancellationHours: number;
  noShowPenalty: number;
}

export interface BrandingSettings {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface Location {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  city: string;
  country?: string;
  postcode: string;
  timezone: string;
  /** Soft delete / visibility toggle (mock + UI only for now). */
  isActive?: boolean;
  phone?: string;
  email?: string;
  settings: LocationSettings;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/** Query params for listing locations from API. */
export interface ListLocationsParams {
  page?: number;
  limit?: number;
}

/** Create-location request payload shared across service/store/UI layers. */
export interface CreateLocationPayload {
  name: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  phone?: string;
  email?: string;
  imageUrl?: string;
  isActive?: boolean;
  settings: Record<string, unknown>;
}

/** Partial update payload for PATCH /locations/:id. */
export interface UpdateLocationPayload {
  name?: string;
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
  phone?: string;
  email?: string;
  imageUrl?: string;
  isActive?: boolean;
  settings?: Record<string, unknown>;
}

export interface LocationSettings {
  operatingHours: OperatingHours[];
}

export interface OperatingHours {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

// ============================================
// SERVICE & SCHEDULING
// ============================================

export interface ServiceCategory {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  color?: string;
  serviceCount?: number;
}

export interface Service {
  id: string;
  tenantId: string;
  categoryId: string;
  category?: ServiceCategory;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  bookingMode: BookingMode;
  serviceType: ServiceType;
  capacity: number;
  basePrice: number;
  memberPrice?: number;
  duration: number;
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
  maxConcurrent?: number;
  slotIncrementMinutes?: number;
  minAdvanceHours?: number;
  maxAdvanceHours?: number;
  minAge?: number;
  maxAge?: number;
  locationId: string;
  location?: Location;
  imageUrl?: string;
  galleryImages?: string[];
  instructorId?: string;
  instructor?: Staff;
  isActive: boolean;
  isFeatured: boolean;
  metadata?: ServiceMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceMetadata {
  pricingModel?: PricingModel;
  requirements?: string[];
  whatToBring?: string[];
  cancellationPolicy?: string;
}

export interface ServiceSlot {
  id: string;
  tenantId: string;
  serviceId: string;
  service?: Service;
  locationId: string;
  location?: Location;
  instructorId?: string;
  instructor?: Staff;
  startAt: string;
  endAt: string;
  bookedCount: number;
  effectiveCapacity: number;
  priceOverride?: number;
  status: SlotStatus;
  notes?: string;
  recurringRuleId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringRule {
  id: string;
  tenantId: string;
  serviceId: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  facilityName: string;
  tenantId: string;
  contactId: string;
  contact?: Contact;
  serviceId: string;
  service?: Service;
  serviceSlotId?: string;
  serviceSlot?: ServiceSlot;
  startAt: string;
  endAt: string;
  attendeeCount: number;
  attendees?: BookingAttendee[];
  totalAmount: number;
  paidAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  checkInAt?: string;
  notes?: string;
  addOns?: BookingAddOn[];
  creditPackPurchaseId?: string;
  createdAt: string;
  updatedAt: string;
  totalPrice: number;
}

export interface BookingAttendee {
  id: string;
  bookingId: string;
  contactId: string;
  contact?: Contact;
  isCheckedIn: boolean;
  checkedInAt?: string;
}

export const AddOnStructureType = {
  SIMPLE: "SIMPLE",
  COMPLEX: "COMPLEX",
} as const;

export type AddOnStructureType =
  (typeof AddOnStructureType)[keyof typeof AddOnStructureType];

export interface AddOn {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  pricingType: "FLAT" | "PER_PERSON";
  price: number;
  memberPrice?: number | null;
  referenceType?: "ALL" | "PRODUCT";
  inventoryProductId?: string | null;
  structureType?: AddOnStructureType;
  applicableServiceTypes: ServiceType[];
  isActive: boolean;
  deletedAt?: string | null;
}

export interface BookingAddOn {
  id: string;
  bookingId: string;
  addOnId: string;
  addOn?: AddOn;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface WaitlistEntry {
  id: string;
  tenantId: string;
  serviceSlotId: string;
  serviceSlot?: ServiceSlot;
  contactId: string;
  contact?: Contact;
  position: number;
  status: "WAITING" | "NOTIFIED" | "CONVERTED" | "EXPIRED" | "CANCELLED";
  notifiedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface Resource {
  id: string;
  tenantId: string;
  name: string;
  resourceType: string;
  capacity: number;
  locationId: string;
  location?: Location;
  isActive: boolean;
}

// ============================================
// CONTACTS & CRM
// ============================================

export interface Contact {
  id: string;
  tenantId: string;
  contactType: ContactType;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  postcode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  avatarUrl?: string;
  creditBalance: number;
  totalSpend: number;
  notes?: string;
  tags?: Tag[];
  relationships?: ContactRelationship[];
  subscriptions?: Subscription[];
  creditPacks?: CreditPackPurchase[];
  documents?: Document[];
  createdAt: string;
  updatedAt: string;
}

export interface ContactRelationship {
  id: string;
  contactIdA: string;
  contactA?: Contact;
  contactIdB: string;
  contactB?: Contact;
  relationshipType: RelationshipType;
  permissions?: Record<string, boolean>;
}

export interface Tag {
  id: string;
  tenantId: string;
  name: string;
  color: string;
  isAuto: boolean;
  contactCount?: number;
}

export interface Document {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  fileUrl?: string;
  templateContent?: string;
  requiresSignature: boolean;
  isRequired: boolean;
  applicableServiceTypes?: ServiceType[];
  createdAt: string;
}

export interface DocumentSignature {
  id: string;
  documentId: string;
  document?: Document;
  contactId: string;
  contact?: Contact;
  signedAt: string;
  signatureUrl?: string;
  ipAddress?: string;
}

// ============================================
// MEMBERSHIPS & CREDITS
// ============================================

export interface Plan {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  billingCycle: BillingCycle;
  price: number;
  benefits: PlanBenefit[];
  gatewayPriceId?: string;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface PlanBenefit {
  title: string;
  description?: string;
}

export interface Subscription {
  id: string;
  tenantId: string;
  contactId: string;
  contact?: Contact;
  planId: string;
  plan?: Plan;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
  pausedAt?: string;
  resumeAt?: string;
  gatewaySubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditPackDefinition {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  creditCount: number;
  price: number;
  validityDays: number;
  applicableServiceTypes: ServiceType[];
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
}

export interface CreditPackPurchase {
  id: string;
  tenantId: string;
  contactId: string;
  contact?: Contact;
  creditPackDefinitionId: string;
  creditPackDefinition?: CreditPackDefinition;
  creditsPurchased: number;
  creditsRemaining: number;
  purchasedAt: string;
  expiresAt: string;
  status: "ACTIVE" | "EXPIRED" | "DEPLETED";
}

export interface CreditLedger {
  id: string;
  tenantId: string;
  contactId: string;
  creditPackPurchaseId?: string;
  bookingId?: string;
  transactionType:
    | "PURCHASE"
    | "DEDUCTION"
    | "REFUND"
    | "ADJUSTMENT"
    | "EXPIRY";
  creditsChange: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
}

// ============================================
// STAFF & PAYROLL
// ============================================

export interface Staff {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: StaffRole;
  locationIds: string[];
  locations?: Location[];
  avatarUrl?: string;
  bio?: string;
  specializations?: string[];
  qualifications?: StaffQualification[];
  hourlyRate?: number;
  isActive: boolean;
  hireDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffQualification {
  name: string;
  issuedBy?: string;
  issuedAt?: string;
  expiresAt?: string;
  certificateUrl?: string;
}

export interface StaffShift {
  id: string;
  tenantId: string;
  staffId: string;
  staff?: Staff;
  locationId: string;
  location?: Location;
  clockInAt: string;
  clockOutAt?: string;
  breakMinutes?: number;
  totalMinutes?: number;
  regularMinutes?: number;
  overtimeMinutes?: number;
  notes?: string;
}

export interface StaffAssignment {
  id: string;
  tenantId: string;
  orderId?: string | null;
  bookingId?: string | null;
  role: string;
  scheduledAt: string;
  endsAt: string;
  staffId?: string | null;
  staffName?: string | null;
  status: StaffAssignmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentalAvailabilityDay {
  date: string;
  bookedUnits: number;
}

// ============================================
// CLIENT MANAGEMENT (APPENDED)
// ============================================

export const CreditPackStatusEnum = {
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  EXHAUSTED: "EXHAUSTED",
} as const;

export type CreditPackStatus =
  (typeof CreditPackStatusEnum)[keyof typeof CreditPackStatusEnum];

export const CreditTransactionTypeEnum = {
  PURCHASE: "PURCHASE",
  DEDUCTION: "DEDUCTION",
  REFUND: "REFUND",
  EXPIRY: "EXPIRY",
  MANUAL_ADD: "MANUAL_ADD",
  MANUAL_REMOVE: "MANUAL_REMOVE",
} as const;

export type CreditTransactionType =
  (typeof CreditTransactionTypeEnum)[keyof typeof CreditTransactionTypeEnum];

export const DocumentTypeEnum = {
  WAIVER: "WAIVER",
  PARENTAL_CONSENT: "PARENTAL_CONSENT",
  MEMBERSHIP_TERMS: "MEMBERSHIP_TERMS",
  FACILITY_RULES: "FACILITY_RULES",
  CONTRACT: "CONTRACT",
  CUSTOM: "CUSTOM",
} as const;

export type DocumentType =
  (typeof DocumentTypeEnum)[keyof typeof DocumentTypeEnum];

export interface ContactTag {
  id: string;
  tenantId: string;
  name: string;
  color: string;
  isSystem: boolean;
  isAuto?: boolean;
  description?: string;
  contactCount?: number;
}

export interface ContactTagAssignment {
  id: string;
  tenantId: string;
  contactId: string;
  tagId: string;
  tag?: ContactTag;
  createdAt: string;
  createdByStaffId?: string;
}

export interface ContactMetadata {
  marketingOptIn: boolean;
  preferredChannel?: "EMAIL" | "SMS" | "WHATSAPP";
  preferredLocationId?: string;
  notes?: string;
  allergies?: string;
  medicalNotes?: string;
  schoolName?: string;
  yearGroup?: string;
}

export interface MembershipPlan {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  billingCycle: BillingCycle;
  price: number;
  benefits: string[];
  isActive: boolean;
  isFeatured: boolean;
  minTermMonths?: number;
  cancellationNoticeDays?: number;
  createdAt: string;
  updatedAt: string;
  /** When set, pairs monthly + annual SKUs for catalog display and toggles. */
  planGroupId?: string;
  /** Mirror prices for UI when this row is monthly or annual only. */
  monthlyPrice?: number;
  annualPrice?: number;
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
  allowFamilyMember?: boolean;
  isHouseholdOnly?: boolean;
  maxChildren?: number;
  /** Seasonal / marketing badge (e.g. winter pass). */
  seasonalBadge?: string;
  /** Customer pages where this plan is listed (gym, play, events, membership). */
  displayPages?: Array<'gym' | 'play' | 'events' | 'membership'>;
  /** Scheduling sub-category ids — limits which page sections show the plan. */
  schedulingCategoryIds?: string[];
}

/** Links a membership plan to a catalog add-on (admin + member perks). */
export interface PlanAddOn {
  id: string;
  planId: string;
  addOnId: string;
  isIncluded: boolean;
  discountPercent?: number;
}

/** Links a membership plan to a coupon for subscriber-only use. */
export interface PlanCoupon {
  id: string;
  planId: string;
  couponId: string;
}

export interface ContactSubscription {
  id: string;
  tenantId: string;
  contactId: string;
  contact?: Contact;
  planId: string;
  plan?: MembershipPlan;
  status: SubscriptionStatus;
  startedAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
  pauseStart?: string;
  pauseEnd?: string;
  renewalAt?: string;
  /** Child contact ids covered when plan.allowFamilyMember is true. */
  familyMemberIds?: string[];
  /** Promo code applied at enrollment (mock). */
  couponCode?: string | null;
  actedByStaffId?: string | null;
}

export interface CmCreditPackDefinition {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  creditCount: number;
  price: number;
  validityDays: number;
  applicableServiceTypes: ServiceType[];
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
}

export interface CmCreditPackPurchase {
  id: string;
  tenantId: string;
  contactId: string;
  contact?: Contact;
  creditPackDefinitionId: string;
  creditPackDefinition?: CmCreditPackDefinition;
  creditsPurchased: number;
  creditsRemaining: number;
  purchasedAt: string;
  expiresAt: string;
  status: CreditPackStatus;
}

export interface CreditLedgerEntry {
  id: string;
  tenantId: string;
  contactId: string;
  contact?: Contact;
  creditPackPurchaseId?: string;
  creditPackPurchase?: CmCreditPackPurchase;
  transactionType: CreditTransactionType;
  creditsChange: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
}

export type DocumentSubType = "GUEST" | "HOST";

export interface ClientDocument {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  documentType: DocumentType;
  documentSubType?: DocumentSubType;
  isRequired: boolean;
  serviceTypeScope?: ServiceType[];
  validFrom?: string;
  validTo?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CmDocumentSignature {
  id: string;
  tenantId: string;
  documentId: string;
  document?: ClientDocument;
  contactId: string;
  contact?: Contact;
  signedAt: string;
  expiresAt?: string;
  ipAddress?: string;
  userAgent?: string;
  signatureDataUrl?: string;
}

export interface CmContactRelationship {
  id: string;
  tenantId: string;
  contactId: string;
  relatedContactId: string;
  relationshipType: RelationshipType;
  isPrimaryGuardian?: boolean;
  canBookFor?: boolean;
  canViewDocuments?: boolean;
  canManageMembership?: boolean;
  notes?: string;
  createdAt: string;
}

export interface ContactSummary {
  id: string;
  fullName: string;
  contactType: ContactType;
  email?: string;
  phone?: string;
  creditBalance: number;
  activeMembership?: string;
  activePackCount: number;
}

export interface CmContact {
  id: string;
  tenantId: string;
  contactType: ContactType;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  country?: string;
  avatarUrl?: string;
  metadata?: ContactMetadata;
  tags?: ContactTagAssignment[];
  relationships?: CmContactRelationship[];
  subscriptions?: ContactSubscription[];
  creditPacks?: CmCreditPackPurchase[];
  creditLedger?: CreditLedgerEntry[];
  documents?: CmDocumentSignature[];
  createdAt: string;
  updatedAt: string;
}

export interface ContactFilters {
  search?: string;
  contactTypes?: ContactType[];
  tagIds?: string[];
  subscriptionStatuses?: SubscriptionStatus[];
  hasActiveMembership?: boolean;
  hasActivePack?: boolean;
}

export interface ContactNote {
  id: string;
  tenantId: string;
  contactId: string;
  contact?: Contact;
  authorStaffId?: string;
  authorName?: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

// ============================================
// INVENTORY & ORDERS
// ============================================

export interface ProductCategory {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  /** Business grouping key (e.g. shop, cafe&food, gifts, rentals). */
  productType?: string;
  /** When set, this category is nested under a top-level category. */
  parentId?: string | null;
  /**
   * Rentals-only: checkout acknowledgment lines for products in this category
   * (unioned with other rental line items in the cart). Optional `detailUrl` per line.
   */
  rentalAcknowledgments?: RentalCategoryAcknowledgment[];
}

export interface Product {
  /** Business grouping key (e.g. shop, cafe&food, gifts, rentals). */
  productType?: string;
  id: string;
  tenantId: string;
  categoryId: string;
  category?: ProductCategory;
  name: string;
  slug: string;
  description?: string;
  sku?: string;
  price: number;
  memberPrice?: number;
  costPrice?: number;
  stockCount: number;
  lowStockThreshold: number;
  allowBackorders: boolean;
  imageUrl?: string;
  galleryImages?: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  tenantId: string;
  productId: string;
  product?: Product;
  movementType: "PURCHASE" | "SALE" | "ADJUSTMENT" | "RETURN" | "DAMAGE";
  quantity: number;
  previousStock: number;
  newStock: number;
  notes?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  tenantId: string;
  orderNumber: string;
  contactId: string;
  contact?: Contact;
  channel: "ONLINE" | "POS";
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentGateway?: "STRIPE" | "SQUARE" | "CASH";
  couponId?: string;
  coupon?: Coupon;
  shippingAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  total: number;
}

export interface Coupon {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  validFrom: string;
  validUntil: string;
  restrictToTagId?: string;
  restrictToTag?: Tag;
  requiresSubscription: boolean;
  applicableTo: ("BOOKING" | "SHOP" | "MEMBERSHIP")[];
  isActive: boolean;
}

// ============================================
// INVENTORY & SHOP (UI + ADMIN EXTENSIONS)
// ============================================

export type StockStatus =
  | "IN_STOCK"
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "BACKORDER";

export interface CouponValidation {
  valid: boolean;
  discountAmount: number;
  message: string;
  coupon: Coupon | null;
}

export interface ProductFilters {
  categoryId?: string;
  stockStatus?: StockStatus;
  availableOnline?: boolean;
  availablePOS?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface OrderFilters {
  status?: OrderStatus;
  channel?: Order["channel"];
  from?: string;
  to?: string;
  search?: string;
}

export interface CartState {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;
  contactId: string | null;
  contactName: string | null;
  rentalStartAt?: string | null;
  rentalEndAt?: string | null;
  fulfillmentMode?: RentalFulfillmentMode | null;
  deliveryAddress?: string | null;
  deliveryFee?: number;
  depositTotal?: number;
  acknowledgments?: RentalAcknowledgmentType[];
}

// Interface merges (append-only) — extend core models for richer shop/admin flows.
export interface Product {
  compareAtPrice?: number | null;
  subscriptionPrice?: number | null;
  taxable?: boolean;
  taxRate?: number;
  trackInventory?: boolean;
  availableOnline?: boolean;
  availablePOS?: boolean;
  galleryUrls?: string[];
  /** Product is linked to the booking add-on catalog (irreversible after promotion). */
  canBeAddOn?: boolean;
  linkedAddOnId?: string | null;
  isRental?: boolean;
  rentalPricePerDay?: number;
  rentalPricePerHalfDay?: number;
  pricePerHour?: number;
  priceFirstHourPremium?: number;
  pricePerEvent?: number;
  minHours?: number;
  /** Optional fixed prices for specific hour durations (e.g. 2h => 250, 3h => 375). */
  rentalHourlyTierPrices?: Array<{ hours: number; price: number }>;
  /** Optional fixed prices for specific day durations (e.g. 2d => 2000, 3d => 2800). */
  rentalDailyTierPrices?: Array<{ days: number; price: number }>;
  rentalBillingType?: RentalBillingType;
  requiresDelivery?: boolean;
  requiresStaff?: boolean;
  setupMinutes?: number;
  maxRentalDays?: number;
  /** Per-hour rentals: slot size in minutes (commonly 30 or 60). */
  rentalSlotIncrementMinutes?: number;
  fulfillment?: RentalProductFulfillment;
  depositAmount?: number;
  requiresAcknowledgment?: RentalAcknowledgmentType[];
  rentalCategorySlug?: string;
  /** Gifts-only linked inventory products shown in bundled recommendations. */
  giftProductIds?: string[];
  /** Gifts-only optional addon product links. */
  giftAddOnProductIds?: string[];
  /** Gifts-only voucher coupon links. */
  giftVoucherCouponIds?: string[];
  /** Gifts-only flag for applying coupons with package behavior. */
  giftCouponsWithPackage?: boolean;
  /** Gifts-only perishable marker for handling/packaging rules. */
  isPerishable?: boolean;
  /** Gifts-only packaging/basket capacity value. */
  basketCapacity?: number | null;
  /** Gifts-only max list price when all nice-to-have add-ons are included (basket + add-ons). */
  giftPriceUpperLimit?: number | null;
  /** Gifts-only linked scheduling occasion ids (supports multiple). */
  giftOccasionIds?: string[];
  /** @deprecated Use `giftOccasionIds`. First occasion id for legacy readers. */
  giftOccasionId?: string | null;
  /** Shop merch — variant attribute groups (size/color/etc.). */
  shopAttributeGroups?: AttributeGroup[];
  /** Shop merch — generated sellable combinations with per-variant stock. */
  shopVariants?: ShopProductVariant[];
  /** Shop merch — catalog applicability, distinct from customer-selectable attributes. */
  targetGender?: "men" | "women" | "unisex";
}

export interface StockMovement {
  createdBy?: string;
  referenceId?: string | null;
  balanceAfter?: number;
}

export interface OrderItem {
  sku?: string;
  imageUrl?: string | null;
}

export type PaymentMethod = "CARD" | "CASH" | "BANK_TRANSFER";

export interface Order {
  contactName?: string | null;
  contactEmail?: string | null;
  couponCode?: string | null;
  couponDiscount?: number;
  actedByStaffId?: string | null;
  paymentMethod?: PaymentMethod | null;
  paymentReference?: string | null;
  refundAmount?: number | null;
  refundReason?: string | null;
  fulfilledAt?: string | null;
  fulfillmentType?: RentalFulfillmentType;
  rentalStatus?: RentalOrderStatus;
  rentalStartAt?: string | null;
  rentalEndAt?: string | null;
  fulfillmentMode?: RentalFulfillmentMode | null;
  deliveryAddress?: string | null;
  deliveryFee?: number;
  depositAmount?: number;
  depositCapturedAmount?: number;
  damageNotes?: string | null;
  acknowledgments?: RentalAcknowledgmentType[];
  designBrief?: {
    eventName?: string;
    theme?: string;
    date?: string;
  } | null;
  designCompletedAt?: string | null;
}

export interface Coupon {
  maxRedemptions?: number | null;
  perContactLimit?: number | null;
  redemptionCount?: number;
  applicableBookingTypes?: string[];
  applicableServiceIds?: string[];
}

// ============================================
// LEADS & MARKETING
// ============================================

export interface Lead {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  source:
    | "WEBSITE_FORM"
    | "PHONE"
    | "WALK_IN"
    | "REFERRAL"
    | "SOCIAL"
    | "OTHER";
  stage: LeadStage;
  interestedServices?: string[];
  notes?: string;
  assignedToId?: string;
  assignedTo?: Staff;
  followUpDate?: string;
  convertedContactId?: string;
  convertedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SmartList {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  criteria: SmartListCriteria;
  contactCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SmartListCriteria {
  filters: SmartListFilter[];
  operator: "AND" | "OR";
}

export interface SmartListFilter {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "greater_than"
    | "less_than"
    | "in"
    | "not_in";
  value: string | number | string[] | number[];
}

export interface CommunicationTemplate {
  id: string;
  tenantId: string;
  name: string;
  subject?: string;
  content: string;
  type: "EMAIL" | "SMS";
  category: "WELCOME" | "REMINDER" | "PROMOTION" | "FOLLOW_UP" | "CUSTOM";
  variables?: string[];
  isActive: boolean;
}

// ============================================
// FINANCIAL
// ============================================

export interface Transaction {
  id: string;
  tenantId: string;
  type: TransactionType;
  category: string;
  contactId?: string;
  contact?: Contact;
  bookingId?: string;
  orderId?: string;
  subscriptionId?: string;
  grossAmount: number;
  discount: number;
  tax: number;
  netAmount: number;
  paymentGateway: "STRIPE" | "SQUARE" | "CASH" | "CREDIT";
  gatewayTransactionId?: string;
  status: "COMPLETED" | "PENDING" | "FAILED" | "REFUNDED";
  createdAt: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  contactId: string;
  contact?: Contact;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED" | "VOID";
  dueDate: string;
  pdfFileId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// ============================================
// REPORTS & ANALYTICS
// ============================================

export interface RevenueReport {
  period: string;
  totalRevenue: number;
  bookingRevenue: number;
  membershipRevenue: number;
  classPackRevenue: number;
  shopRevenue: number;
  refunds: number;
  netRevenue: number;
}

export interface BookingReport {
  period: string;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  noShows: number;
  checkIns: number;
  averageAttendees: number;
  occupancyRate: number;
}

export interface ClientInsights {
  totalContacts: number;
  newContactsThisPeriod: number;
  activeMembers: number;
  averageSpend: number;
  topSpenders: Contact[];
  atRiskClients: Contact[];
}

export interface StaffReport {
  staffId: string;
  staff?: Staff;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  sessionsLed: number;
  totalEarnings: number;
}

// ============================================
// NOTIFICATIONS & AUDIT
// ============================================

export interface NotificationLog {
  id: string;
  tenantId: string;
  contactId?: string;
  staffId?: string;
  type: "EMAIL" | "SMS" | "PUSH";
  templateId?: string;
  subject?: string;
  content: string;
  status: "SENT" | "FAILED" | "BOUNCED";
  sentAt: string;
  errorMessage?: string;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  staffId?: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/** Query params for listing tags from API. */
export interface ListTagsParams {
  page?: number;
  limit?: number;
}

/** Result shape returned by tags list service. */
export interface ListTagsResult {
  readonly tags: ContactTag[];
  readonly meta: PaginationMeta | null;
}

/** Request payload for creating a contact tag via API. */
export interface CreateTagPayload {
  name: string;
  color: string;
  isAuto: boolean;
}

/** Request payload for updating a contact tag via API. */
export interface UpdateTagPayload {
  name: string;
  color: string;
  isAuto: boolean;
}

// ============================================
// AUTH
// ============================================

export interface AuthPermission {
  id: number;
  name: string;
  description: string | null;
  module: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  appComponentId: number | null;
  roleId: number;
}

export interface AuthRole {
  id: number;
  tenantId: string | null;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AuthUserRolePermission {
  id: number;
  userId: number;
  roleId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  role: AuthRole;
}

export interface AuthUserSettings {
  id: number;
  isTwoFactorAuth: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Raw response payload from GET /auth/me. */
export interface MeResponse {
  id: number;
  tenantId: string;
  name: string;
  email: string;
  password: string;
  salt: string;
  isActive: boolean;
  googleSocialId: string | null;
  facebookSocialId: string | null;
  storage_preference: string;
  languagePreference: string;
  loginAttempts: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  userSettings: AuthUserSettings;
  permissions: AuthPermission[];
  userRolePermission: AuthUserRolePermission[];
}

/** Sanitized UI-safe auth profile shape derived from /auth/me. */
export interface CurrentUserProfile {
  id: number;
  tenantId: string;
  name: string;
  email: string;
  isActive: boolean;
  storagePreference: string;
  languagePreference: string;
  loginAttempts: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  userSettings: AuthUserSettings;
  permissions: AuthPermission[];
  userRolePermission: AuthUserRolePermission[];
}

// ============================================
// UI SPECIFIC TYPES
// ============================================

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId?: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: {
    service?: Service;
    slot?: ServiceSlot;
    booking?: Booking;
    type: "slot" | "booking" | "maintenance";
  };
}

/** Selected cafe modifier lines stored on cart items (optional extension). */
export interface CartModifierSelection {
  groupName: string;
  modifierName: string;
  priceDelta: number;
}

export interface CartItem {
  id: string;
  type: "product" | "booking" | "membership" | "class-pack";
  name: string;
  description?: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
  /** Cafe & Food — product subtype label for cart lines. */
  subtypeLabel?: string;
  modifierTotal?: number;
  selectedModifiers?: CartModifierSelection[];
  preparationTimeMinutes?: number;
  /** Shop — selected option labels keyed by attribute group id. */
  selectedShopAttributes?: Record<string, string[]>;
  /** Shop — snapshot of groups used when item was added (for cart display). */
  shopAttributeGroupsSnapshot?: AttributeGroup[];
  /** Shop — selected concrete variant for this cart line. */
  shopVariantId?: string;
  shopVariantSku?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  couponCode?: string;
}

export interface DashboardKPI {
  label: string;
  value: string | number;
  change: number;
  changeLabel: string;
  trend: "up" | "down" | "neutral";
}

export interface RevenueDataPoint {
  period: string;
  revenue: number;
  bookings: number;
  memberships: number;
}

export interface Facility {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  sport: string;
  pricePerHour: number;
  reviewCount: number;
  capacity: number;
  floor: number;
  amenities: string[];
  imageUrl: string;
  isActive: boolean;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  rating: number;
  hourlyRate: number;
}

export interface Event {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  ticketPrice: number;
  location: string;
  price: number;
  sport: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  maxAttendees: number;
  registeredCount: number;
  title: string;
  date: string;
  ticketsAvailable: number;
  capacity: number;
  status:
    | "DRAFT"
    | "PUBLISHED"
    | "CANCELLED"
    | "COMPLETED"
    | "Upcoming"
    | "Ongoing"
    | "Past";
  organizer: string;
  agenda: { time: string; title?: string; description: string }[];
  tags: string[];
}

export interface Class {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  schedule: { dayOfWeek: string; startTime: string; endTime: string }[];
  facilityName: string;
  instructor: string;
  instructorId: string;
  price: number;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  maxCapacity: number;
  enrolledCount: number;
  sport: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
  instructorName: string;
  durationMinutes: number;
  currentParticipants: number;
  maxParticipants: number;
}

export interface Instructors {
  id: string;
  instructorId: string;
  avatarUrl: string;
  tenantId: string;
  name: string;
  bio: string;
  rating: number;
  specializations: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventRegistration {
  ticketCount: number;
  contactId: string;
  eventId: string;
  id: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  registeredAt: string;
  totalPaid: number;
  eventTitle: string;
}

export interface Inventory {
  id: string;
  tenantId: string;
  name: string;
  quantity: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
  sku: string;
  category: string;
  price: number;
}

export interface Users {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role:
    | "user"
    | "admin"
    | "instructor"
    | "coach"
    | "front_desk"
    | "coordinator"
    | "manager"
    | "CUSTOMER";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  joinDate: string;
  phone: string;
  avatarUrl: string;
  firstName: string;
  lastName: string;
  bookings: number;
  totalSpent: number;
  joinedAt: string;
}

// ============================================
// SCHEDULING (MODULE EXTENSION)
// Append-only additions for the Scheduling Module.
// ============================================

export const SchedulingBookingModeEnum = {
  SCHEDULED: "SCHEDULED",
  OPEN: "OPEN",
} as const;

export type SchedulingBookingMode =
  (typeof SchedulingBookingModeEnum)[keyof typeof SchedulingBookingModeEnum];

export const SchedulingServiceTypeEnum = {
  GYM_CLASS: "GYM_CLASS",
  COURT_BOOKING: "COURT_BOOKING",
  COACHING_SESSION: "COACHING_SESSION",
  OPEN_PLAY: "OPEN_PLAY",
  CAMP: "CAMP",
  PARTY_PACKAGE: "PARTY_PACKAGE",
  PRIVATE_HIRE: "PRIVATE_HIRE",
  WORKSHOP: "WORKSHOP",
  SWIM_CLASS: "SWIM_CLASS",
  FITNESS_ASSESSMENT: "FITNESS_ASSESSMENT",
} as const;

export type SchedulingServiceType =
  (typeof SchedulingServiceTypeEnum)[keyof typeof SchedulingServiceTypeEnum];

export type EventOccasion =
  | "BIRTHDAY"
  | "ACTIVITY_PARTY"
  | "SOCIAL_EVENT"
  | "ANNIVERSARY"
  | "CORPORATE"
  | "CHURCH_SCHOOL"
  | "OTHER";

export interface SchedulingOccasion {
  id: string;
  name: string;
  description: string;
  image: string;
}

export const SchedulingSlotStatusEnum = {
  SCHEDULED: "SCHEDULED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
  FULL: "FULL",
} as const;

export type SchedulingSlotStatus =
  (typeof SchedulingSlotStatusEnum)[keyof typeof SchedulingSlotStatusEnum];

export const SchedulingBookingStatusEnum = {
  PENDING: "PENDING",
  PENDING_APPROVAL: "PENDING_APPROVAL",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
  NO_SHOW: "NO_SHOW",
  WAITLISTED: "WAITLISTED",
} as const;

export type SchedulingBookingStatus =
  (typeof SchedulingBookingStatusEnum)[keyof typeof SchedulingBookingStatusEnum];

export const RecurFrequency = {
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  BIWEEKLY: "BIWEEKLY",
  MONTHLY: "MONTHLY",
} as const;

export type RecurFrequency =
  (typeof RecurFrequency)[keyof typeof RecurFrequency];

export const AddOnPricingType = {
  FLAT: "FLAT",
  PER_PERSON: "PER_PERSON",
  PER_HOUR: "PER_HOUR",
} as const;

export type AddOnPricingType =
  (typeof AddOnPricingType)[keyof typeof AddOnPricingType];

export const WaitlistStatus = {
  WAITING: "WAITING",
  NOTIFIED: "NOTIFIED",
  CONVERTED: "CONVERTED",
  EXPIRED: "EXPIRED",
  REMOVED: "REMOVED",
} as const;

export type WaitlistStatus =
  (typeof WaitlistStatus)[keyof typeof WaitlistStatus];

export type OpenPricingModel = "flat" | "per_hour" | "per_person";
export type CalendarView = "month" | "week" | "day" | "agenda";

export interface SchedulingCategory {
  id: string;
  name: string;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
  description?: string;
  requiresAttendee?: boolean;
  membersOnly?: boolean;
  freeInfantMonths?: number;
  depositPercent?: number;
  specialInstructionsEnabled?: boolean;
  waitlistEnabled?: boolean;
  allowFamilyMember?: boolean;
  requireCheckInBeforeRebook?: boolean;
  linkedAddOns?: CategoryAddOn[];
}

export interface CreateServiceCategoryPayload {
  name: string;
  icon?: string;
  displayOrder: string;
  isActive: boolean;
}

/** Catalog add-on offered on a scheduling service (consumer booking options). */
export interface SchedulingServiceAddOn {
  id: string;
  name: string;
  description?: string;
  price: number;
  pricingType: AddOnPricingType;
  isActive: boolean;
}

/** Optional link from a category or service to a catalog add-on (admin-configured). */
export type CategoryAddOnChargeFrequency =
  | "ONE_TIME"
  | "PER_DAY"
  | "PER_WEEK"
  | "PER_MONTH"
  | "PER_SEASON";

export const CATEGORY_ADD_ON_CHARGE_FREQUENCIES = [
  { value: "ONE_TIME", label: "One time" },
  { value: "PER_DAY", label: "Per day" },
  { value: "PER_WEEK", label: "Per week" },
  { value: "PER_MONTH", label: "Per month" },
  { value: "PER_SEASON", label: "Per season" },
] as const satisfies ReadonlyArray<{
  value: CategoryAddOnChargeFrequency;
  label: string;
}>;

/** Optional link from a category or service to a catalog add-on (admin-configured). */
export interface CategoryAddOn {
  id: string;
  /** Owner id: scheduling category id or service id. */
  categoryId: string;
  addOnId: string;
  addOnName?: string;
  isOptional: boolean;
  isFree: boolean;
  quantity?: number;
  unitPrice?: number;
  chargeFrequency?: CategoryAddOnChargeFrequency;
}

export interface SchedulingService {
  id: string;
  locationId: string | null;
  categoryId: string;
  category: SchedulingCategory;
  serviceType: SchedulingServiceType;
  bookingMode: SchedulingBookingMode;
  name: string;
  description: string | null;
  durationMinutes: number;
  capacity: number;
  basePrice: number;
  subscriptionPrice: number | null;
  requiresWaiver: boolean;
  /** Which waivers/documents must be signed when `requiresWaiver` is true. */
  requiredDocumentIds?: string[];
  ageMin: number | null;
  ageMax: number | null;
  isActive: boolean;
  minDurationMinutes: number | null;
  maxDurationMinutes: number | null;
  slotIncrementMinutes: number | null;
  maxConcurrent: number | null;
  minAdvanceHours: number | null;
  maxAdvanceHours: number | null;
  pricingModel: OpenPricingModel;
  imageUrl: string | null;
  tags: string[];
  /** Facility-style listing / detail. */
  rating?: number;
  reviewCount?: number;
  amenities?: string[];
  floor?: number;
  sport?: string;
  /** Class-style catalog. */
  level?: Class["level"];
  instructorId?: string;
  instructorName?: string;
  schedule?: { dayOfWeek: string; startTime: string; endTime: string }[];
  facilityName?: string;
  /** Event-style catalog. */
  organizer?: string;
  agenda?: { time: string; title?: string; description: string }[];
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  eventStatus?: Event["status"];
  maxAttendees?: number;
  registeredCount?: number;
  /** Optional add-ons available at checkout (catalog). */
  addOns?: SchedulingServiceAddOn[];
}

export interface SchedulingSlot {
  id: string;
  serviceId: string;
  service: SchedulingService;
  locationId: string;
  staffId: string | null;
  staffName: string | null;
  startAt: string;
  endAt: string;
  capacityOverride: number | null;
  priceOverride: number | null;
  bookedCount: number;
  effectiveCapacity: number;
  effectivePrice: number;
  status: SchedulingSlotStatus;
  isRecurring: boolean;
  notes: string | null;
}

export interface SchedulingBookingAddOn {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SchedulingBooking {
  id: string;
  bookingType: SchedulingServiceType;
  serviceSlotId: string | null;
  serviceSlot: SchedulingSlot | null;
  serviceId: string;
  service: SchedulingService;
  contactId: string;
  contactName: string;
  participantName: string | null;
  locationId: string;
  locationName: string;
  status: SchedulingBookingStatus;
  startAt: string | null;
  endAt: string | null;
  guestCount: number;
  totalAmount: number;
  balanceDue: number;
  checkedInAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  notes: string | null;
  source: "ONLINE" | "ADMIN" | "WALK_IN";
  addOns: SchedulingBookingAddOn[];
  createdAt: string;
}

export interface SchedulingWaitlistEntry {
  id: string;
  serviceSlotId: string;
  contactId: string;
  contactName: string;
  position: number;
  status: WaitlistStatus;
  notifiedAt: string | null;
  createdAt: string;
}

export interface AvailableWindow {
  startAt: string;
  endAt: string;
  spotsRemaining: number;
}

export interface AvailableWindowsResponse {
  date: string;
  serviceId: string;
  windows: AvailableWindow[];
  operatingHours: { open: string; close: string } | null;
}

export interface SlotFilters {
  serviceType?: SchedulingServiceType;
  status?: SchedulingSlotStatus;
  locationId?: string;
  staffId?: string;
  from?: string;
  to?: string;
  ageMin?: number;
  ageMax?: number;
  serviceId?: string;
}

export interface BookingFilters {
  status?: SchedulingBookingStatus;
  serviceType?: SchedulingServiceType;
  contactId?: string;
  from?: string;
  to?: string;
  serviceId?: string;
}

// ============================================
// CALENDAR & PRIVATE HIRE (MODULE EXTENSION)
// Append-only additions for calendar views and private hire inquiries.
// ============================================

export const PrivateHireStatusEnum = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type PrivateHireStatus =
  (typeof PrivateHireStatusEnum)[keyof typeof PrivateHireStatusEnum];

export const PrivateHireEventTypeEnum = {
  BIRTHDAY_PARTY: "BIRTHDAY_PARTY",
  CORPORATE: "CORPORATE",
  OTHER: "OTHER",
} as const;

export type PrivateHireEventType =
  (typeof PrivateHireEventTypeEnum)[keyof typeof PrivateHireEventTypeEnum];

/** One cell in the admin availability heatmap (hour × day). */
export interface AvailabilityCell {
  date: string;
  hour: number;
  totalSessions: number;
  bookedCount: number;
  capacityTotal: number;
  utilizationPct: number;
  slots: Pick<
    SchedulingSlot,
    | "id"
    | "service"
    | "staffName"
    | "bookedCount"
    | "effectiveCapacity"
    | "status"
    | "startAt"
    | "endAt"
  >[];
}

export interface PrivateHireInquiry {
  id: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  eventType: PrivateHireEventType;
  serviceId: string;
  service: SchedulingService;
  locationId: string;
  locationName: string;
  preferredDate: string;
  alternateDate: string | null;
  guestCount: number;
  notes: string | null;
  status: PrivateHireStatus;
  depositAmount: number | null;
  internalNotes: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface PrivateHireFilters {
  status?: PrivateHireStatus;
  locationId?: string;
  from?: string;
  to?: string;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflictingSlots: Pick<
    SchedulingSlot,
    "id" | "service" | "startAt" | "endAt" | "staffName"
  >[];
}

export interface CalendarFilters {
  locationId: string | null;
  serviceTypes: SchedulingServiceType[];
  staffId: string | null;
}

/** Applied when building utilisation cells so heatmap respects the same scope as the session grid. */
export type AvailabilityGridSlotFilter = Pick<
  CalendarFilters,
  "serviceTypes" | "staffId"
>;

// ============================================
// SHOP & INVENTORY (PAYMENTS EXTENSION)
// Append-only additions for saved cards and POS checkout.
// ============================================

export interface SavedPaymentMethod {
  id: string;
  tenantId: string;
  contactId: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  createdAt: string;
}

// ============================================
// REPORTS & ANALYTICS (MODULE EXTENSION)
// Append-only — KPI dashboard, revenue, cohorts, referrals, invoices UI.
// ============================================

export type DateRangePreset =
  | "today"
  | "this_week"
  | "this_month"
  | "last_30_days"
  | "last_3_months"
  | "custom";

export interface DateRange {
  from: string;
  to: string;
}

export interface KpiDashboard {
  netRevenue: number;
  netRevenuePrev: number;
  newContacts: number;
  newContactsPrev: number;
  activeMemberships: number;
  activeMembershipsPrev: number;
  sessionsCompleted: number;
  sessionsCompletedPrev: number;
  pendingPrivateHires: number;
}

export interface DailyRevenue {
  date: string;
  gross: number;
  refunds: number;
  net: number;
}

export interface MonthlyRevenue {
  month: string;
  gross: number;
  refunds: number;
  net: number;
}

export interface CategoryRevenue {
  category: string;
  total: number;
  percentage: number;
}

export interface GatewayRevenue {
  gateway: string;
  total: number;
  count: number;
}

export interface TopServiceRevenue {
  serviceId: string;
  serviceName: string;
  serviceType: SchedulingServiceType;
  bookingCount: number;
  totalRevenue: number;
  avgPerBooking: number;
}

export interface RevenueSummary {
  gross: number;
  refunds: number;
  net: number;
  avgTransactionValue: number;
  transactionCount: number;
  byCategory: CategoryRevenue[];
  byGateway: GatewayRevenue[];
  daily: DailyRevenue[];
  topServices: TopServiceRevenue[];
}

export interface PeriodComparison {
  current: number;
  previous: number;
  changePercent: number;
  changeDirection: "up" | "down" | "flat";
}

export interface AgeGroupDistribution {
  label: string;
  count: number;
}

export interface BookingChannelBreakdown {
  channel: string;
  count: number;
  percentage: number;
}

/** Analytics client insights (reports module) — distinct from legacy ClientInsights. */
export interface ReportClientInsights {
  newContacts: number;
  returningContacts: number;
  churnRate: number;
  avgLifetimeValue: number;
  ageGroups: AgeGroupDistribution[];
  bookingChannels: BookingChannelBreakdown[];
  newVsReturningDaily: { date: string; new: number; returning: number }[];
}

export interface TopContact {
  rank: number;
  contactId: string;
  contactName: string;
  totalSpend: number;
  bookingCount: number;
  lastBookingDate: string | null;
}

export interface CohortRow {
  cohortLabel: string;
  cohortMonth: string;
  startCount: number;
  retention: (number | null)[];
}

export interface CohortMatrix {
  rows: CohortRow[];
  maxMonths: number;
}

export interface ReferralSourceBreakdown {
  source: string;
  referrals: number;
  converted: number;
  conversionRate: number;
}

export interface TopReferrer {
  rank: number;
  contactId: string;
  contactName: string;
  referralsSent: number;
  converted: number;
  revenueAttributed: number;
  rewardsIssued: number;
}

export interface ReferralOverview {
  totalReferrals: number;
  converted: number;
  conversionRate: number;
  totalRewardValue: number;
  bySources: ReferralSourceBreakdown[];
  timeline: { date: string; referrals: number; conversions: number }[];
  topReferrers: TopReferrer[];
}

export interface PayrollEntry {
  staffId: string;
  staffName: string;
  role: string;
  regularHours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  totalPay: number;
}

export interface InstructorStats {
  staffId: string;
  staffName: string;
  classesInstructed: number;
  avgAttendancePct: number;
  revenueGenerated: number;
}

export const InvoiceStatusEnum = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  VOID: "VOID",
} as const;

export type InvoiceStatus =
  (typeof InvoiceStatusEnum)[keyof typeof InvoiceStatusEnum];

export interface InvoiceFilters {
  status?: InvoiceStatus;
  contactId?: string;
  from?: string;
  to?: string;
}

export interface ReportFilters {
  dateRange: DateRange;
  preset: DateRangePreset;
  locationIds: string[];
}

export interface Invoice {
  contactName?: string | null;
  contactEmail?: string | null;
  paidDate?: string | null;
  sentAt?: string | null;
}

export interface InvoiceLineItem {
  id?: string;
  total?: number;
}

// ============================================
// SCHEDULING (UI EXTENSIONS)
// ============================================

export interface SchedulingSlot {
  /** Draft/published toggle for session visibility. */
  isActive?: boolean;
  /** Number of check-ins recorded for this session. */
  checkInCount?: number;
}

export type EventVisibility = "PUBLIC" | "PRIVATE" | "SINGLE_HOST";

export interface SchedulingService {
  /** Public listing visibility for event-style services. */
  eventType?: EventVisibility;
  siblingPrice?: string;
  freeAdultCount?: number;
  additionalAdultPrice?: string;
  /** Max “No of passes” on customer booking; 1 hides +/- steppers. */
  maxPassCount?: number | null;
  minSeats?: number;
  pricePerHour?: string;
  minChildSeats?: number;
  maxChildSeats?: number;
  minAdultSeats?: number;
  maxAdultSeats?: number;
  additionalChildPrice?: string;
  isPackageService?: boolean;
  linkedAddOns?: CategoryAddOn[];
}

export interface SchedulingBooking {
  /** Consumer-provided special instructions captured during booking. */
  specialInstructions?: string | null;
  /** Selected event package when booking a package-only service. */
  eventPackageId?: string | null;
  /** Promo code applied at checkout (mock). */
  couponCode?: string | null;
  actedByStaffId?: string | null;
  actedByStaffName?: string | null;
  /** Child contact ids when category requires same-household participants. */
  participantChildIds?: string[];
  /** Logged-in primary guardian on open-play session bookings. */
  primaryGuardianContactId?: string | null;
  primaryGuardianName?: string | null;
  /** Optional second adult on open-play session bookings. */
  secondaryGuardianContactId?: string | null;
  secondaryGuardianName?: string | null;
  /** Adult contact id when category requires a responsible adult on the booking. */
  accompanyingAdultContactId?: string | null;
  accompanyingAdultName?: string | null;
}

export interface EventPackageAddOn {
  addOnId: string;
  included: boolean;
}

export interface EventPackage {
  id: string;
  serviceId: string;
  tier: "SILVER" | "GOLD" | "PLATINUM";
  name: string;
  basePrice: number;
  features: string[];
  addOns: EventPackageAddOn[];
  isActive: boolean;
  createdAt: string;
  /** Customer page(s) where this package is listed (admin placement). */
  displayPages?: Array<"gym" | "play" | "events">;
  /** Scheduling sub-category section(s), e.g. Play → Private Play. */
  schedulingCategoryIds?: string[];
  depositAmount?: number;
  depositNonRefundable?: boolean;
  isWholeVenue?: boolean;
  requiresApproval?: boolean;
  minChildSeats?: number;
  maxChildSeats?: number;
  minAdultSeats?: number;
  maxAdultSeats?: number;
  additionalChildPrice?: number;
  additionalAdultPrice?: number;
  duration?: number;
  setupTime?: number;
  staffCount?: number;
  partyRooms?: number;
}

// ============================================
// CAFE & FOOD MODULE
// ============================================

export type CafeCategory =
  | "Coffee"
  | "Hot Drinks"
  | "Cold Brew"
  | "Cold Drinks"
  | "Frozen Treats"
  | "Specialty"
  | "Pizza"
  | "Sandwiches"
  | "Kids Corner"
  | "Salads"
  | "Snacks"
  | "Salads & Snacks"
  | "Sweets"
  | "Pastries"
  | "Baked Food"
  | "Toasts";

export interface CafeModifier {
  id: string;
  name: string;
  priceDelta: number;
  isDefault: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  isRequired: boolean;
  maxSelect: number;
  modifiers: CafeModifier[];
}

export interface AttributeOption {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

export interface AttributeGroup {
  id: string;
  name: string;
  selectionType: "single" | "multiple";
  maxSelect?: number;
  isRequired: boolean;
  /** Shop-only: include this group when building stock variants. */
  isVariantDimension?: boolean;
  options: AttributeOption[];
  predefinedTemplate?: string;
}

export interface ShopProductVariant {
  id: string;
  sku: string;
  optionValueIdsByGroupId: Record<string, string>;
  optionLabelsByGroupId: Record<string, string>;
  stockCount: number;
  lowStockThreshold: number;
  isActive: boolean;
  priceOverride?: number;
  imageUrl?: string;
  allowBackorders?: boolean;
  weightKg?: number;
  dimensionsCm?: {
    length?: number;
    width?: number;
    height?: number;
  };
  description?: string;
}

export interface RotationGroup {
  id: string;
  name: string;
  period: "daily" | "monthly" | "seasonal";
  seasonalRange?: { start: string; end: string };
  pool: string[];
  activeProductId: string | null;
  nextProductId?: string;
  nextActivationAt?: string;
  manualOverride: { productId: string; setAt: string } | null;
}

export interface CafeProduct {
  id: string;
  name: string;
  sku?: string;
  subtype?: string;
  category: CafeCategory;
  basePrice: number;
  stockCount?: number;
  description?: string;
  notes?: string;
  printNotesOnTicket: boolean;
  preparationTimeMinutes?: number;
  isActive: boolean;
  isAvailable: boolean;
  availableDaysOfWeek: number[];
  rotatable: boolean;
  rotationGroupId?: string;
  isActiveInRotation?: boolean;
  modifierGroupIds: string[];
  attributeGroups: Record<string, string[]>;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/** Pickup slot row for order-ahead UI (mock-backed until API exists). */
export interface CafePickupSlot {
  timeIso: string;
  available: boolean;
  label: string;
}

export type CafeKitchenColumn = "NEW" | "PREPARING" | "READY";

export interface CafeKitchenOrderItem {
  name: string;
  modifierSummary: string;
  preparationTimeMinutes?: number;
}

export interface CafeKitchenOrder {
  id: string;
  orderNumber: string;
  channel: "POS" | "TAKEOUT" | "DELIVERY";
  receivedAt: string;
  items: CafeKitchenOrderItem[];
  status: CafeKitchenColumn;
  scheduledFor?: string | null;
  deliveryAddress?: string | null;
  cateringEventName?: string | null;
}
