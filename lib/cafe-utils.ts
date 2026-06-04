/** Shared cafe helpers — modifier UI rules, cart summaries, availability filtering. */

import {
  collectTakeOutPartyCategoryIds,
  TAKE_OUT_PARTY_ROOT_CATEGORY_ID,
} from '@/lib/take-out-party-catalog'
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

/** Maps inventory cafe sub-category ids to cafe menu category labels. */
export const INVENTORY_CATEGORY_ID_TO_CAFE_CATEGORY: Record<string, CafeCategory> = {
  'pcat-cafe-classic-hot': 'Coffee',
  'pcat-cafe-cold-brew': 'Cold Brew',
  'pcat-cafe-specialty-drinks': 'Specialty',
  'pcat-cafe-hot-drinks': 'Hot Drinks',
  'pcat-cafe-cold-drinks': 'Cold Drinks',
  'pcat-cafe-frozen-treats': 'Frozen Treats',
  'pcat-cafe-pastries-baked': 'Pastries',
  'pcat-cafe-sweets-treats': 'Sweets',
  'pcat-cafe-baked-food': 'Baked Food',
  'pcat-cafe-pizza': 'Pizza',
  'pcat-cafe-sandwiches': 'Sandwiches',
  'pcat-cafe-toasts': 'Toasts',
  'pcat-cafe-kids-corner': 'Kids Corner',
  'pcat-cafe-salads': 'Salads',
  'pcat-cafe-snacks': 'Snacks',
  'pcat-cafe-take-out-link': 'Salads & Snacks',
  'pcat-cafe-delivery-catering-link': 'Salads & Snacks',
  'pcat-party-food': 'Party Food & Drinks',
  'pcat-party-desserts': 'Party Desserts',
  'pcat-party-decor': 'Party Decor',
}

/** URL segment → canonical cafe category label. */
export const CAFE_CATEGORY_BY_SLUG: Record<string, CafeCategory> = {
  coffee: 'Coffee',
  'hot-drinks': 'Hot Drinks',
  'cold-brew': 'Cold Brew',
  'cold-drinks': 'Cold Drinks',
  specialty: 'Specialty',
  pizza: 'Pizza',
  sandwiches: 'Sandwiches',
  'kids-corner': 'Kids Corner',
  salads: 'Salads',
  snacks: 'Snacks',
  'salads-snacks': 'Salads & Snacks',
  sweets: 'Sweets',
  pastries: 'Pastries',
  // Inventory sub-category slugs (store “view all” links)
  'classic-coffee-hot': 'Coffee',
  'specialty-drinks': 'Specialty',
  'frozen-treats': 'Frozen Treats',
  'pasteries-baked-goods': 'Pastries',
  'sweets-treats': 'Sweets',
  'baked-food': 'Baked Food',
  'cafe-pizza': 'Pizza',
  'cafe-sandwiches': 'Sandwiches',
  toasts: 'Toasts',
  'take-out-party': 'Party Food & Drinks',
  'party-food-drinks': 'Party Food & Drinks',
  'party-desserts': 'Party Desserts',
  'party-decor': 'Party Decor',
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
  if (known) return known
  if (normalized.includes('baked food') || normalized === 'baked food') {
    return 'Baked Food'
  }
  if (normalized.includes('pastry') || normalized.includes('pasteries')) {
    return 'Pastries'
  }
  if (normalized.includes('frozen')) return 'Frozen Treats'
  if (normalized.includes('sweet')) return 'Sweets'
  if (normalized.includes('cold drink')) return 'Cold Drinks'
  if (normalized.includes('hot drink')) return 'Hot Drinks'
  if (normalized.includes('cold brew')) return 'Cold Brew'
  if (normalized.includes('specialty')) return 'Specialty'
  if (normalized.includes('sandwich')) return 'Sandwiches'
  if (normalized.includes('pizza')) return 'Pizza'
  if (normalized === 'salads' || (normalized.includes('salad') && !normalized.includes('snack'))) {
    return 'Salads'
  }
  if (normalized === 'snacks' || (normalized.includes('snack') && !normalized.includes('salad'))) {
    return 'Snacks'
  }
  if (normalized.includes('kid')) return 'Kids Corner'
  return fallback
}

/** Maps an inventory sub-category row to the cafe menu label (by id, then name). */
const GENERIC_PRODUCT_IMAGE_SRC = '/placeholder.svg'

/** Prefers a real image URL over the generic placeholder when merging cafe + inventory. */
function resolveMergedProductImageUrl(
  cafeImageUrl: string | undefined,
  inventoryImageUrl: string | undefined,
): string | undefined {
  const cafe = cafeImageUrl?.trim()
  const inventory = inventoryImageUrl?.trim()
  const cafeIsPlaceholder = !cafe || cafe === GENERIC_PRODUCT_IMAGE_SRC
  const inventoryIsPlaceholder = !inventory || inventory === GENERIC_PRODUCT_IMAGE_SRC
  if (!cafeIsPlaceholder) {
    return cafe
  }
  if (!inventoryIsPlaceholder) {
    return inventory
  }
  return cafe ?? inventory
}

function cafeCategoryFromInventoryCategory(
  category: ProductCategory | undefined,
): CafeCategory {
  if (!category) return 'Coffee'
  const fromId = INVENTORY_CATEGORY_ID_TO_CAFE_CATEGORY[category.id]
  if (fromId) return fromId
  return asCafeCategory(category.name)
}

function inventoryProductToCafeProduct(
  product: Product,
  category: ProductCategory | undefined,
): CafeProduct {
  const nowIso = new Date().toISOString()
  return {
    id: product.id,
    name: product.name,
    category: cafeCategoryFromInventoryCategory(category),
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

  for (const cafeProduct of cafeProducts) {
    mergedById.set(cafeProduct.id, cafeProduct)
  }

  for (const product of inventoryProducts) {
    if (!isCafeCatalogProductId(product.id)) {
      continue
    }
    const category = categoryById.get(product.categoryId)
    if (!isCafeAndFoodCategory(category)) {
      continue
    }
    const fromInventory = inventoryProductToCafeProduct(product, category)
    const existing = mergedById.get(product.id)
    if (existing) {
      mergedById.set(product.id, {
        ...existing,
        name: fromInventory.name,
        basePrice: fromInventory.basePrice,
        category: existing.category,
        description: fromInventory.description ?? existing.description,
        imageUrl: resolveMergedProductImageUrl(existing.imageUrl, fromInventory.imageUrl),
        stockCount: fromInventory.stockCount ?? existing.stockCount,
        isActive: existing.isActive ?? true,
        isAvailable: existing.isAvailable,
        modifierGroupIds: existing.modifierGroupIds,
        attributeGroups: existing.attributeGroups,
        updatedAt: fromInventory.updatedAt,
      })
      continue
    }
    mergedById.set(product.id, fromInventory)
  }

  return Array.from(mergedById.values())
}

/** Maps an inventory sub-category id to the cafe menu category label. */
export function cafeCategoryFromInventoryCategoryId(
  inventoryCategoryId: string,
  categories: readonly ProductCategory[],
): CafeCategory {
  const mapped = INVENTORY_CATEGORY_ID_TO_CAFE_CATEGORY[inventoryCategoryId]
  if (mapped) {
    return mapped
  }
  const category = categories.find((entry) => entry.id === inventoryCategoryId)
  return cafeCategoryFromInventoryCategory(category)
}

/** Cafe-store product ids for an inventory sub-category (mock + admin-created). */
export function cafeProductIdsForInventoryCategory(
  inventoryCategoryId: string,
  cafeProducts: readonly CafeProduct[],
  productCategories: readonly ProductCategory[],
): string[] {
  return cafeProducts
    .filter(
      (product) =>
        resolveInventoryCategoryId(product.category, productCategories) === inventoryCategoryId,
    )
    .map((product) => product.id)
}

/** Whether a product id belongs to the cafe catalog (mock or admin-created). */
export function isCafeCatalogProductId(id: string): boolean {
  return (
    id.startsWith('prod-cafe-') ||
    id.startsWith('cp-') ||
    id.startsWith('prod-cafe-food-takeout-')
  )
}

/** Canonical Snacks menu product ids. */
export const SNACKS_CATALOG_IDS: ReadonlySet<string> = new Set([
  'prod-cafe-food-snack-bag-of-chips',
  'prod-cafe-food-snack-fruit-cup',
  'prod-cafe-food-snack-yogurt-parfait',
  'prod-cafe-food-snack-overnight-oats',
  'prod-cafe-food-snack-cheese-stick',
  'prod-cafe-food-snack-granola-bar',
  'prod-cafe-food-snack-protein-bars',
  'prod-cafe-food-snack-veggie-sticks-dip',
  'prod-cafe-food-snack-soft-pretzel',
  'prod-cafe-food-snack-goldfish-pretzels',
])

/** Canonical Salads menu product ids. */
export const SALADS_CATALOG_IDS: ReadonlySet<string> = new Set([
  'prod-cafe-food-cafe-cobb-salad',
  'prod-cafe-food-caesar-salad',
  'prod-cafe-food-greek-salad',
  'prod-cafe-food-side-salad',
  'prod-cafe-food-hummus-veggie-dip',
  'prod-cafe-food-caprese-skewers',
])

/** Canonical Classic Coffee (Hot) menu product ids. */
export const CLASSIC_COFFEE_CATALOG_IDS: ReadonlySet<string> = new Set([
  'prod-cafe-drink-drip-coffee',
  'prod-cafe-drink-americano',
  'prod-cafe-drink-espresso',
  'prod-cafe-drink-macchiato',
  'prod-cafe-drink-cappuccino',
  'prod-cafe-drink-latte',
  'prod-cafe-drink-mocha',
  'prod-cafe-drink-breve',
])

/** Canonical Kids Corner menu product ids. */
export const KIDS_CORNER_CATALOG_IDS: ReadonlySet<string> = new Set([
  'prod-cafe-food-kids-mac-cheese',
  'prod-cafe-food-kids-mini-corn-dogs',
  'prod-cafe-food-kids-chicken-strips',
  'prod-cafe-food-kids-pbj-uncrustable',
  'prod-cafe-food-kids-mini-snack-box',
  'prod-cafe-food-kids-bagel-bites-mini-pizzas',
  'prod-cafe-food-kids-pb-apple-dip',
  'prod-cafe-food-kids-apple-sauce-pouches',
  'prod-cafe-food-kids-yogurt-pouches',
])

/** Canonical Toasts menu product ids. */
export const TOASTS_CATALOG_IDS: ReadonlySet<string> = new Set([
  'prod-cafe-food-avocado-smash-toast',
  'prod-cafe-food-hummus-cucumber-toast',
  'prod-cafe-food-cinnamon-sugar-toast',
  'prod-cafe-food-peanut-butter-banana-toast',
  'prod-cafe-food-labneh',
])

/** Canonical Sandwiches menu product ids. */
export const SANDWICHES_CATALOG_IDS: ReadonlySet<string> = new Set([
  'prod-cafe-food-meatball-parm-sub',
  'prod-cafe-food-chicken-philly-sub',
  'prod-cafe-food-ham-cheese-melt',
  'prod-cafe-food-italian-cold-cut',
  'prod-cafe-food-turkey-provolone-sub',
  'prod-cafe-food-veggie-sub',
  'prod-cafe-food-egg-salad-sandwich',
  'prod-cafe-food-caprese-panini',
  'prod-cafe-food-smoked-turkey-swiss-panini',
  'prod-cafe-food-classic-grilled-cheese',
  'prod-cafe-food-veggie-hummus-wrap',
])

/** Canonical Pizza menu product ids. */
export const PIZZA_CATALOG_IDS: ReadonlySet<string> = new Set([
  'prod-cafe-food-classic-cheese-pizza',
  'prod-cafe-food-margherita-pizza',
  'prod-cafe-food-pepperoni-pizza',
  'prod-cafe-food-bbq-chicken-pizza',
  'prod-cafe-food-veggie-delight-pizza',
  'prod-cafe-food-discovery-town-supreme-pizza',
  'prod-cafe-food-pesto-goat-cheese-pizza',
  'prod-cafe-food-buffalo-chicken-pizza',
  'prod-cafe-food-diy-kids-pizza',
])

/** Canonical Baked Food menu product ids. */
export const BAKED_FOOD_CATALOG_IDS: ReadonlySet<string> = new Set([
  'prod-cafe-food-fatayer-selection',
  'prod-cafe-food-zaatar-manaeish',
])

/** Canonical Sweets & Treats menu product ids. */
export const SWEETS_CATALOG_IDS: ReadonlySet<string> = new Set([
  'prod-cafe-food-chocolate-chip-cookie',
  'prod-cafe-food-oatmeal-raisin-cookie',
  'prod-cafe-food-shortbread',
  'prod-cafe-food-fudge-brownie',
  'prod-cafe-food-lemon-bar',
  'prod-cafe-food-pecan-bar',
  'prod-cafe-food-cake-slices',
])

/** Canonical Pastries & Baked Goods menu product ids. */
export const PASTRIES_CATALOG_IDS: ReadonlySet<string> = new Set([
  'prod-cafe-food-signature-croissant',
  'prod-cafe-food-pain-au-chocolat',
  'prod-cafe-food-almond-croissant',
  'prod-cafe-food-bagel',
  'prod-cafe-food-danish-chocolate',
  'prod-cafe-food-danish-cheese',
  'prod-cafe-food-danish-fruit',
  'prod-cafe-food-muffins',
  'prod-cafe-food-scones',
  'prod-cafe-food-cinnamon-rolls',
  'prod-cafe-food-breakfast-breads',
  'prod-cafe-food-cake-pops',
  'prod-cafe-food-cookies-large',
  'prod-cafe-food-donuts',
])

/** Canonical Frozen Treats menu product ids. */
export const FROZEN_TREATS_CATALOG_IDS: ReadonlySet<string> = new Set([
  'prod-cafe-food-ice-cream-scoops',
  'prod-cafe-food-sundae',
  'prod-cafe-food-root-beer-float',
  'prod-cafe-food-smoothie-strawberry-banana',
  'prod-cafe-food-smoothie-tropical-mango',
  'prod-cafe-food-smoothie-green-detox',
  'prod-cafe-food-smoothie-berry-blast',
  'prod-cafe-food-slushies',
  'prod-cafe-food-frozen-lemonade',
  'prod-cafe-food-iced-coffee-blender',
])

/** Canonical Cold Drinks menu product ids. */
export const COLD_DRINKS_CATALOG_IDS: ReadonlySet<string> = new Set([
  'prod-cafe-drink-lemonade',
  'prod-cafe-drink-italian-soda',
  'prod-cafe-drink-bottled-water',
  'prod-cafe-drink-apple-juice',
  'prod-cafe-drink-orange-juice',
  'prod-cafe-drink-cranberry-juice',
  'prod-cafe-drink-coca-cola',
  'prod-cafe-drink-diet-coke',
  'prod-cafe-drink-sprite',
  'prod-cafe-drink-fanta-orange',
  'prod-cafe-drink-dr-pepper',
  'prod-cafe-drink-root-beer',
  'prod-cafe-drink-craft-sodas',
  'prod-cafe-drink-vanilla-milkshake',
  'prod-cafe-drink-chocolate-milkshake',
  'prod-cafe-drink-energy-drinks',
])

/** Inventory rows that belong in cafe&food admin/customer menus (excludes mis-tagged shop items). */
export function isCafeFoodInventoryProduct(product: Product): boolean {
  return isCafeCatalogProductId(product.id)
}

function cafeFoodCategoryIdsForAdmin(
  inventoryCategoryId: string,
  productCategories: readonly ProductCategory[],
): Set<string> {
  const takeOutTree = collectTakeOutPartyCategoryIds(productCategories)
  if (inventoryCategoryId === TAKE_OUT_PARTY_ROOT_CATEGORY_ID) {
    return takeOutTree
  }
  return new Set([inventoryCategoryId])
}

/** Active cafe&food inventory products for a sub-category (admin sidebar counts). */
export function countCafeFoodProductsForInventoryCategory(
  products: readonly Product[],
  inventoryCategoryId: string,
  productCategories: readonly ProductCategory[] = [],
): number {
  const categoryIds = cafeFoodCategoryIdsForAdmin(inventoryCategoryId, productCategories)
  return products.filter(
    (product) =>
      product.isActive &&
      categoryIds.has(product.categoryId) &&
      isCafeFoodInventoryProduct(product),
  ).length
}

/** Active cafe&food inventory products for a selected sub-category (admin product grid). */
export function listCafeFoodProductsForInventoryCategory(
  products: readonly Product[],
  inventoryCategoryId: string,
  productCategories: readonly ProductCategory[] = [],
): Product[] {
  const categoryIds = cafeFoodCategoryIdsForAdmin(inventoryCategoryId, productCategories)
  return products.filter(
    (product) =>
      product.isActive &&
      categoryIds.has(product.categoryId) &&
      isCafeFoodInventoryProduct(product),
  )
}

function slugifyProductName(input: string): string {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'product'
  )
}

/** Resolves a cafe&food inventory category id for a cafe menu category label. */
export function resolveInventoryCategoryId(
  cafeCategory: CafeCategory,
  categories: readonly ProductCategory[],
): string {
  const cafeSubCategories = categories.filter(
    (category) =>
      (category.productType ?? '').toLowerCase() === 'cafe&food' &&
      category.parentId != null &&
      category.parentId !== '',
  )
  const needle = cafeCategory.trim().toLowerCase()

  const byExactName = cafeSubCategories.find(
    (category) => category.name.trim().toLowerCase() === needle,
  )
  if (byExactName) {
    return byExactName.id
  }

  const byPartialName = cafeSubCategories.find((category) =>
    category.name.toLowerCase().includes(needle),
  )
  if (byPartialName) {
    return byPartialName.id
  }

  const preferredEntry = Object.entries(INVENTORY_CATEGORY_ID_TO_CAFE_CATEGORY).find(
    ([, label]) => label === cafeCategory,
  )
  const preferred = preferredEntry?.[0]
  if (preferred && categories.some((category) => category.id === preferred)) {
    return preferred
  }

  return cafeSubCategories[0]?.id ?? 'pcat-cafe-classic-hot'
}

/** Maps a cafe product to the inventory Product shape used in admin and store. */
export function cafeProductToInventoryProduct(
  cafe: CafeProduct,
  categoryId: string,
  tenantId: string,
): Product {
  const name = cafe.name.trim() || 'Cafe product'
  const nowIso = new Date().toISOString()
  return {
    id: cafe.id,
    tenantId,
    categoryId,
    name,
    slug: slugifyProductName(name) || cafe.id,
    description: cafe.description?.trim() || undefined,
    sku: cafe.sku?.trim() || undefined,
    price: cafe.basePrice,
    memberPrice: cafe.basePrice,
    stockCount: cafe.stockCount ?? 0,
    lowStockThreshold: 10,
    allowBackorders: false,
    isActive: cafe.isActive !== false,
    availableOnline: true,
    isFeatured: false,
    imageUrl: cafe.imageUrl,
    createdAt: cafe.createdAt ?? nowIso,
    updatedAt: cafe.updatedAt ?? nowIso,
  }
}

/** Builds inventory rows for all active cafe-store products. */
export function buildCafeCatalogInventoryProducts(
  cafeProducts: readonly CafeProduct[],
  categories: readonly ProductCategory[],
  tenantId: string,
): Product[] {
  const rows: Product[] = []
  for (const cafe of cafeProducts) {
    if (cafe.isActive === false) {
      continue
    }
    const categoryId = resolveInventoryCategoryId(cafe.category, categories)
    rows.push(cafeProductToInventoryProduct(cafe, categoryId, tenantId))
  }
  return rows
}
