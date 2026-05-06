/** Shared cafe helpers — modifier UI rules, cart summaries, availability filtering. */

import type {
  AttributeGroup,
  AttributeOption,
  CafeCategory,
  CafeProduct,
  CartItem,
  CartModifierSelection,
  ModifierGroup,
  Product,
  ProductCategory,
} from '@/lib/types'

/** URL segment → canonical cafe category label. */
export const CAFE_CATEGORY_BY_SLUG: Record<string, CafeCategory> = {
  coffee: 'Coffee',
  'cold-drinks': 'Cold Drinks',
  specialty: 'Specialty',
  pizza: 'Pizza',
  sandwiches: 'Sandwiches',
  'kids-corner': 'Kids Corner',
  'salads-snacks': 'Salads & Snacks',
  sweets: 'Sweets',
  pastries: 'Pastries',
}

export function cafeCategoryToSlug(category: CafeCategory): string {
  const entry = Object.entries(CAFE_CATEGORY_BY_SLUG).find(([, v]) => v === category)
  return entry?.[0] ?? 'coffee'
}

export function slugToCafeCategory(slug: string): CafeCategory | null {
  return CAFE_CATEGORY_BY_SLUG[slug] ?? null
}

export type ModifierSelectionUi = 'radio' | 'checkbox'

/** Derives consumer/POS control type from maxSelect (1 = radio, >1 = checkboxes). */
export function getModifierSelectionType(maxSelect: number): ModifierSelectionUi {
  return maxSelect <= 1 ? 'radio' : 'checkbox'
}

/** Joins modifier selections for cart and kitchen summaries. */
export function formatModifierSummary(
  selected: CartItem['selectedModifiers'] | undefined,
): string {
  if (!selected?.length) return ''
  return selected.map((row) => row.modifierName).join(' · ')
}

/** Max prep minutes across cart lines that declare preparationTimeMinutes. */
export function getMaxPrepTime(items: CartItem[]): number {
  let max = 0
  for (const item of items) {
    const meta = item.metadata
    const fromMeta =
      meta && typeof meta === 'object' && 'preparationTimeMinutes' in meta
        ? Number((meta as { preparationTimeMinutes?: unknown }).preparationTimeMinutes)
        : Number.NaN
    const n = Number.isFinite(fromMeta)
      ? fromMeta
      : (item.preparationTimeMinutes ?? 0)
    if (Number.isFinite(n) && n > max) max = n
  }
  return max
}

export interface FilterCafeProductsResult {
  /** Shown in listing (not sold-out-only rows). */
  visible: CafeProduct[]
  /** Product ids that fail day-of-week or rotation visibility rules. */
  hiddenIds: string[]
  /** Products rendered in sold-out state (subset of consumer-visible). */
  soldOut: CafeProduct[]
}

/**
 * Applies consumer listing rules: hide wrong day / inactive rotation;
 * sold-out still renders when otherwise eligible.
 */
export function filterCafeProducts(
  products: CafeProduct[],
  todayDayIndex: number,
): FilterCafeProductsResult {
  const hiddenIds: string[] = []
  const visible: CafeProduct[] = []
  const soldOut: CafeProduct[] = []

  for (const product of products) {
    if (product.isActive === false) {
      hiddenIds.push(product.id)
      continue
    }
    const days = product.availableDaysOfWeek ?? []
    if (days.length > 0 && !days.includes(todayDayIndex)) {
      hiddenIds.push(product.id)
      continue
    }
    if (product.rotatable && product.isActiveInRotation === false) {
      hiddenIds.push(product.id)
      continue
    }
    if (!product.isAvailable) {
      soldOut.push(product)
      continue
    }
    visible.push(product)
  }

  return { visible, hiddenIds, soldOut }
}

/** ASAP label uses max prep with a 15-minute floor. */
export function formatAsapPrepLabel(maxPrepMinutes: number): string {
  const n = Math.max(15, maxPrepMinutes)
  return `ASAP (~${n} min)`
}

/** Ordered modifier groups attached to a cafe product (by modifierGroupIds). */
export function modifierGroupsForProduct(
  product: CafeProduct,
  all: ModifierGroup[],
): ModifierGroup[] {
  const map = new Map(all.map((g) => [g.id, g]))
  return product.modifierGroupIds.map((id) => map.get(id)).filter(Boolean) as ModifierGroup[]
}

/** Initial modifier selections from defaults (radio one / checkbox many). */
export function defaultModifierSelections(groups: ModifierGroup[]): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const g of groups) {
    const defaults = g.modifiers.filter((m) => m.isDefault).map((m) => m.id)
    if (g.maxSelect <= 1) {
      const first = defaults[0] ?? g.modifiers[0]?.id
      out[g.id] = first ? [first] : []
    } else {
      out[g.id] = defaults
    }
  }
  return out
}

export function modifiersSatisfied(
  groups: ModifierGroup[],
  selectedByGroup: Record<string, string[]>,
): boolean {
  for (const g of groups) {
    if (!g.isRequired) continue
    const n = (selectedByGroup[g.id] ?? []).length
    if (n === 0) return false
  }
  return true
}

export function sumModifierDeltaForGroups(
  groups: ModifierGroup[],
  selectedByGroup: Record<string, string[]>,
): number {
  let sum = 0
  for (const g of groups) {
    const ids = selectedByGroup[g.id] ?? []
    for (const id of ids) {
      const mod = g.modifiers.find((m) => m.id === id)
      if (mod) sum += mod.priceDelta
    }
  }
  return sum
}

export function toCartModifierSelections(
  groups: ModifierGroup[],
  selectedByGroup: Record<string, string[]>,
): CartModifierSelection[] {
  const out: CartModifierSelection[] = []
  for (const g of groups) {
    const ids = selectedByGroup[g.id] ?? []
    for (const id of ids) {
      const mod = g.modifiers.find((m) => m.id === id)
      if (mod) {
        out.push({
          groupName: g.name,
          modifierName: mod.name,
          priceDelta: mod.priceDelta,
        })
      }
    }
  }
  return out
}

/** Resolves selected attribute option records for chip display. */
export function resolveAttributeOptionsForProduct(
  product: CafeProduct,
  attributeGroups: AttributeGroup[],
): AttributeOption[] {
  const out: AttributeOption[] = []
  const groupMap = new Map(attributeGroups.map((g) => [g.id, g]))
  for (const [groupId, optionIds] of Object.entries(product.attributeGroups)) {
    const group = groupMap.get(groupId)
    if (!group) continue
    for (const oid of optionIds) {
      const opt = group.options.find((o) => o.id === oid)
      if (opt) out.push(opt)
    }
  }
  return out
}

function isCafeAndFoodCategory(category: ProductCategory | undefined): boolean {
  return (category?.productType ?? '').toLowerCase() === 'cafe&food'
}

function asCafeCategory(name: string | undefined, fallback: CafeCategory = 'Coffee'): CafeCategory {
  if (!name) return fallback
  const normalized = name.trim().toLowerCase()
  const known = Object.values(CAFE_CATEGORY_BY_SLUG).find(
    (entry) => entry.toLowerCase() === normalized,
  )
  return known ?? fallback
}

function inventoryProductToCafeProduct(
  product: Product,
  category: ProductCategory | undefined,
): CafeProduct {
  const nowIso = new Date().toISOString()
  return {
    id: product.id,
    name: product.name,
    category: asCafeCategory(category?.name),
    basePrice: product.memberPrice ?? product.price,
    stockCount: product.stockCount,
    description: product.description,
    imageUrl: product.imageUrl,
    isActive: true,
    isAvailable: true,
    availableDaysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    rotatable: false,
    modifierGroupIds: [],
    attributeGroups: {},
    printNotesOnTicket: false,
    createdAt: product.createdAt ?? nowIso,
    updatedAt: product.updatedAt ?? nowIso,
  }
}

export function mergedCafeProductsForCustomer(
  cafeProducts: CafeProduct[],
  inventoryProducts: Product[],
  productCategories: ProductCategory[],
): CafeProduct[] {
  const categoryById = new Map(productCategories.map((category) => [category.id, category]))
  const mergedById = new Map<string, CafeProduct>()

  for (const product of inventoryProducts) {
    const category = categoryById.get(product.categoryId)
    if (!isCafeAndFoodCategory(category)) {
      continue
    }
    mergedById.set(product.id, inventoryProductToCafeProduct(product, category))
  }

  for (const cafeProduct of cafeProducts) {
    const mapped = mergedById.get(cafeProduct.id)
    if (!mapped) continue
    mergedById.set(cafeProduct.id, {
      ...cafeProduct,
      name: mapped.name,
      basePrice: mapped.basePrice,
      category: mapped.category,
      description: mapped.description ?? cafeProduct.description,
      imageUrl: mapped.imageUrl ?? cafeProduct.imageUrl,
      isActive: cafeProduct.isActive ?? true,
      isAvailable: cafeProduct.isAvailable,
      updatedAt: mapped.updatedAt,
    })
  }

  return Array.from(mergedById.values())
}
