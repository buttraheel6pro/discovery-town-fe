/** Rentals catalog rows for We Bring Play To You (off-site play equipment). */

import type { WeBringPlayOffering } from '@/lib/we-bring-play-offerings'
import { WE_BRING_PLAY_OFFERINGS } from '@/lib/we-bring-play-offerings'
import type { Product, RentalProductFulfillment } from '@/lib/types'

export const WE_BRING_PLAY_RENTAL_CATEGORY_ID = 'pcat-we-bring-party' as const

const TENANT_ID = 'tenant-1'
const NOW_ISO = '2024-01-01T00:00:00Z'

function rentalFulfillmentForOffering(
  offering: WeBringPlayOffering,
): RentalProductFulfillment {
  if (offering.tags.includes('entertainers')) {
    return 'DELIVERY_REQUIRED+STAFF'
  }
  if (
    offering.tags.includes('interactive-games') ||
    offering.tags.includes('dance-floor') ||
    offering.tags.includes('av')
  ) {
    return 'DELIVERY_REQUIRED+STAFF'
  }
  return 'DELIVERY_REQUIRED'
}

function requiresStaffForOffering(offering: WeBringPlayOffering): boolean {
  return (
    offering.tags.includes('entertainers') ||
    offering.tags.includes('interactive-games') ||
    offering.tags.includes('dance-floor') ||
    offering.tags.includes('av')
  )
}

function setupMinutesForOffering(offering: WeBringPlayOffering): number {
  if (offering.tags.includes('inflatables') || offering.tags.includes('party-setup')) {
    return 120
  }
  if (offering.tags.includes('train')) {
    return 90
  }
  if (offering.tags.includes('balloons')) {
    return 45
  }
  return 60
}

/** Build a rentals-menu product with the same fields as other rental inventory rows. */
export function buildWeBringPlayRentalProduct(offering: WeBringPlayOffering): Product {
  const slug = offering.productId.replace(/^prod-/, '')
  const sku = `RENT-WB-${slug.toUpperCase().replace(/-/g, '_')}`
  const rentalPricePerDay = Math.round(offering.basePrice * 0.55)
  const rentalPricePerHalfDay = Math.round(offering.basePrice * 0.38)
  const requiresStaff = requiresStaffForOffering(offering)

  return {
    id: offering.productId,
    tenantId: TENANT_ID,
    categoryId: WE_BRING_PLAY_RENTAL_CATEGORY_ID,
    name: offering.name,
    slug,
    description: offering.description,
    sku,
    price: offering.basePrice,
    memberPrice: offering.basePrice,
    stockCount: 8,
    lowStockThreshold: 2,
    allowBackorders: true,
    imageUrl: offering.imageUrl,
    isRental: true,
    rentalPricePerDay,
    rentalPricePerHalfDay,
    requiresDelivery: true,
    requiresStaff,
    setupMinutes: setupMinutesForOffering(offering),
    maxRentalDays: 7,
    fulfillment: rentalFulfillmentForOffering(offering),
    rentalBillingType: 'PER_DAY',
    depositAmount: Math.round(offering.basePrice * 0.25),
    isActive: true,
    availableOnline: true,
    isFeatured: offering.tags.includes('inflatables'),
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  }
}

/** Lazy build avoids circular init with mock-data during module evaluation. */
export function buildWeBringPlayRentalProducts(): Product[] {
  return WE_BRING_PLAY_OFFERINGS.map(buildWeBringPlayRentalProduct)
}
