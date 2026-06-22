/** Cafe & Food domain state — products, modifier/attribute/rotation groups, kitchen queue (mock-persisted). */
'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { getLocalStorageJson, setLocalStorageJson } from '@/lib/browser-local-storage-json'
import {
  CLASSIC_COFFEE_CATALOG_IDS,
  SALADS_CATALOG_IDS,
  SNACKS_CATALOG_IDS,
  COLD_DRINKS_CATALOG_IDS,
  FROZEN_TREATS_CATALOG_IDS,
  KIDS_CORNER_CATALOG_IDS,
  BAKED_FOOD_CATALOG_IDS,
  PASTRIES_CATALOG_IDS,
  PIZZA_CATALOG_IDS,
  SANDWICHES_CATALOG_IDS,
  SWEETS_CATALOG_IDS,
  TOASTS_CATALOG_IDS,
} from '@/lib/cafe-utils'
import {
  MOCK_ATTRIBUTE_GROUPS,
  MOCK_CAFE_PRODUCTS,
  MOCK_MODIFIER_GROUPS,
  MOCK_ROTATION_GROUPS,
} from '@/lib/mock-data'
import {
  attributeGroupSchema,
  cafeProductSchema,
  modifierGroupSchema,
  rotationGroupSchema,
} from '@/lib/schemas/cafe'
import { newAdminEntityId } from '@/lib/scheduling-admin-builders'
import type {
  AttributeGroup,
  CafeKitchenColumn,
  CafeKitchenOrder,
  CafeProduct,
  ModifierGroup,
  RotationGroup,
} from '@/lib/types'
import { isAdminApiReady } from '@/lib/api/client'
import {
  createAttributeGroup,
  deleteAttributeGroupById,
  listAttributeGroups,
  updateAttributeGroup,
} from '@/lib/services/attribute-groups'

const CAFE_STORAGE_KEY = 'dt_cafe_state_v1'

interface CafePersistedShape {
  cafeProducts: CafeProduct[]
  modifierGroups: ModifierGroup[]
  attributeGroups: AttributeGroup[]
  rotationGroups: RotationGroup[]
  kitchenOrders: CafeKitchenOrder[]
}

const SEED_CAFE_PRODUCTS = cafeProductSchema.array().parse(MOCK_CAFE_PRODUCTS)
const SEED_MODIFIER_GROUPS = modifierGroupSchema.array().parse(MOCK_MODIFIER_GROUPS)
const SEED_ATTRIBUTE_GROUPS = attributeGroupSchema.array().parse(MOCK_ATTRIBUTE_GROUPS)
const SEED_ROTATION_GROUPS = rotationGroupSchema.array().parse(MOCK_ROTATION_GROUPS)

/**
 * Merges mock seed with persisted admin catalog — persisted wins on id collision.
 */
function mergeCatalogPersistedWithSeed<T extends { id: string }>(
  persisted: readonly T[],
  seed: readonly T[],
  parseItem: (item: T) => T,
): T[] {
  const byId = new Map<string, T>()
  for (const item of seed) {
    byId.set(item.id, parseItem(item))
  }
  for (const item of persisted) {
    byId.set(item.id, parseItem(item))
  }
  return Array.from(byId.values())
}

/** Unions mock seed links with admin-added groups/options on the same product. */
function mergeProductAttributeGroups(
  seed: Record<string, string[]>,
  persisted: Record<string, string[]>,
): Record<string, string[]> {
  const merged: Record<string, string[]> = {}
  for (const [groupId, optionIds] of Object.entries(seed)) {
    merged[groupId] = [...optionIds]
  }
  for (const [groupId, optionIds] of Object.entries(persisted)) {
    const seedOptions = merged[groupId]
    if (!seedOptions) {
      merged[groupId] = [...optionIds]
      continue
    }
    merged[groupId] = [...new Set([...seedOptions, ...optionIds])]
  }
  return merged
}

function mergeProductModifierGroupIds(seed: string[], persisted: string[]): string[] {
  const seen = new Set(seed)
  const extra = persisted.filter((id) => !seen.has(id))
  return [...seed, ...extra]
}

function mergeSeedCafeProductWithPersisted(seed: CafeProduct, persisted: CafeProduct): CafeProduct {
  return cafeProductSchema.parse({
    ...persisted,
    attributeGroups: mergeProductAttributeGroups(seed.attributeGroups, persisted.attributeGroups),
    modifierGroupIds: mergeProductModifierGroupIds(
      seed.modifierGroupIds,
      persisted.modifierGroupIds,
    ),
  })
}

/** Mock seed is the catalog baseline; admin-only products and customisations are preserved. */
function mergeCafeProductCatalog(
  persisted: readonly CafeProduct[],
  seed: readonly CafeProduct[],
): CafeProduct[] {
  const persistedById = new Map(persisted.map((product) => [product.id, product]))
  const byId = new Map<string, CafeProduct>()

  for (const seedProduct of seed) {
    const persistedProduct = persistedById.get(seedProduct.id)
    if (persistedProduct) {
      byId.set(seedProduct.id, mergeSeedCafeProductWithPersisted(seedProduct, persistedProduct))
      continue
    }
    byId.set(seedProduct.id, cafeProductSchema.parse(seedProduct))
  }

  for (const product of persisted) {
    if (!byId.has(product.id)) {
      byId.set(product.id, cafeProductSchema.parse(product))
    }
  }

  return Array.from(byId.values())
}

/** Hides stale seed-only rows that no longer belong on a curated menu. */
function reconcileCuratedMenuProducts(
  products: CafeProduct[],
  persistedProductIds: ReadonlySet<string>,
): CafeProduct[] {
  return products.map((product) => {
    if (persistedProductIds.has(product.id)) {
      return product
    }
    if (product.category === 'Coffee' && !CLASSIC_COFFEE_CATALOG_IDS.has(product.id)) {
      return { ...product, isActive: false }
    }
    if (
      product.category === 'Cold Drinks' &&
      !COLD_DRINKS_CATALOG_IDS.has(product.id)
    ) {
      return { ...product, isActive: false }
    }
    if (
      product.category === 'Frozen Treats' &&
      !FROZEN_TREATS_CATALOG_IDS.has(product.id)
    ) {
      return { ...product, isActive: false }
    }
    if (product.category === 'Pastries' && !PASTRIES_CATALOG_IDS.has(product.id)) {
      return { ...product, isActive: false }
    }
    if (product.category === 'Sweets' && !SWEETS_CATALOG_IDS.has(product.id)) {
      return { ...product, isActive: false }
    }
    if (product.category === 'Baked Food' && !BAKED_FOOD_CATALOG_IDS.has(product.id)) {
      return { ...product, isActive: false }
    }
    if (product.category === 'Pizza' && !PIZZA_CATALOG_IDS.has(product.id)) {
      return { ...product, isActive: false }
    }
    if (product.category === 'Sandwiches' && !SANDWICHES_CATALOG_IDS.has(product.id)) {
      return { ...product, isActive: false }
    }
    if (product.category === 'Toasts' && !TOASTS_CATALOG_IDS.has(product.id)) {
      return { ...product, isActive: false }
    }
    if (product.category === 'Kids Corner' && !KIDS_CORNER_CATALOG_IDS.has(product.id)) {
      return { ...product, isActive: false }
    }
    if (product.category === 'Salads' && !SALADS_CATALOG_IDS.has(product.id)) {
      return { ...product, isActive: false }
    }
    if (product.category === 'Snacks' && !SNACKS_CATALOG_IDS.has(product.id)) {
      return { ...product, isActive: false }
    }
    return product
  })
}

function hydrateCafeCatalogFromMock(
  persistedProducts: readonly CafeProduct[],
  persistedModifiers: readonly ModifierGroup[],
  persistedAttributes: readonly AttributeGroup[],
  persistedRotations: readonly RotationGroup[],
): Pick<
  CafePersistedShape,
  'cafeProducts' | 'modifierGroups' | 'attributeGroups' | 'rotationGroups'
> {
  const persistedProductIds = new Set(persistedProducts.map((product) => product.id))
  return {
    cafeProducts: reconcileCuratedMenuProducts(
      mergeCafeProductCatalog(persistedProducts, SEED_CAFE_PRODUCTS),
      persistedProductIds,
    ),
    modifierGroups: mergeCatalogPersistedWithSeed(
      persistedModifiers,
      SEED_MODIFIER_GROUPS,
      (group) => modifierGroupSchema.parse(group),
    ),
    attributeGroups: mergeCatalogPersistedWithSeed(
      persistedAttributes,
      SEED_ATTRIBUTE_GROUPS,
      (group) => attributeGroupSchema.parse(group),
    ),
    rotationGroups: mergeCatalogPersistedWithSeed(
      persistedRotations,
      SEED_ROTATION_GROUPS,
      (group) => rotationGroupSchema.parse(group),
    ),
  }
}

function safeParseInitial(): CafePersistedShape {
  const catalog = hydrateCafeCatalogFromMock([], [], [], [])
  const base: CafePersistedShape = {
    ...catalog,
    kitchenOrders: seedKitchenOrders(),
  }
  if (typeof window === 'undefined') return base
  try {
    const parsed = getLocalStorageJson<Partial<CafePersistedShape>>(CAFE_STORAGE_KEY)
    if (!parsed || typeof parsed !== 'object') return base
    const o = parsed
    const persistedCafeProducts =
      o.cafeProducts != null ? cafeProductSchema.array().parse(o.cafeProducts) : []
    const persistedModifiers =
      o.modifierGroups != null ? modifierGroupSchema.array().parse(o.modifierGroups) : []
    const persistedAttributes =
      o.attributeGroups != null ? attributeGroupSchema.array().parse(o.attributeGroups) : []
    const persistedRotations =
      o.rotationGroups != null ? rotationGroupSchema.array().parse(o.rotationGroups) : []
    const catalog = hydrateCafeCatalogFromMock(
      persistedCafeProducts,
      persistedModifiers,
      persistedAttributes,
      persistedRotations,
    )
    return {
      ...catalog,
      kitchenOrders: Array.isArray(o.kitchenOrders)
        ? (o.kitchenOrders as CafeKitchenOrder[])
        : base.kitchenOrders,
    }
  } catch {
    return base
  }
}

function seedKitchenOrders(): CafeKitchenOrder[] {
  const now = Date.now()
  return [
    {
      id: 'ck-1',
      orderNumber: 'CF-2041',
      channel: 'TAKEOUT',
      receivedAt: new Date(now - 120000).toISOString(),
      scheduledFor: new Date(now + 600000).toISOString(),
      items: [
        {
          name: 'Café Latte',
          modifierSummary: 'Large · Oat Milk · Caramel',
          preparationTimeMinutes: 5,
        },
      ],
      status: 'NEW',
      deliveryAddress: null,
      cateringEventName: null,
    },
    {
      id: 'ck-2',
      orderNumber: 'CF-2040',
      channel: 'POS',
      receivedAt: new Date(now - 300000).toISOString(),
      items: [
        {
          name: 'Kids Meal',
          modifierSummary: 'Apple Slices',
          preparationTimeMinutes: 8,
        },
      ],
      status: 'PREPARING',
      scheduledFor: null,
      deliveryAddress: null,
      cateringEventName: null,
    },
    {
      id: 'ck-3',
      orderNumber: 'CF-2038',
      channel: 'DELIVERY',
      receivedAt: new Date(now - 900000).toISOString(),
      items: [
        {
          name: 'Pizza Slice',
          modifierSummary: '',
          preparationTimeMinutes: 12,
        },
      ],
      status: 'READY',
      scheduledFor: null,
      deliveryAddress: '9753 Crosspoint Blvd, Indianapolis, Indiana, 46256',
      cateringEventName: null,
    },
  ]
}

export interface CafeStoreValue {
  readonly cafeProducts: CafeProduct[]
  readonly modifierGroups: ModifierGroup[]
  readonly attributeGroups: AttributeGroup[]
  readonly rotationGroups: RotationGroup[]
  readonly kitchenOrders: CafeKitchenOrder[]
  readonly upsertCafeProduct: (product: CafeProduct) => void
  readonly deleteCafeProduct: (id: string) => void
  readonly upsertModifierGroup: (group: ModifierGroup) => void
  readonly deleteModifierGroup: (id: string) => void
  readonly upsertAttributeGroup: (group: AttributeGroup) => void
  readonly deleteAttributeGroup: (id: string) => void
  readonly upsertRotationGroup: (group: RotationGroup) => void
  readonly setRotationManualOverride: (groupId: string, productId: string | null) => void
  readonly reorderRotationPool: (groupId: string, pool: string[]) => void
  readonly updateKitchenOrderStatus: (orderId: string, status: CafeKitchenColumn) => void
}

const CafeContext = createContext<CafeStoreValue | null>(null)

export function CafeProvider({ children }: Readonly<{ children: ReactNode }>) {
  const initial = useMemo(() => safeParseInitial(), [])
  const [cafeProducts, setCafeProducts] = useState<CafeProduct[]>(initial.cafeProducts)
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>(initial.modifierGroups)
  const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>(
    initial.attributeGroups,
  )
  const [rotationGroups, setRotationGroups] = useState<RotationGroup[]>(initial.rotationGroups)
  const [kitchenOrders, setKitchenOrders] = useState<CafeKitchenOrder[]>(initial.kitchenOrders)

  useEffect(() => {
    let cancelled = false
    let attempts = 0
    let timer: ReturnType<typeof window.setTimeout> | undefined

    const loadAttributeGroups = async () => {
      attempts += 1
      if (!isAdminApiReady()) {
        if (!cancelled && attempts < 10) {
          timer = window.setTimeout(loadAttributeGroups, 500)
        }
        return
      }
      try {
        const rows = await listAttributeGroups()
        if (!cancelled && rows.length > 0) {
          setAttributeGroups(rows)
          return
        }
      } catch {
        // Keep local/mock catalog if the admin API is not ready yet.
      }
      if (!cancelled && attempts < 10) {
        timer = window.setTimeout(loadAttributeGroups, 500)
      }
    }

    loadAttributeGroups()

    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const payload: CafePersistedShape = {
      cafeProducts,
      modifierGroups,
      attributeGroups,
      rotationGroups,
      kitchenOrders,
    }
    setLocalStorageJson(CAFE_STORAGE_KEY, payload)
  }, [cafeProducts, modifierGroups, attributeGroups, rotationGroups, kitchenOrders])

  const upsertCafeProduct = useCallback((product: CafeProduct) => {
    const validated = cafeProductSchema.parse(product)
    setCafeProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === validated.id)
      if (idx === -1) return [...prev, validated]
      const next = [...prev]
      next[idx] = validated
      return next
    })
  }, [])

  const deleteCafeProduct = useCallback((id: string) => {
    setCafeProducts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const upsertModifierGroup = useCallback((group: ModifierGroup) => {
    const validated = modifierGroupSchema.parse(group)
    setModifierGroups((prev) => {
      const idx = prev.findIndex((g) => g.id === validated.id)
      if (idx === -1) return [...prev, validated]
      const next = [...prev]
      next[idx] = validated
      return next
    })
  }, [])

  const deleteModifierGroup = useCallback((id: string) => {
    setModifierGroups((prev) => prev.filter((g) => g.id !== id))
  }, [])

  const upsertAttributeGroup = useCallback((group: AttributeGroup) => {
    const validated = attributeGroupSchema.parse(group)
    const exists = attributeGroups.some((entry) => entry.id === validated.id)
    setAttributeGroups((prev) => {
      const idx = prev.findIndex((g) => g.id === validated.id)
      if (idx === -1) return [...prev, validated]
      const next = [...prev]
      next[idx] = validated
      return next
    })
    const persist = exists ? updateAttributeGroup : createAttributeGroup
    persist(validated)
      .then((saved) => {
        setAttributeGroups((prev) => {
          const withoutDraft = prev.filter((entry) => entry.id !== validated.id && entry.id !== saved.id)
          return [...withoutDraft, saved]
        })
      })
      .catch(() => {
        // Local state remains usable when API auth is not available.
      })
  }, [attributeGroups])

  const deleteAttributeGroup = useCallback((id: string) => {
    setAttributeGroups((prev) => prev.filter((g) => g.id !== id))
    deleteAttributeGroupById(id).catch(() => {
      // Keep the optimistic local delete for offline/mock usage.
    })
  }, [])

  const upsertRotationGroup = useCallback((group: RotationGroup) => {
    const validated = rotationGroupSchema.parse(group)
    setRotationGroups((prev) => {
      const idx = prev.findIndex((g) => g.id === validated.id)
      if (idx === -1) return [...prev, validated]
      const next = [...prev]
      next[idx] = validated
      return next
    })
  }, [])

  const setRotationManualOverride = useCallback((groupId: string, productId: string | null) => {
    setRotationGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g
        if (productId == null) {
          return {
            ...g,
            manualOverride: null,
          }
        }
        return {
          ...g,
          manualOverride: { productId, setAt: new Date().toISOString() },
          activeProductId: productId,
        }
      }),
    )
  }, [])

  const reorderRotationPool = useCallback((groupId: string, pool: string[]) => {
    setRotationGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, pool: [...pool] } : g)),
    )
  }, [])

  const updateKitchenOrderStatus = useCallback((orderId: string, status: CafeKitchenColumn) => {
    setKitchenOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
    )
  }, [])

  const value = useMemo<CafeStoreValue>(
    () => ({
      cafeProducts,
      modifierGroups,
      attributeGroups,
      rotationGroups,
      kitchenOrders,
      upsertCafeProduct,
      deleteCafeProduct,
      upsertModifierGroup,
      deleteModifierGroup,
      upsertAttributeGroup,
      deleteAttributeGroup,
      upsertRotationGroup,
      setRotationManualOverride,
      reorderRotationPool,
      updateKitchenOrderStatus,
    }),
    [
      cafeProducts,
      modifierGroups,
      attributeGroups,
      rotationGroups,
      kitchenOrders,
      upsertCafeProduct,
      deleteCafeProduct,
      upsertModifierGroup,
      deleteModifierGroup,
      upsertAttributeGroup,
      deleteAttributeGroup,
      upsertRotationGroup,
      setRotationManualOverride,
      reorderRotationPool,
      updateKitchenOrderStatus,
    ],
  )

  return <CafeContext.Provider value={value}>{children}</CafeContext.Provider>
}

export function useCafe(): CafeStoreValue {
  const ctx = useContext(CafeContext)
  if (!ctx) {
    throw new Error('useCafe must be used within CafeProvider')
  }
  return ctx
}

/** Creates a new cafe product shell with timestamps (admin create flow). */
export function createEmptyCafeProduct(overrides: Partial<CafeProduct> = {}): CafeProduct {
  const now = new Date().toISOString()
  const id = overrides.id ?? newAdminEntityId('cp')
  return cafeProductSchema.parse({
    id,
    name: overrides.name ?? '',
    sku: overrides.sku,
    subtype: overrides.subtype,
    category: overrides.category ?? 'Coffee',
    basePrice: overrides.basePrice ?? 0,
    stockCount: overrides.stockCount,
    description: overrides.description,
    notes: overrides.notes,
    printNotesOnTicket: overrides.printNotesOnTicket ?? false,
    preparationTimeMinutes: overrides.preparationTimeMinutes,
    isActive: overrides.isActive ?? true,
    isAvailable: overrides.isAvailable ?? true,
    availableDaysOfWeek: overrides.availableDaysOfWeek ?? [0, 1, 2, 3, 4, 5, 6],
    rotatable: overrides.rotatable ?? false,
    rotationGroupId: overrides.rotationGroupId,
    isActiveInRotation: overrides.isActiveInRotation,
    modifierGroupIds: overrides.modifierGroupIds ?? [],
    attributeGroups: overrides.attributeGroups ?? {},
    imageUrl: overrides.imageUrl,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  })
}
