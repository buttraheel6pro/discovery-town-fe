/** Centralized Redux slice for inventory catalog state. */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import {
  productCategories as baseProductCategories,
  products as baseProducts,
  shopProductCategories,
  shopProducts,
} from '@/lib/mock-data'
import type { RootState } from '@/lib/redux/store'
import type { Product, ProductCategory } from '@/lib/types'

export const INVENTORY_STORAGE_KEY = 'discovery-town:inventory-store:v1'
const GENERIC_PRODUCT_IMAGE_SRC = '/placeholder.jpg'

interface InventoryState {
  products: Product[]
  productCategories: ProductCategory[]
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

function withFallbackImageUrl(product: Product): Product {
  const imageUrl = product.imageUrl?.trim()
  return {
    ...product,
    imageUrl: imageUrl && imageUrl.length > 0 ? imageUrl : GENERIC_PRODUCT_IMAGE_SRC,
  }
}

function cloneInitialState(): InventoryState {
  return {
    products: [...baseProducts, ...shopProducts].map((product) =>
      withFallbackImageUrl({ ...product }),
    ),
    productCategories: [...baseProductCategories, ...shopProductCategories].map(
      (category) => ({ ...category }),
    ),
  }
}

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: cloneInitialState(),
  reducers: {
    hydrateInventoryState(_state, action: PayloadAction<InventoryState>) {
      return action.payload
    },
    addProduct(state, action: PayloadAction<Product>) {
      state.products.unshift(withFallbackImageUrl(action.payload))
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
      state.productCategories.push(action.payload)
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
} = inventorySlice.actions

export const inventoryReducer = inventorySlice.reducer
export type { InventoryState }

export const selectInventoryState = (state: RootState): InventoryState => state.inventory
export const selectInventoryProducts = (state: RootState): Product[] => state.inventory.products
export const selectInventoryProductCategories = (
  state: RootState,
): ProductCategory[] => state.inventory.productCategories
