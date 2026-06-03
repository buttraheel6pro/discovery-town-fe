/** Centralized Redux slice for inventory catalog state. */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import {
  buildCafeCatalogInventoryProducts,
  isCafeCatalogProductId,
} from '@/lib/cafe-utils'
import { EVENT_MODULE_ADDON_PRODUCTS } from '@/lib/mock-event-booking-add-ons'
import {
  addOns as legacySeedAddOns,
  eventModuleBookingAddOns,
  MOCK_CAFE_PRODUCTS,
  productCategories as baseProductCategories,
  products as baseProducts,
  shopProductCategories,
  shopProducts,
} from '@/lib/mock-data'
import type { RootState } from '@/lib/redux/store'
import type { AddOn, CafeProduct, Product, ProductCategory } from '@/lib/types'

export const INVENTORY_STORAGE_KEY = 'discovery-town:inventory-store:v1'
const GENERIC_PRODUCT_IMAGE_SRC = '/placeholder.svg'

interface InventoryState {
  products: Product[]
  productCategories: ProductCategory[]
  bookingAddOns: AddOn[]
}

interface UpdateProductPayload {
  id: string
  updates: Partial<Product>
}

interface UpdateCategoryPayload {
  id: string
  patch: Partial<ProductCategory>
}

interface ReorderCategoryPayload {
  id: string
  direction: 'up' | 'down'
}

interface UpdateBookingAddOnPayload {
  id: string
  updates: Partial<AddOn>
}

interface SyncCafeCatalogPayload {
  cafeProducts: CafeProduct[]
  productCategories: ProductCategory[]
  tenantId: string
}

function withFallbackImageUrl(product: Product): Product {
  const imageUrl = product.imageUrl?.trim()
  return {
    ...product,
    imageUrl: imageUrl && imageUrl.length > 0 ? imageUrl : GENERIC_PRODUCT_IMAGE_SRC,
  }
}

function withDefaultCategoryActive(category: ProductCategory): ProductCategory {
  return {
    ...category,
    isActive: category.isActive ?? true,
  }
}

function dedupeProductsById(products: readonly Product[]): Product[] {
  const seen = new Set<string>()
  const unique: Product[] = []
  for (const product of products) {
    if (seen.has(product.id)) {
      continue
    }
    seen.add(product.id)
    unique.push(product)
  }
  return unique
}

function cloneInitialState(): InventoryState {
  const productCategories = [...baseProductCategories, ...shopProductCategories].map(
    (category) => withDefaultCategoryActive({ ...category }),
  )
  const tenantId = 'tenant-1'
  const cafeCatalogProducts = buildCafeCatalogInventoryProducts(
    MOCK_CAFE_PRODUCTS,
    productCategories,
    tenantId,
  )
  const nonCafeProducts = [...baseProducts, ...shopProducts, ...EVENT_MODULE_ADDON_PRODUCTS].filter(
    (product) => !isCafeCatalogProductId(product.id),
  )
  const seededProducts = dedupeProductsById([...nonCafeProducts, ...cafeCatalogProducts])

  return {
    products: seededProducts.map((product) =>
      withFallbackImageUrl({ ...product }),
    ),
    productCategories,
    bookingAddOns: [...legacySeedAddOns, ...eventModuleBookingAddOns].map((addOn) => ({
      ...addOn,
      applicableServiceTypes: [...addOn.applicableServiceTypes],
    })),
  }
}

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: cloneInitialState(),
  reducers: {
    hydrateInventoryState(_state, action: PayloadAction<InventoryState>) {
      const dedupedProducts = dedupeProductsById(action.payload.products ?? [])
      return {
        products: dedupedProducts.map((product) =>
          withFallbackImageUrl({ ...product }),
        ),
        productCategories: (action.payload.productCategories ?? []).map((category) =>
          withDefaultCategoryActive({ ...category }),
        ),
        bookingAddOns: (
          action.payload.bookingAddOns ?? [...legacySeedAddOns, ...eventModuleBookingAddOns]
        ).map((addOn) => ({
          ...addOn,
          applicableServiceTypes: [...addOn.applicableServiceTypes],
        })),
      }
    },
    addProduct(state, action: PayloadAction<Product>) {
      const nextProduct = withFallbackImageUrl(action.payload)
      state.products = [
        nextProduct,
        ...state.products.filter((product) => product.id !== nextProduct.id),
      ]
    },
    updateProduct(state, action: PayloadAction<UpdateProductPayload>) {
      const { id, updates } = action.payload
      const updatedAt = new Date().toISOString()
      state.products = state.products.map((product) =>
        product.id === id
          ? withFallbackImageUrl({ ...product, ...updates, updatedAt })
          : product,
      )
    },
    deleteProduct(state, action: PayloadAction<string>) {
      const id = action.payload
      state.products = state.products.filter((product) => product.id !== id)
    },
    addProductCategory(state, action: PayloadAction<ProductCategory>) {
      state.productCategories.push(withDefaultCategoryActive(action.payload))
    },
    updateProductCategory(state, action: PayloadAction<UpdateCategoryPayload>) {
      const { id, patch } = action.payload
      state.productCategories = state.productCategories.map((category) =>
        category.id === id ? { ...category, ...patch, id: category.id } : category,
      )
    },
    deleteProductCategory(state, action: PayloadAction<string>) {
      const id = action.payload
      state.productCategories = state.productCategories.filter((category) => category.id !== id)
    },
    reorderProductCategory(state, action: PayloadAction<ReorderCategoryPayload>) {
      const { id, direction } = action.payload
      const category = state.productCategories.find((entry) => entry.id === id)
      if (!category) {
        return
      }
      const parentKey = category.parentId ?? null
      const siblings = state.productCategories
        .filter((entry) => (entry.parentId ?? null) === parentKey)
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder)
      const index = siblings.findIndex((entry) => entry.id === id)
      const swapIndex = direction === 'up' ? index - 1 : index + 1
      if (swapIndex < 0 || swapIndex >= siblings.length) {
        return
      }

      const current = siblings[index]
      const target = siblings[swapIndex]
      const currentOrder = target.displayOrder
      const targetOrder = current.displayOrder

      state.productCategories = state.productCategories.map((entry) => {
        if (entry.id === current.id) {
          return { ...entry, displayOrder: currentOrder }
        }
        if (entry.id === target.id) {
          return { ...entry, displayOrder: targetOrder }
        }
        return entry
      })
    },
    addBookingAddOn(state, action: PayloadAction<AddOn>) {
      const next = {
        ...action.payload,
        applicableServiceTypes: [...action.payload.applicableServiceTypes],
      }
      state.bookingAddOns = [
        next,
        ...state.bookingAddOns.filter((addOn) => addOn.id !== next.id),
      ]
    },
    updateBookingAddOn(state, action: PayloadAction<UpdateBookingAddOnPayload>) {
      const { id, updates } = action.payload
      state.bookingAddOns = state.bookingAddOns.map((addOn) =>
        addOn.id === id
          ? {
              ...addOn,
              ...updates,
              applicableServiceTypes: updates.applicableServiceTypes
                ? [...updates.applicableServiceTypes]
                : addOn.applicableServiceTypes,
            }
          : addOn,
      )
    },
    deleteBookingAddOn(state, action: PayloadAction<string>) {
      state.bookingAddOns = state.bookingAddOns.filter((addOn) => addOn.id !== action.payload)
    },
    syncCafeCatalogProducts(state, action: PayloadAction<SyncCafeCatalogPayload>) {
      const { cafeProducts, productCategories, tenantId } = action.payload
      const catalogRows = buildCafeCatalogInventoryProducts(
        cafeProducts,
        productCategories,
        tenantId,
      )
      const nonCafeProducts = state.products.filter(
        (product) => !isCafeCatalogProductId(product.id),
      )
      state.products = [...nonCafeProducts, ...catalogRows].map((product) =>
        withFallbackImageUrl({ ...product }),
      )
    },
  },
})

export const {
  hydrateInventoryState,
  addProduct,
  updateProduct,
  deleteProduct,
  addProductCategory,
  updateProductCategory,
  deleteProductCategory,
  reorderProductCategory,
  addBookingAddOn,
  updateBookingAddOn,
  deleteBookingAddOn,
  syncCafeCatalogProducts,
} = inventorySlice.actions

export const inventoryReducer = inventorySlice.reducer
export type { InventoryState }

export const selectInventoryState = (state: RootState): InventoryState => state.inventory
export const selectInventoryProducts = (state: RootState): Product[] => state.inventory.products
export const selectInventoryProductCategories = (
  state: RootState,
): ProductCategory[] => state.inventory.productCategories
export const selectInventoryBookingAddOns = (state: RootState): AddOn[] =>
  state.inventory.bookingAddOns
