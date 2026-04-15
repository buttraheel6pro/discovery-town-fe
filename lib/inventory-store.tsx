/** Inventory + shop store — products, stock movements, orders, coupons, and cart (mock-backed). */
'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

import {
  addOns as seedAddOns,
  coupons as baseCoupons,
  orders as baseOrders,
  productCategories as baseProductCategories,
  products as baseProducts,
  shopCoupons,
  shopOrders,
  shopProductCategories,
  shopProducts,
  shopStockMovements,
  validateCouponCode,
} from '@/lib/mock-data'
import { plainTextFromHtml } from '@/lib/utils'
import type {
  AddOn,
  CartItem,
  CartState,
  Coupon,
  Order,
  Product,
  ProductCategory,
  SavedPaymentMethod,
  StockMovement,
} from '@/lib/types'

const SHOP_CART_STORAGE_KEY = 'dt_cart'
const POS_CART_STORAGE_KEY = 'dt_pos_cart'
const PAYMENT_METHODS_STORAGE_KEY = 'dt_payment_methods'
const GENERIC_PRODUCT_IMAGE_SRC = '/placeholder.jpg'

function withFallbackImageUrl(p: Product): Product {
  const imageUrl = p.imageUrl?.trim()
  return { ...p, imageUrl: imageUrl && imageUrl.length > 0 ? imageUrl : GENERIC_PRODUCT_IMAGE_SRC }
}

function emptyCart(): CartState {
  return {
    items: [],
    couponCode: null,
    couponDiscount: 0,
    contactId: null,
    contactName: null,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function loadCartFromStorage(storageKey: string): CartState {
  if (typeof window === 'undefined') return emptyCart()
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return emptyCart()
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return emptyCart()
    const itemsRaw = parsed.items
    const items: CartItem[] = Array.isArray(itemsRaw) ? (itemsRaw as CartItem[]) : []
    const couponCode = typeof parsed.couponCode === 'string' ? parsed.couponCode : null
    const couponDiscount =
      typeof parsed.couponDiscount === 'number' && Number.isFinite(parsed.couponDiscount)
        ? parsed.couponDiscount
        : 0
    const contactId = typeof parsed.contactId === 'string' ? parsed.contactId : null
    const contactName = typeof parsed.contactName === 'string' ? parsed.contactName : null

    return { items, couponCode, couponDiscount, contactId, contactName }
  } catch {
    return emptyCart()
  }
}

function loadPaymentMethodsFromStorage(): SavedPaymentMethod[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(PAYMENT_METHODS_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as SavedPaymentMethod[]
  } catch {
    return []
  }
}

type StockMovementType = StockMovement['movementType']

export type DeleteProductCategoryResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string }

export type PromoteProductToAddOnResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string }

function slugifyCategoryName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

interface InventoryStore {
  products: Product[]
  productCategories: ProductCategory[]
  /** Mutable booking add-on catalog (inventory CRUD + product promotion). */
  bookingAddOns: AddOn[]
  stockMovements: StockMovement[]
  orders: Order[]
  coupons: Coupon[]
  /** Consumer/shop cart (persisted). */
  cart: CartState
  /** Admin POS cart (separate + persisted). */
  posCart: CartState
  /** Saved cards (mock + stored locally). */
  paymentMethods: SavedPaymentMethod[]

  addProduct: (p: Product) => void
  updateProduct: (id: string, updates: Partial<Product>) => void
  deleteProduct: (id: string) => void

  addProductCategory: (input: {
    name: string
    productType?: string
    parentId?: string | null
    description?: string
  }) => ProductCategory
  updateProductCategory: (id: string, patch: Partial<ProductCategory>) => void
  deleteProductCategory: (id: string) => DeleteProductCategoryResult
  reorderProductCategory: (id: string, direction: 'up' | 'down') => void
  /** Link product to booking add-on catalog (idempotent; upserts catalog row). */
  promoteProductToAddOn: (productId: string, productSnapshot?: Product) => PromoteProductToAddOnResult

  adjustStock: (
    productId: string,
    quantity: number,
    type: StockMovementType,
    notes?: string,
    referenceId?: string,
  ) => void

  addOrder: (o: Order) => void
  fulfillOrder: (id: string) => void
  cancelOrder: (id: string, reason: string) => void
  refundOrder: (id: string, amount: number, reason: string) => void
  updateOrderNotes: (id: string, notes: string) => void

  addCoupon: (c: Coupon) => void
  updateCoupon: (id: string, updates: Partial<Coupon>) => void
  deleteCoupon: (id: string) => void
  incrementRedemption: (code: string) => void

  addToCart: (input: {
    product: Product
    quantity?: number
  }) => void
  addCustomCartItem: (input: {
    type: CartItem['type']
    name: string
    description?: string
    price: number
    quantity?: number
    imageUrl?: string
    metadata?: Record<string, unknown>
  }) => void
  removeFromCart: (cartItemId: string) => void
  updateCartQuantity: (cartItemId: string, quantity: number) => void
  applyCoupon: (code: string) => void
  /** Apply a code + discount already validated (e.g. shared CouponPanel). */
  setCouponDirect: (code: string, discount: number) => void
  removeCoupon: () => void
  clearCart: () => void
  attachCustomer: (contactId: string, contactName: string) => void
  detachCustomer: () => void

  addToPosCart: (input: {
    product: Product
    quantity?: number
  }) => void
  removeFromPosCart: (cartItemId: string) => void
  updatePosCartQuantity: (cartItemId: string, quantity: number) => void
  applyPosCoupon: (code: string) => void
  removePosCoupon: () => void
  clearPosCart: () => void
  attachPosCustomer: (contactId: string, contactName: string) => void
  detachPosCustomer: () => void

  savePaymentMethod: (input: Omit<SavedPaymentMethod, 'id' | 'createdAt'>) => SavedPaymentMethod
  setDefaultPaymentMethod: (id: string) => void
}

const InventoryContext = createContext<InventoryStore | null>(null)

export function InventoryProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [products, setProducts] = useState<Product[]>(() => [
    ...baseProducts.map((p) => withFallbackImageUrl(p)),
    ...shopProducts.map((p) => withFallbackImageUrl(p)),
  ])
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(() => [
    ...baseProductCategories.map((c) => ({ ...c })),
    ...shopProductCategories.map((c) => ({ ...c })),
  ])
  const [bookingAddOns, setBookingAddOns] = useState<AddOn[]>(() =>
    seedAddOns.map((a) => ({ ...a, applicableServiceTypes: [...a.applicableServiceTypes] })),
  )
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() =>
    shopStockMovements.map((m) => ({ ...m })),
  )
  const [orders, setOrders] = useState<Order[]>(() => [
    ...baseOrders.map((o) => ({ ...o })),
    ...shopOrders.map((o) => ({ ...o })),
  ])
  const [coupons, setCoupons] = useState<Coupon[]>(() => [
    ...baseCoupons.map((c) => ({ ...c })),
    ...shopCoupons.map((c) => ({ ...c })),
  ])
  const [cart, setCart] = useState<CartState>(emptyCart)
  const [posCart, setPosCart] = useState<CartState>(emptyCart)
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([])
  const [storageReady, setStorageReady] = useState(false)

  useEffect(() => {
    setCart(loadCartFromStorage(SHOP_CART_STORAGE_KEY))
    setPosCart(loadCartFromStorage(POS_CART_STORAGE_KEY))
    setPaymentMethods(loadPaymentMethodsFromStorage())
    setStorageReady(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !storageReady) return
    window.localStorage.setItem(SHOP_CART_STORAGE_KEY, JSON.stringify(cart))
  }, [cart, storageReady])

  useEffect(() => {
    if (typeof window === 'undefined' || !storageReady) return
    window.localStorage.setItem(POS_CART_STORAGE_KEY, JSON.stringify(posCart))
  }, [posCart, storageReady])

  useEffect(() => {
    if (typeof window === 'undefined' || !storageReady) return
    window.localStorage.setItem(PAYMENT_METHODS_STORAGE_KEY, JSON.stringify(paymentMethods))
  }, [paymentMethods, storageReady])

  const value = useMemo<InventoryStore>(() => {
    function addProduct(p: Product) {
      setProducts((prev) => [p, ...prev])
    }

    function updateProduct(id: string, updates: Partial<Product>) {
      const updatedAt = new Date().toISOString()
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt } : p)),
      )
    }

    function deleteProduct(id: string) {
      setProducts((prev) => prev.filter((p) => p.id !== id))
    }

    function addProductCategory(input: {
      name: string
      productType?: string
      parentId?: string | null
      description?: string
    }): ProductCategory {
      const id = `pcat-${Date.now()}`
      const slugBase = slugifyCategoryName(input.name)
      const slug = slugBase.length > 0 ? slugBase : id
      let created!: ProductCategory
      setProductCategories((prev) => {
        const parentKey = input.parentId ?? null
        const parentProductType =
          parentKey != null
            ? prev.find((c) => c.id === parentKey)?.productType
            : null
        const nextProductType =
          input.productType?.trim().toLowerCase() ||
          parentProductType ||
          'shop'
        const siblings = prev.filter((c) => (c.parentId ?? null) === parentKey)
        const maxOrder = siblings.reduce((m, c) => Math.max(m, c.displayOrder), 0)
        created = {
          id,
          tenantId: 'tenant-1',
          name: input.name.trim(),
          slug,
          description: input.description?.trim() || undefined,
          displayOrder: maxOrder + 1,
          productType: nextProductType,
          parentId: parentKey,
        }
        return [...prev, created]
      })
      return created
    }

    function updateProductCategory(id: string, patch: Partial<ProductCategory>) {
      setProductCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch, id: c.id } : c)),
      )
    }

    function deleteProductCategory(id: string): DeleteProductCategoryResult {
      const children = productCategories.filter((c) => (c.parentId ?? null) === id)
      if (children.length > 0) {
        return {
          ok: false,
          message: `This category has ${children.length} sub-categories. Remove them first.`,
        }
      }
      const productCount = products.filter((p) => p.categoryId === id).length
      if (productCount > 0) {
        return {
          ok: false,
          message: `This category has ${productCount} products. Move or delete them before removing the category.`,
        }
      }
      setProductCategories((prev) => prev.filter((c) => c.id !== id))
      return { ok: true }
    }

    function reorderProductCategory(categoryId: string, direction: 'up' | 'down') {
      setProductCategories((prev) => {
        const cat = prev.find((c) => c.id === categoryId)
        if (!cat) return prev
        const parentKey = cat.parentId ?? null
        const siblings = prev
          .filter((c) => (c.parentId ?? null) === parentKey)
          .slice()
          .sort((a, b) => a.displayOrder - b.displayOrder)
        const idx = siblings.findIndex((c) => c.id === categoryId)
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1
        if (swapIdx < 0 || swapIdx >= siblings.length) return prev
        const a = siblings[idx]
        const b = siblings[swapIdx]
        const orderA = b.displayOrder
        const orderB = a.displayOrder
        return prev.map((c) => {
          if (c.id === a.id) return { ...c, displayOrder: orderA }
          if (c.id === b.id) return { ...c, displayOrder: orderB }
          return c
        })
      })
    }

    function promoteProductToAddOn(
      productId: string,
      productSnapshot?: Product,
    ): PromoteProductToAddOnResult {
      const product = productSnapshot ?? products.find((p) => p.id === productId)
      if (!product) {
        return { ok: false, message: 'Product not found.' }
      }
      const addOnId =
        product.linkedAddOnId?.trim() && product.linkedAddOnId.trim().length > 0
          ? product.linkedAddOnId.trim()
          : `addon-prod-${productId}`
      const price = product.memberPrice ?? product.price
      const desc = plainTextFromHtml(product.description)
      const row: AddOn = {
        id: addOnId,
        tenantId: product.tenantId,
        name: product.name,
        description: desc,
        pricingType: 'FLAT',
        price,
        applicableServiceTypes: [
          'CLASS',
          'PLAY_AREA',
          'PARTY',
          'COURT',
          'SWIMMING',
          'WORKSHOP',
          'CAMP',
          'COACHING',
        ],
        isActive: product.isActive,
      }
      setBookingAddOns((prev) => {
        const without = prev.filter((a) => a.id !== addOnId)
        return [...without, row]
      })
      const updatedAt = new Date().toISOString()
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, canBeAddOn: true, linkedAddOnId: addOnId, updatedAt }
            : p,
        ),
      )
      return { ok: true }
    }

    function adjustStock(
      productId: string,
      quantity: number,
      type: StockMovementType,
      notes?: string,
      referenceId?: string,
    ) {
      const nowIso = new Date().toISOString()
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p
          const previousStock = p.stockCount
          const newStock = Math.max(0, previousStock + quantity)
          return { ...p, stockCount: newStock, updatedAt: nowIso }
        }),
      )

      const product = products.find((p) => p.id === productId)
      if (!product) return
      const previousStock = product.stockCount
      const newStock = Math.max(0, previousStock + quantity)
      const movement: StockMovement = {
        id: `sm-${Date.now()}`,
        tenantId: product.tenantId,
        productId,
        movementType: type,
        quantity,
        previousStock,
        newStock,
        balanceAfter: newStock,
        notes,
        referenceId: referenceId ?? null,
        createdBy: 'Admin',
        createdAt: nowIso,
      }
      setStockMovements((prev) => [movement, ...prev])
    }

    function incrementRedemption(code: string) {
      const normalized = code.trim().toUpperCase()
      setCoupons((prev) =>
        prev.map((c) =>
          c.code.toUpperCase() === normalized
            ? {
                ...c,
                usageCount: c.usageCount + 1,
                redemptionCount: (c.redemptionCount ?? c.usageCount) + 1,
              }
            : c,
        ),
      )
    }

    function addOrder(o: Order) {
      setOrders((prev) => [o, ...prev])
      for (const li of o.items) {
        adjustStock(li.productId, -Math.abs(li.quantity), 'SALE', undefined, o.id)
      }
      if (o.couponCode) incrementRedemption(o.couponCode)
    }

    function fulfillOrder(id: string) {
      const nowIso = new Date().toISOString()
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, status: 'DELIVERED', fulfilledAt: nowIso, updatedAt: nowIso } : o,
        ),
      )
    }

    function cancelOrder(id: string, reason: string) {
      const nowIso = new Date().toISOString()
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: 'CANCELLED', notes: reason, updatedAt: nowIso } : o)),
      )
    }

    function refundOrder(id: string, amount: number, reason: string) {
      const nowIso = new Date().toISOString()
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                status: 'REFUNDED',
                paymentStatus: 'REFUNDED',
                refundAmount: amount,
                refundReason: reason,
                updatedAt: nowIso,
              }
            : o,
        ),
      )
    }

    function updateOrderNotes(id: string, notes: string) {
      const nowIso = new Date().toISOString()
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, notes, updatedAt: nowIso } : o)),
      )
    }

    function addCoupon(c: Coupon) {
      setCoupons((prev) => [c, ...prev])
    }

    function updateCoupon(id: string, updates: Partial<Coupon>) {
      setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
    }

    function deleteCoupon(id: string) {
      setCoupons((prev) => prev.filter((c) => c.id !== id))
    }

    function addToCart(input: { product: Product; quantity?: number }) {
      const qty = Math.max(1, input.quantity ?? 1)
      setCart((prev) => {
        const existing = prev.items.find(
          (i) => i.type === 'product' && i.metadata?.productId === input.product.id,
        )
        if (existing) {
          return {
            ...prev,
            items: prev.items.map((i) =>
              i.id === existing.id ? { ...i, quantity: i.quantity + qty } : i,
            ),
          }
        }

        const item: CartItem = {
          id: `cart-${input.product.id}`,
          type: 'product',
          name: input.product.name,
          description: input.product.sku,
          price: input.product.memberPrice ?? input.product.price,
          quantity: qty,
          imageUrl: input.product.imageUrl,
          metadata: { productId: input.product.id },
        }

        return { ...prev, items: [...prev.items, item] }
      })
    }

    function addToPosCart(input: { product: Product; quantity?: number }) {
      const qty = Math.max(1, input.quantity ?? 1)
      setPosCart((prev) => {
        const existing = prev.items.find(
          (i) => i.type === 'product' && i.metadata?.productId === input.product.id,
        )
        if (existing) {
          return {
            ...prev,
            items: prev.items.map((i) =>
              i.id === existing.id ? { ...i, quantity: i.quantity + qty } : i,
            ),
          }
        }

        const item: CartItem = {
          id: `pos-cart-${input.product.id}`,
          type: 'product',
          name: input.product.name,
          description: input.product.sku,
          price: input.product.memberPrice ?? input.product.price,
          quantity: qty,
          imageUrl: input.product.imageUrl,
          metadata: { productId: input.product.id },
        }

        return { ...prev, items: [...prev.items, item] }
      })
    }

    function addCustomCartItem(input: {
      type: CartItem['type']
      name: string
      description?: string
      price: number
      quantity?: number
      imageUrl?: string
      metadata?: Record<string, unknown>
    }) {
      const qty = Math.max(1, input.quantity ?? 1)
      const item: CartItem = {
        id: `cart-custom-${Date.now()}`,
        type: input.type,
        name: input.name,
        description: input.description,
        price: input.price,
        quantity: qty,
        imageUrl: input.imageUrl,
        metadata: input.metadata,
      }
      setCart((prev) => ({ ...prev, items: [...prev.items, item] }))
    }

    function removeFromCart(cartItemId: string) {
      setCart((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== cartItemId) }))
    }

    function removeFromPosCart(cartItemId: string) {
      setPosCart((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== cartItemId) }))
    }

    function updateCartQuantity(cartItemId: string, quantity: number) {
      const nextQty = Math.max(1, quantity)
      setCart((prev) => ({
        ...prev,
        items: prev.items.map((i) => (i.id === cartItemId ? { ...i, quantity: nextQty } : i)),
      }))
    }

    function updatePosCartQuantity(cartItemId: string, quantity: number) {
      const nextQty = Math.max(1, quantity)
      setPosCart((prev) => ({
        ...prev,
        items: prev.items.map((i) => (i.id === cartItemId ? { ...i, quantity: nextQty } : i)),
      }))
    }

    function applyCoupon(code: string) {
      const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0)
      const result = validateCouponCode(code, subtotal, cart.contactId ?? undefined)
      if (!result.valid) return
      setCart((prev) => ({ ...prev, couponCode: code.trim().toUpperCase(), couponDiscount: result.discountAmount }))
    }

    function setCouponDirect(code: string, discount: number) {
      const normalized = code.trim().toUpperCase()
      setCart((prev) => ({
        ...prev,
        couponCode: normalized.length > 0 ? normalized : null,
        couponDiscount: Math.max(0, discount),
      }))
    }

    function applyPosCoupon(code: string) {
      const subtotal = posCart.items.reduce((s, i) => s + i.price * i.quantity, 0)
      const result = validateCouponCode(code, subtotal, posCart.contactId ?? undefined)
      if (!result.valid) return
      setPosCart((prev) => ({ ...prev, couponCode: code.trim().toUpperCase(), couponDiscount: result.discountAmount }))
    }

    function removeCoupon() {
      setCart((prev) => ({ ...prev, couponCode: null, couponDiscount: 0 }))
    }

    function removePosCoupon() {
      setPosCart((prev) => ({ ...prev, couponCode: null, couponDiscount: 0 }))
    }

    function clearCart() {
      setCart(emptyCart())
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(SHOP_CART_STORAGE_KEY)
      }
    }

    function clearPosCart() {
      setPosCart(emptyCart())
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(POS_CART_STORAGE_KEY)
      }
    }

    function attachCustomer(contactId: string, contactName: string) {
      setCart((prev) => ({ ...prev, contactId, contactName }))
    }

    function attachPosCustomer(contactId: string, contactName: string) {
      setPosCart((prev) => ({ ...prev, contactId, contactName }))
    }

    function detachCustomer() {
      setCart((prev) => ({ ...prev, contactId: null, contactName: null }))
    }

    function detachPosCustomer() {
      setPosCart((prev) => ({ ...prev, contactId: null, contactName: null }))
    }

    function savePaymentMethod(input: Omit<SavedPaymentMethod, 'id' | 'createdAt'>): SavedPaymentMethod {
      const nowIso = new Date().toISOString()
      const method: SavedPaymentMethod = {
        ...input,
        id: `pm-${Date.now()}`,
        createdAt: nowIso,
      }
      setPaymentMethods((prev) => {
        const next = prev.map((m) => (input.isDefault ? { ...m, isDefault: false } : m))
        return [method, ...next]
      })
      return method
    }

    function setDefaultPaymentMethod(id: string) {
      setPaymentMethods((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })))
    }

    return {
      products,
      productCategories,
      bookingAddOns,
      stockMovements,
      orders,
      coupons,
      cart,
      posCart,
      paymentMethods,
      addProduct,
      updateProduct,
      deleteProduct,
      addProductCategory,
      updateProductCategory,
      deleteProductCategory,
      reorderProductCategory,
      promoteProductToAddOn,
      adjustStock,
      addOrder,
      fulfillOrder,
      cancelOrder,
      refundOrder,
      updateOrderNotes,
      addCoupon,
      updateCoupon,
      deleteCoupon,
      incrementRedemption,
      addToCart,
      addCustomCartItem,
      removeFromCart,
      updateCartQuantity,
      applyCoupon,
      setCouponDirect,
      removeCoupon,
      clearCart,
      attachCustomer,
      detachCustomer,
      addToPosCart,
      removeFromPosCart,
      updatePosCartQuantity,
      applyPosCoupon,
      removePosCoupon,
      clearPosCart,
      attachPosCustomer,
      detachPosCustomer,
      savePaymentMethod,
      setDefaultPaymentMethod,
    }
  }, [
    bookingAddOns,
    cart,
    coupons,
    orders,
    paymentMethods,
    posCart,
    productCategories,
    products,
    stockMovements,
  ])

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}

export function useInventory(): InventoryStore {
  const ctx = useContext(InventoryContext)
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider')
  return ctx
}

