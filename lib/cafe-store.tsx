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

import { setLocalStorageJson } from '@/lib/browser-local-storage-json'
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

const CAFE_STORAGE_KEY = 'dt_cafe_state_v1'

interface CafePersistedShape {
  cafeProducts: CafeProduct[]
  modifierGroups: ModifierGroup[]
  attributeGroups: AttributeGroup[]
  rotationGroups: RotationGroup[]
  kitchenOrders: CafeKitchenOrder[]
}

function safeParseInitial(): CafePersistedShape {
  const base: CafePersistedShape = {
    cafeProducts: cafeProductSchema.array().parse(MOCK_CAFE_PRODUCTS),
    modifierGroups: modifierGroupSchema.array().parse(MOCK_MODIFIER_GROUPS),
    attributeGroups: attributeGroupSchema.array().parse(MOCK_ATTRIBUTE_GROUPS),
    rotationGroups: rotationGroupSchema.array().parse(MOCK_ROTATION_GROUPS),
    kitchenOrders: seedKitchenOrders(),
  }
  if (typeof window === 'undefined') return base
  try {
    const raw = window.localStorage.getItem(CAFE_STORAGE_KEY)
    if (!raw) return base
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== 'object' || parsed === null) return base
    const o = parsed as Partial<CafePersistedShape>
    return {
      cafeProducts:
        o.cafeProducts != null
          ? cafeProductSchema.array().parse(o.cafeProducts)
          : base.cafeProducts,
      modifierGroups:
        o.modifierGroups != null
          ? modifierGroupSchema.array().parse(o.modifierGroups)
          : base.modifierGroups,
      attributeGroups:
        o.attributeGroups != null
          ? attributeGroupSchema.array().parse(o.attributeGroups)
          : base.attributeGroups,
      rotationGroups:
        o.rotationGroups != null
          ? rotationGroupSchema.array().parse(o.rotationGroups)
          : base.rotationGroups,
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
      deliveryAddress: '12 Oak Lane, Carmel',
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
    setAttributeGroups((prev) => {
      const idx = prev.findIndex((g) => g.id === validated.id)
      if (idx === -1) return [...prev, validated]
      const next = [...prev]
      next[idx] = validated
      return next
    })
  }, [])

  const deleteAttributeGroup = useCallback((id: string) => {
    setAttributeGroups((prev) => prev.filter((g) => g.id !== id))
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
