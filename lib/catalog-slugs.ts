/** Stable catalog slugs for admin menus, placement, and product editor routing. */

import {
  getSchedulingTopLevelId,
  type SchedulingTopLevelId,
} from '@/lib/scheduling-consumer-categories'

export type SchedulingCatalogSlug = 'gym' | 'play' | 'events'
export type ProductCatalogSlug = 'shop' | 'gifts' | 'rentals' | 'cafe-food'
export type CatalogSlug = SchedulingCatalogSlug | ProductCatalogSlug

export type ProductEditorSlug = ProductCatalogSlug

export const SCHEDULING_CATALOG_SLUGS: readonly SchedulingCatalogSlug[] = [
  'gym',
  'play',
  'events',
] as const

export const PRODUCT_CATALOG_SLUGS: readonly ProductCatalogSlug[] = [
  'cafe-food',
  'gifts',
  'rentals',
  'shop',
] as const

export const CATALOG_MENU_ORDER: readonly {
  readonly slug: CatalogSlug
  readonly label: string
  readonly kind: 'scheduling' | 'product'
}[] = [
  { slug: 'gym', label: 'Gym', kind: 'scheduling' },
  { slug: 'play', label: 'Play', kind: 'scheduling' },
  { slug: 'events', label: 'Events', kind: 'scheduling' },
  { slug: 'cafe-food', label: 'Cafe & Food', kind: 'product' },
  { slug: 'gifts', label: 'Gifts', kind: 'product' },
  { slug: 'rentals', label: 'Rentals', kind: 'product' },
  { slug: 'shop', label: 'Shop', kind: 'product' },
] as const

const SCHEDULING_TOP_TO_SLUG: Record<SchedulingTopLevelId, SchedulingCatalogSlug> = {
  GYM: 'gym',
  PLAY: 'play',
  EVENT: 'events',
}

const SLUG_TO_SCHEDULING_TOP: Record<SchedulingCatalogSlug, SchedulingTopLevelId> = {
  gym: 'GYM',
  play: 'PLAY',
  events: 'EVENT',
}

const PRODUCT_TYPE_TO_SLUG: Record<string, ProductCatalogSlug> = {
  shop: 'shop',
  gifts: 'gifts',
  rentals: 'rentals',
  'cafe&food': 'cafe-food',
  'cafe-food': 'cafe-food',
}

const SLUG_TO_PRODUCT_TYPE: Record<ProductCatalogSlug, string> = {
  shop: 'shop',
  gifts: 'gifts',
  rentals: 'rentals',
  'cafe-food': 'cafe&food',
}

/** Normalize arbitrary strings to a known catalog slug, or null. */
export function normalizeCatalogSlug(value: string | undefined | null): CatalogSlug | null {
  const raw = (value ?? '').trim().toLowerCase()
  if (!raw) return null
  if (raw === 'event') return 'events'
  if (raw === 'cafe' || raw === 'cafe&food' || raw === 'cafe-food') return 'cafe-food'
  if (
    raw === 'gym' ||
    raw === 'play' ||
    raw === 'events' ||
    raw === 'shop' ||
    raw === 'gifts' ||
    raw === 'rentals'
  ) {
    return raw as CatalogSlug
  }
  return null
}

export function catalogSlugFromSchedulingCategoryId(categoryId: string): SchedulingCatalogSlug {
  const top = getSchedulingTopLevelId(categoryId)
  return SCHEDULING_TOP_TO_SLUG[top]
}

export function catalogSlugToSchedulingTopLevel(
  slug: SchedulingCatalogSlug,
): SchedulingTopLevelId {
  return SLUG_TO_SCHEDULING_TOP[slug]
}

export function catalogSlugFromProductType(productType: string | undefined | null): ProductCatalogSlug {
  const normalized = normalizeCatalogSlug(productType)
  if (normalized && isProductCatalogSlug(normalized)) {
    return normalized
  }
  const key = (productType ?? '').trim().toLowerCase()
  return PRODUCT_TYPE_TO_SLUG[key] ?? 'shop'
}

export function catalogSlugToProductType(slug: ProductCatalogSlug): string {
  return SLUG_TO_PRODUCT_TYPE[slug]
}

export function isSchedulingCatalogSlug(slug: CatalogSlug): slug is SchedulingCatalogSlug {
  return SCHEDULING_CATALOG_SLUGS.includes(slug as SchedulingCatalogSlug)
}

export function isProductCatalogSlug(slug: CatalogSlug): slug is ProductCatalogSlug {
  return PRODUCT_CATALOG_SLUGS.includes(slug as ProductCatalogSlug)
}

export function getCatalogMenuLabel(slug: CatalogSlug): string {
  const row = CATALOG_MENU_ORDER.find((entry) => entry.slug === slug)
  return row?.label ?? slug
}

export function storeSlugFromCatalogSlug(slug: CatalogSlug): string {
  if (slug === 'cafe-food') return 'cafe-food'
  return slug
}
