/** Take Out Party — cafe & food on Events (placed); native home under Cafe & Food. */

import type { ProductSchedulingMenuSection } from '@/lib/product-scheduling-menu-sections'
import type { CafeProduct, Product, ProductCategory } from '@/lib/types'

export const TAKE_OUT_PARTY_ROOT_CATEGORY_ID = 'pcat-takeout-party' as const
export const TAKE_OUT_PARTY_ROOT_SLUG = 'take-out-party' as const

export const TAKE_OUT_PARTY_SUBCATEGORY_IDS = [
  'pcat-party-food',
  'pcat-party-desserts',
  'pcat-party-decor',
] as const

export const TAKE_OUT_PARTY_CATEGORY_SLUGS: readonly string[] = [
  TAKE_OUT_PARTY_ROOT_SLUG,
  'party-food-drinks',
  'party-desserts',
  'party-decor',
]

export function isTakeOutPartyProductMenuSectionId(sectionId: string): boolean {
  return (
    sectionId === TAKE_OUT_PARTY_ROOT_CATEGORY_ID ||
    (TAKE_OUT_PARTY_SUBCATEGORY_IDS as readonly string[]).includes(sectionId)
  )
}

/** Events page renders Take Out Party product rails after scheduling sections. */
export function partitionProductSectionsForEventsPage(
  sections: readonly ProductSchedulingMenuSection[],
): {
  readonly beforeTakeOutParty: ProductSchedulingMenuSection[]
  readonly takeOutParty: ProductSchedulingMenuSection[]
} {
  const beforeTakeOutParty: ProductSchedulingMenuSection[] = []
  const takeOutParty: ProductSchedulingMenuSection[] = []
  for (const section of sections) {
    if (isTakeOutPartyProductMenuSectionId(section.id)) {
      takeOutParty.push(section)
    } else {
      beforeTakeOutParty.push(section)
    }
  }
  return { beforeTakeOutParty, takeOutParty }
}

export const TAKE_OUT_PARTY_PRODUCT_IDS: readonly string[] = [
  'prod-cafe-food-takeout-cupcakes',
  'prod-cafe-food-takeout-balloon-bouquet',
  'prod-cafe-food-takeout-snack-basket',
  'prod-cafe-food-takeout-celebration-drinks',
]

export function isTakeOutPartyCategorySlug(slug: string): boolean {
  return TAKE_OUT_PARTY_CATEGORY_SLUGS.includes(slug)
}

/** All inventory category ids in the Take Out Party tree (root + sub-categories). */
export function collectTakeOutPartyCategoryIds(
  productCategories: readonly Pick<ProductCategory, 'id' | 'parentId'>[],
): Set<string> {
  const ids = new Set<string>([
    TAKE_OUT_PARTY_ROOT_CATEGORY_ID,
    ...TAKE_OUT_PARTY_SUBCATEGORY_IDS,
  ])
  let expanded = true
  while (expanded) {
    expanded = false
    for (const category of productCategories) {
      const parentId = category.parentId ?? null
      if (parentId != null && ids.has(parentId) && !ids.has(category.id)) {
        ids.add(category.id)
        expanded = true
      }
    }
  }
  return ids
}

export function isTakeOutPartyCategoryId(
  categoryId: string,
  categoryById?: ReadonlyMap<string, Pick<ProductCategory, 'id' | 'parentId' | 'slug'>>,
): boolean {
  if (
    categoryId === TAKE_OUT_PARTY_ROOT_CATEGORY_ID ||
    (TAKE_OUT_PARTY_SUBCATEGORY_IDS as readonly string[]).includes(categoryId)
  ) {
    return true
  }
  if (!categoryById) {
    return false
  }
  let current = categoryById.get(categoryId) ?? null
  while (current) {
    if (current.id === TAKE_OUT_PARTY_ROOT_CATEGORY_ID) {
      return true
    }
    const parentId = current.parentId ?? null
    if (!parentId) {
      return false
    }
    current = categoryById.get(parentId) ?? null
  }
  return false
}

export function isTakeOutPartyCatalogProductId(productId: string): boolean {
  return (
    productId.startsWith('prod-cafe-food-takeout-') ||
    TAKE_OUT_PARTY_PRODUCT_IDS.includes(productId)
  )
}

type CategoryPlacementFields = Pick<
  ProductCategory,
  'id' | 'slug' | 'parentId' | 'productType' | 'catalogSlug'
>

/** Admin + PDP use cafe editor when the product sits under the take-out-party slug tree. */
export function usesTakeOutPartyCafeFoodEditor(
  category: CategoryPlacementFields | null | undefined,
  productCategories?: readonly CategoryPlacementFields[],
): boolean {
  if (!category) {
    return false
  }
  if (isTakeOutPartyCategorySlug(category.slug)) {
    return true
  }
  if (!productCategories?.length) {
    return (
      category.id === TAKE_OUT_PARTY_ROOT_CATEGORY_ID ||
      category.parentId === TAKE_OUT_PARTY_ROOT_CATEGORY_ID
    )
  }
  const categoryById = new Map(productCategories.map((row) => [row.id, row]))
  return isTakeOutPartyCategoryId(category.id, categoryById)
}

export function takeOutPartyProductsForCategory(
  products: readonly Product[],
  categoryId: string,
  productCategories: readonly Pick<ProductCategory, 'id' | 'parentId'>[],
): Product[] {
  const treeIds = collectTakeOutPartyCategoryIds(productCategories)
  if (!treeIds.has(categoryId)) {
    return products.filter(
      (product) => product.isActive && product.categoryId === categoryId,
    )
  }
  return products.filter(
    (product) => product.isActive && treeIds.has(product.categoryId),
  )
}

export function resolveTakeOutPartyCategory(
  product: Pick<Product, 'categoryId'>,
  productCategories?: readonly CategoryPlacementFields[],
): CategoryPlacementFields | null {
  if (!productCategories?.length) {
    return null
  }
  return productCategories.find((row) => row.id === product.categoryId) ?? null
}

const TAKE_OUT_NOW = '2024-01-01T00:00:00Z'

/** Cafe-store seed rows with full cafe fields (prep time, availability, ticket notes). */
export const TAKE_OUT_PARTY_CAFE_PRODUCTS: readonly CafeProduct[] = [
  {
    id: 'prod-cafe-food-takeout-cupcakes',
    name: 'Custom Cupcakes - 1 Dozen (themed)',
    sku: 'CAFE-TOP-CUPCAKES-12',
    category: 'Party Desserts',
    basePrice: 40,
    stockCount: 40,
    description: 'Freshly baked themed cupcakes with edible toppers.',
    preparationTimeMinutes: 1440,
    notes: 'Confirm theme and pickup window at least 48 hours ahead.',
    printNotesOnTicket: true,
    modifierGroupIds: [],
    attributeGroups: {},
    availableDaysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    isAvailable: true,
    rotatable: false,
    isActive: true,
    imageUrl:
      'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=1200&q=80',
    createdAt: TAKE_OUT_NOW,
    updatedAt: TAKE_OUT_NOW,
  },
  {
    id: 'prod-cafe-food-takeout-balloon-bouquet',
    name: 'Balloon Bouquet Kit (6 helium, 3 colors)',
    sku: 'CAFE-TOP-BALLOON-BOUQUET',
    category: 'Party Decor',
    basePrice: 15,
    stockCount: 65,
    description: 'Helium balloon bouquet with custom color trio.',
    preparationTimeMinutes: 60,
    notes: 'Include color choices on the ticket.',
    printNotesOnTicket: true,
    modifierGroupIds: [],
    attributeGroups: {},
    availableDaysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    isAvailable: true,
    rotatable: false,
    isActive: true,
    imageUrl:
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&q=80',
    createdAt: TAKE_OUT_NOW,
    updatedAt: TAKE_OUT_NOW,
  },
  {
    id: 'prod-cafe-food-takeout-snack-basket',
    name: 'Party Snack Basket (chips, pretzels, goldfish)',
    sku: 'CAFE-TOP-SNACK-BASKET',
    category: 'Party Food & Drinks',
    basePrice: 22,
    stockCount: 30,
    description: 'Savory party snack bundle for takeout celebrations.',
    preparationTimeMinutes: 45,
    notes: 'Label for nut-free prep when requested.',
    printNotesOnTicket: false,
    modifierGroupIds: [],
    attributeGroups: {},
    availableDaysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    isAvailable: true,
    rotatable: false,
    isActive: true,
    imageUrl:
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=1200&q=80',
    createdAt: TAKE_OUT_NOW,
    updatedAt: TAKE_OUT_NOW,
  },
  {
    id: 'prod-cafe-food-takeout-celebration-drinks',
    name: 'Celebration Drink Bundle (lemonade & iced tea)',
    sku: 'CAFE-TOP-DRINK-BUNDLE',
    category: 'Party Food & Drinks',
    basePrice: 28,
    stockCount: 24,
    description: 'Gallon serves with cups, ice, and napkins for party tables.',
    preparationTimeMinutes: 30,
    notes: 'Batch and chill before pickup slot.',
    printNotesOnTicket: false,
    modifierGroupIds: [],
    attributeGroups: {},
    availableDaysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    isAvailable: true,
    rotatable: false,
    isActive: true,
    imageUrl:
      'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=1200&q=80',
    createdAt: TAKE_OUT_NOW,
    updatedAt: TAKE_OUT_NOW,
  },
]
