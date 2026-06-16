import { clsx, type ClassValue } from 'clsx'
import { differenceInYears, format, isAfter, isBefore, isEqual, parseISO } from 'date-fns'
import { twMerge } from 'tailwind-merge'
import { z } from 'zod'

import type {
  AddOn,
  OpenPricingModel,
  StockStatus,
  Product,
  Order,
  CartItem,
  SchedulingBookingAddOn,
  SchedulingService,
  SchedulingServiceAddOn,
  SchedulingSlot,
  AvailableWindow,
  AvailabilityCell,
  PrivateHireEventType,
  PrivateHireStatus,
  DateRange,
  Invoice,
  PeriodComparison,
} from './types'
import { InvoiceStatusEnum } from './types'
import { PrivateHireEventTypeEnum } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================
// INVENTORY & SHOP HELPERS
// ============================================

export function getStockStatus(
  p: Pick<Product, 'stockCount' | 'lowStockThreshold' | 'allowBackorders' | 'trackInventory'>,
): StockStatus {
  if (p.trackInventory === false) return 'IN_STOCK'
  if (p.stockCount <= 0 && p.allowBackorders) return 'BACKORDER'
  if (p.stockCount <= 0) return 'OUT_OF_STOCK'
  if (p.stockCount <= p.lowStockThreshold) return 'LOW_STOCK'
  return 'IN_STOCK'
}

export function getStockStatusLabel(status: StockStatus): string {
  const map: Record<StockStatus, string> = {
    IN_STOCK: 'In Stock',
    LOW_STOCK: 'Low Stock',
    OUT_OF_STOCK: 'Out of Stock',
    BACKORDER: 'Backorder',
  }
  return map[status]
}

export function getStockStatusColor(
  status: StockStatus,
): 'green' | 'amber' | 'red' | 'blue' {
  const map: Record<StockStatus, 'green' | 'amber' | 'red' | 'blue'> = {
    IN_STOCK: 'green',
    LOW_STOCK: 'amber',
    OUT_OF_STOCK: 'red',
    BACKORDER: 'blue',
  }
  return map[status]
}

export function calcCartTotals(
  items: CartItem[],
  couponDiscount: number,
  taxRate = 20,
): { subtotal: number; tax: number; total: number } {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const afterDiscount = Math.max(0, subtotal - couponDiscount)
  const tax = Math.round(((afterDiscount * taxRate) / 100) * 100) / 100
  const total = Math.round((afterDiscount + tax) * 100) / 100
  return { subtotal, tax, total }
}

export function formatOrderNumber(orderNumber: string): string {
  return orderNumber
}

export function getLowStockProducts(products: Product[]): Product[] {
  return products.filter((p) => {
    const status = getStockStatus(p)
    return status === 'LOW_STOCK' || status === 'OUT_OF_STOCK'
  })
}

export function getOrderChannelColor(
  channel: Order['channel'],
): 'blue' | 'green' | 'amber' {
  const map: Record<Order['channel'], 'blue' | 'green' | 'amber'> = {
    ONLINE: 'blue',
    POS: 'green',
  }
  return map[channel]
}

export function formatSlotDate(isoString: string): string {
  return format(parseISO(isoString), 'EEE d MMM')
}

export function formatSlotTime(isoString: string): string {
  return format(parseISO(isoString), 'h:mm a')
}

/**
 * PER_HOUR slot button label — start time with AM/PM.
 * Hourly increment: 9 AM, 10 AM, 11 AM, 12 PM, 1 PM, …
 * Half-hourly increment: 9 AM, 9:30 AM, 10 AM, 10:30 AM, …
 */
export function formatAvailabilitySlotStartLabel(
  isoString: string,
  incrementMinutes: number | null,
): string {
  const date = parseISO(isoString)
  const minutes = date.getMinutes()

  if (incrementMinutes === 30) {
    if (minutes === 0) {
      return format(date, 'h a')
    }
    return format(date, 'h:mm a')
  }

  if (incrementMinutes === 60) {
    return format(date, 'h a')
  }

  if (minutes === 0) {
    return format(date, 'h a')
  }
  return format(date, 'h:mm a')
}

/** Customer availability slot label — full session range when increment is none. */
export function formatAvailabilityWindowLabel(
  window: Pick<AvailableWindow, 'startAt' | 'endAt'>,
  incrementMinutes: number | null,
): string {
  if (incrementMinutes == null) {
    return formatSlotTimeRange(window.startAt, window.endAt)
  }
  return formatAvailabilitySlotStartLabel(window.startAt, incrementMinutes)
}

export function formatSlotTimeRange(startAt: string, endAt: string): string {
  return `${formatSlotTime(startAt)} – ${formatSlotTime(endAt)}`
}

/** Compare booking windows by instant — avoids ISO string formatting mismatches. */
export function areAvailableWindowsEqual(
  left: Pick<AvailableWindow, 'startAt' | 'endAt'> | null | undefined,
  right: Pick<AvailableWindow, 'startAt' | 'endAt'> | null | undefined,
): boolean {
  if (left == null || right == null) {
    return false
  }
  return (
    new Date(left.startAt).getTime() === new Date(right.startAt).getTime() &&
    new Date(left.endAt).getTime() === new Date(right.endAt).getTime()
  )
}

export function formatDuration(startAt: string, endAt: string): string {
  const mins =
    (parseISO(endAt).getTime() - parseISO(startAt).getTime()) / 60_000

  if (mins < 60) return `${mins} min`

  const hours = mins / 60
  if (hours === Math.floor(hours)) return `${hours}h`

  const h = Math.floor(hours)
  const m = mins % 60
  return `${h}h ${m}min`
}

export function formatDurationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`

  const hours = minutes / 60
  if (hours === Math.floor(hours)) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }

  const h = Math.floor(hours)
  const m = minutes % 60
  return `${h}h ${m}min`
}

export function generateDurationOptions(
  min: number,
  max: number,
  increment: number,
): number[] {
  const opts: number[] = []
  for (let m = min; m <= max; m += increment) opts.push(m)
  return opts
}

export function calculateOpenPrice(
  basePrice: number,
  pricingModel: OpenPricingModel,
  startAt: string,
  endAt: string,
  guestCount: number,
): number {
  if (guestCount <= 0) {
    return 0
  }

  const durationHours =
    (parseISO(endAt).getTime() - parseISO(startAt).getTime()) / 3_600_000

  switch (pricingModel) {
    case 'per_hour':
      return Math.round(basePrice * durationHours * 100) / 100
    case 'per_person':
      return Math.round(basePrice * guestCount * 100) / 100
    default:
      return Math.round(basePrice * guestCount * 100) / 100
  }
}

export function formatPrice(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
    amount,
  )
}

export function getAgeRangeLabel(
  ageMin: number | null,
  ageMax: number | null,
): string {
  if (!ageMin && !ageMax) return 'All ages'
  if (!ageMax) return `${ageMin}+`
  if (!ageMin) return `Up to ${ageMax}`
  return `Ages ${ageMin}–${ageMax}`
}

/** Map legacy booking `AddOn` rows into scheduling checkout add-on shape (admin catalog pickers). */
export function bookingAddOnToSchedulingAddOn(a: AddOn): SchedulingServiceAddOn {
  return {
    id: a.id,
    name: a.name,
    description: a.description,
    price: a.price,
    pricingType: a.pricingType === 'PER_PERSON' ? 'PER_PERSON' : 'FLAT',
    isActive: a.isActive,
  }
}

/** Strip simple HTML tags for plain-text descriptions (e.g. product → add-on). */
export function plainTextFromHtml(html: string | undefined): string | undefined {
  if (!html?.trim()) return undefined
  const t = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return t.length > 0 ? t : undefined
}

/** Line total for a catalog add-on given quantity, guests, and duration (hours). */
export function lineTotalForServiceAddOn(
  addOn: SchedulingServiceAddOn,
  quantity: number,
  guestCount: number,
  durationHours: number,
): number {
  if (quantity <= 0) return 0
  switch (addOn.pricingType) {
    case 'FLAT':
      return addOn.price * quantity
    case 'PER_PERSON':
      return addOn.price * guestCount * quantity
    case 'PER_HOUR':
      return addOn.price * durationHours * quantity
    default:
      return addOn.price * quantity
  }
}

/** Sum selected catalog add-ons into a booking-ready total. */
export function totalForSelectedServiceAddOns(
  catalog: SchedulingServiceAddOn[] | undefined,
  quantities: Record<string, number>,
  guestCount: number,
  durationHours: number,
): number {
  if (!catalog?.length) return 0
  let total = 0
  for (const ao of catalog) {
    if (!ao.isActive) continue
    const q = quantities[ao.id] ?? 0
    total += lineTotalForServiceAddOn(ao, q, guestCount, durationHours)
  }
  return Math.round(total * 100) / 100
}

/** Build line items for confirmed scheduling bookings from catalog selections. */
export function toSchedulingBookingAddOnLines(
  catalog: SchedulingServiceAddOn[] | undefined,
  quantities: Record<string, number>,
  guestCount: number,
  durationHours: number,
): SchedulingBookingAddOn[] {
  if (!catalog?.length) return []
  const lines: SchedulingBookingAddOn[] = []
  for (const ao of catalog) {
    if (!ao.isActive) continue
    const quantity = quantities[ao.id] ?? 0
    if (quantity <= 0) continue
    const totalPrice = lineTotalForServiceAddOn(ao, quantity, guestCount, durationHours)
    const unitPrice = quantity > 0 ? Math.round((totalPrice / quantity) * 100) / 100 : 0
    lines.push({
      id: ao.id,
      name: ao.name,
      quantity,
      unitPrice,
      totalPrice,
    })
  }
  return lines
}

/** Base session price before add-ons (open windows, scheduled slots, guest multiplier). */
export function computeSchedulingBaseTotal(
  service: SchedulingService,
  slot: SchedulingSlot | undefined,
  guestCount: number,
  window: AvailableWindow | null | undefined,
  durationMinutes: number | undefined,
): number {
  if (guestCount <= 0) {
    return 0
  }

  if (slot) {
    const perHead =
      service.pricingModel === 'per_person'
        ? service.basePrice
        : slot.effectivePrice
    return Math.round(perHead * guestCount * 100) / 100
  }
  if (window) {
    const endAt =
      service.pricingModel === 'per_hour' && durationMinutes && durationMinutes > 0
        ? new Date(
            new Date(window.startAt).getTime() + durationMinutes * 60_000,
          ).toISOString()
        : window.endAt
    return calculateOpenPrice(
      service.basePrice,
      service.pricingModel,
      window.startAt,
      endAt,
      guestCount,
    )
  }
  const mul = service.pricingModel === 'per_person' ? guestCount : 1
  return Math.round(service.basePrice * mul * 100) / 100
}

export function getAvailabilityLabel(slot: SchedulingSlot): {
  label: string
  color: 'green' | 'amber' | 'red' | 'purple'
} {
  if (slot.status === 'FULL' || slot.status === 'CANCELLED') {
    return { label: 'Full', color: 'red' }
  }

  const remaining = Math.max(0, slot.effectiveCapacity - slot.bookedCount)
  const pct =
    slot.effectiveCapacity > 0 ? slot.bookedCount / slot.effectiveCapacity : 1

  if (pct >= 0.8) {
    return { label: `${remaining} left`, color: 'amber' }
  }

  return { label: `${remaining} spots`, color: 'green' }
}

// ============================================
// CLIENT MANAGEMENT HELPERS
// ============================================

import type {
  CmCreditPackPurchase,
  CmDocumentSignature,
  ContactSubscription,
  SubscriptionStatus,
} from './types'

export function getContactInitials(
  firstName: string | undefined,
  lastName: string | undefined,
): string {
  const first = (firstName ?? '').trim()
  const last = (lastName ?? '').trim()
  if (!first && !last) return ''
  const firstInitial = first.charAt(0).toUpperCase()
  const lastInitial = last.charAt(0).toUpperCase()
  return `${firstInitial}${lastInitial || ''}`
}

export function getContactAge(dateOfBirth: string | undefined): number | null {
  if (!dateOfBirth) return null
  const dob = parseISO(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return null
  const now = new Date()
  const age = differenceInYears(now, dob)
  return age >= 0 ? age : null
}

export function getContactAgeSuffix(dateOfBirth: string | undefined): string {
  const age = getContactAge(dateOfBirth)
  if (age === null) return ''
  return ` (${age}y)`
}

export function getSubscriptionStatusColor(
  status: SubscriptionStatus,
): 'green' | 'amber' | 'red' | 'slate' {
  switch (status) {
    case 'ACTIVE':
    case 'TRIALING':
      return 'green'
    case 'PAUSED':
      return 'slate'
    case 'PAST_DUE':
      return 'amber'
    case 'CANCELLED':
    case 'EXPIRED':
    default:
      return 'red'
  }
}

export function isPackExpiringSoon(
  pack: CmCreditPackPurchase,
  thresholdDays = 7,
): boolean {
  const expiresAtDate = parseISO(pack.expiresAt)
  if (Number.isNaN(expiresAtDate.getTime())) return false
  const now = new Date()
  const thresholdDate = new Date(
    now.getTime() + thresholdDays * 24 * 60 * 60 * 1000,
  )
  return isAfter(expiresAtDate, now) && isBefore(expiresAtDate, thresholdDate)
}

export function getPackProgressPct(pack: CmCreditPackPurchase): number {
  if (pack.creditsPurchased <= 0) return 0
  const used = pack.creditsPurchased - pack.creditsRemaining
  const pct = (used / pack.creditsPurchased) * 100
  if (!Number.isFinite(pct) || pct < 0) return 0
  if (pct > 100) return 100
  return Math.round(pct)
}

export function isDocumentSignedAndValid(
  signatures: CmDocumentSignature[] | undefined,
  documentId: string,
  now: Date = new Date(),
): boolean {
  if (!signatures?.length) return false
  const relevant = signatures.find((sig) => sig.documentId === documentId)
  if (!relevant) return false
  if (!relevant.expiresAt) return true
  const expiry = parseISO(relevant.expiresAt)
  if (Number.isNaN(expiry.getTime())) return false
  return isAfter(expiry, now) || expiry.getTime() === now.getTime()
}

// ============================================
// CALENDAR & PRIVATE HIRE HELPERS
// ============================================

/** Tailwind background class for heatmap cells (semantic scale). */
export function getHeatmapColor(utilizationPct: number): string {
  if (utilizationPct === 0) return 'bg-muted/40'
  if (utilizationPct <= 30) return 'bg-green-500/25'
  if (utilizationPct <= 60) return 'bg-green-500/45'
  if (utilizationPct <= 90) return 'bg-amber-500/40'
  return 'bg-destructive/50'
}

/** Text class that contrasts with heatmap cell background. */
export function getHeatmapTextColor(utilizationPct: number): string {
  if (utilizationPct === 0) return 'text-muted-foreground'
  if (utilizationPct <= 30) return 'text-green-900 dark:text-green-100'
  if (utilizationPct <= 60) return 'text-foreground'
  if (utilizationPct <= 90) return 'text-foreground'
  return 'text-destructive-foreground'
}

export function formatHeatmapTooltip(cell: AvailabilityCell): string {
  if (cell.totalSessions === 0) return 'No sessions'
  const plural = cell.totalSessions !== 1 ? 's' : ''
  return `${cell.totalSessions} session${plural}, ${cell.utilizationPct}% booked`
}

export function getPrivateHireStatusColor(
  status: PrivateHireStatus,
): 'amber' | 'green' | 'red' {
  const map: Record<PrivateHireStatus, 'amber' | 'green' | 'red'> = {
    PENDING: 'amber',
    APPROVED: 'green',
    REJECTED: 'red',
  }
  return map[status]
}

export function formatPrivateHireEventType(type: PrivateHireEventType): string {
  const labels: Record<PrivateHireEventType, string> = {
    BIRTHDAY_PARTY: 'Birthday Party',
    CORPORATE: 'Corporate Event',
    OTHER: 'Other',
  }
  return labels[type]
}

export const privateHireInquirySchema = z.object({
  eventType: z.nativeEnum(PrivateHireEventTypeEnum),
  serviceId: z.string().min(1, 'Select a service'),
  locationId: z.string().min(1, 'Select a location'),
  preferredDate: z.string().min(1, 'Select a preferred date'),
  alternateDate: z.string().optional(),
  guestCount: z.number().int().min(1, 'At least 1 guest required'),
  notes: z.string().max(1000).optional(),
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(7, 'Valid phone required'),
  agreedToTerms: z.boolean().refine((v) => v === true, {
    message: 'You must agree to the terms',
  }),
})

export type PrivateHireInquiryFormValues = z.infer<typeof privateHireInquirySchema>

// ============================================
// REPORTS & ANALYTICS HELPERS
// ============================================

export function calcPeriodComparison(
  current: number,
  previous: number,
): PeriodComparison {
  const changePercent =
    previous === 0 ? 0 : Math.round(((current - previous) / previous) * 1000) / 10
  return {
    current,
    previous,
    changePercent: Math.abs(changePercent),
    changeDirection: changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'flat',
  }
}

type DateKeyed = { date?: string; createdAt?: string }

export function filterByDateRange<T extends DateKeyed>(
  items: T[],
  range: DateRange,
  dateField: 'date' | 'createdAt' = 'date',
): T[] {
  return items.filter((item) => {
    const raw = dateField === 'date' ? item.date : item.createdAt
    if (!raw) return false
    const d = parseISO(raw.split('T')[0] ?? raw)
    const from = parseISO(range.from)
    const to = parseISO(range.to)
    return (isAfter(d, from) || isEqual(d, from)) && (isBefore(d, to) || isEqual(d, to))
  })
}

export function formatDateRangeLabel(range: DateRange): string {
  return `${format(parseISO(range.from), 'd MMM yyyy')} – ${format(parseISO(range.to), 'd MMM yyyy')}`
}

export function getInvoiceStatusColor(
  status: Invoice['status'],
): 'slate' | 'blue' | 'green' | 'red' | 'amber' {
  const map: Record<Invoice['status'], 'slate' | 'blue' | 'green' | 'red' | 'amber'> = {
    DRAFT: 'slate',
    SENT: 'blue',
    PAID: 'green',
    OVERDUE: 'red',
    CANCELLED: 'amber',
    VOID: 'amber',
  }
  return map[status]
}

export function isInvoiceOverdue(invoice: Pick<Invoice, 'dueDate' | 'status'>): boolean {
  if (invoice.status === InvoiceStatusEnum.PAID || invoice.status === InvoiceStatusEnum.VOID) {
    return false
  }
  if (invoice.status === 'CANCELLED') return false
  return isBefore(parseISO(invoice.dueDate), new Date())
}

export function calcInvoiceTotals(
  lineItems: { quantity: number; unitPrice: number }[],
  discount: number,
  taxRate: number,
): { subtotal: number; taxAmount: number; total: number } {
  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0)
  const afterDiscount = Math.max(0, subtotal - discount)
  const taxAmount = Math.round(((afterDiscount * taxRate) / 100) * 100) / 100
  const total = Math.round((afterDiscount + taxAmount) * 100) / 100
  return { subtotal, taxAmount, total }
}

/** Recharts stroke/fill — values required by Recharts (not Tailwind). */
export const CHART_COLORS = {
  primary: 'oklch(0.35 0.08 250)',
  accent: 'oklch(0.65 0.2 25)',
  success: 'oklch(0.65 0.18 145)',
  warning: 'oklch(0.75 0.15 85)',
  muted: 'oklch(0.65 0.02 250)',
  purple: 'oklch(0.55 0.2 290)',
  teal: 'oklch(0.6 0.12 195)',
  categories: [
    'oklch(0.35 0.08 250)',
    'oklch(0.65 0.2 25)',
    'oklch(0.65 0.18 145)',
    'oklch(0.75 0.15 85)',
    'oklch(0.55 0.2 290)',
    'oklch(0.6 0.12 195)',
  ],
} as const

export function getCohortCellColor(pct: number | null): string {
  if (pct === null) return 'bg-muted/30'
  if (pct >= 80) return 'bg-green-600'
  if (pct >= 60) return 'bg-green-400'
  if (pct >= 40) return 'bg-amber-400'
  if (pct >= 20) return 'bg-orange-500'
  return 'bg-destructive'
}

export function getCohortCellTextColor(pct: number | null): string {
  if (pct === null) return 'text-muted-foreground'
  if (pct >= 60) return 'text-primary-foreground'
  return 'text-foreground'
}

