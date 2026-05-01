/** Inventory + shop store — products, stock movements, orders, coupons, and cart (mock-backed). */
'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

import {
  coupons as baseCoupons,
  orders as baseOrders,
  staffAssignments as seedStaffAssignments,
  shopCoupons,
  shopOrders,
  shopStockMovements,
  validateCouponCode,
} from '@/lib/mock-data'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import {
  addBookingAddOn as addBookingAddOnAction,
  addProduct as addProductAction,
  addProductCategory as addProductCategoryAction,
  deleteBookingAddOn as deleteBookingAddOnAction,
  deleteProduct as deleteProductAction,
  deleteProductCategory as deleteProductCategoryAction,
  reorderProductCategory as reorderProductCategoryAction,
  selectInventoryBookingAddOns,
  selectInventoryProductCategories,
  selectInventoryProducts,
  updateBookingAddOn as updateBookingAddOnAction,
  updateProduct as updateProductAction,
  updateProductCategory as updateProductCategoryAction,
} from '@/lib/redux/slices/inventory-slice'
import { plainTextFromHtml } from '@/lib/utils'
import type {
  AddOn,
  CartItem,
  CartState,
  Coupon,
  Order,
  Product,
  ProductCategory,
  RentalAcknowledgmentType,
  SavedPaymentMethod,
  StaffAssignment,
  StaffAssignmentStatus,
  StockMovement,
} from '@/lib/types'

const SHOP_CART_STORAGE_KEY = 'dt_cart'
const POS_CART_STORAGE_KEY = 'dt_pos_cart'
const PAYMENT_METHODS_STORAGE_KEY = 'dt_payment_methods'

function emptyCart(): CartState {
  return {
    items: [],
    couponCode: null,
    couponDiscount: 0,
    contactId: null,
    contactName: null,
    rentalStartAt: null,
    rentalEndAt: null,
    fulfillmentMode: null,
    deliveryAddress: null,
    deliveryFee: 0,
    depositTotal: 0,
    acknowledgments: [],
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
    const rentalStartAt = typeof parsed.rentalStartAt === 'string' ? parsed.rentalStartAt : null
    const rentalEndAt = typeof parsed.rentalEndAt === 'string' ? parsed.rentalEndAt : null
    const fulfillmentMode =
      parsed.fulfillmentMode === 'PICKUP' || parsed.fulfillmentMode === 'DELIVERY'
        ? parsed.fulfillmentMode
        : null
    const deliveryAddress = typeof parsed.deliveryAddress === 'string' ? parsed.deliveryAddress : null
    const deliveryFee =
      typeof parsed.deliveryFee === 'number' && Number.isFinite(parsed.deliveryFee) ? parsed.deliveryFee : 0
    const depositTotal =
      typeof parsed.depositTotal === 'number' && Number.isFinite(parsed.depositTotal) ? parsed.depositTotal : 0
    const acknowledgments = Array.isArray(parsed.acknowledgments)
      ? (parsed.acknowledgments.filter((entry): entry is RentalAcknowledgmentType => typeof entry === 'string') as RentalAcknowledgmentType[])
      : []

    return {
      items,
      couponCode,
      couponDiscount,
      contactId,
      contactName,
      rentalStartAt,
      rentalEndAt,
      fulfillmentMode,
      deliveryAddress,
      deliveryFee,
      depositTotal,
      acknowledgments,
    }
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
  staffAssignments: StaffAssignment[]
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
  createBookingAddOn: (input: {
    name: string
    description?: string
    pricingType: AddOn['pricingType']
    price: number
    memberPrice?: number | null
    isActive: boolean
    referenceType?: AddOn['referenceType']
    inventoryProductId?: string | null
  }) => AddOn
  updateBookingAddOn: (id: string, updates: Partial<AddOn>) => void
  deleteBookingAddOn: (id: string) => void
  delinkBookingAddOnFromProduct: (id: string) => void

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
  confirmRentalOrder: (id: string) => void
  markRentalOut: (id: string) => void
  markRentalReturned: (id: string) => void
  reportRentalDamage: (id: string, capturedAmount: number, notes: string) => void
  markInvitationDesignComplete: (id: string) => void
  assignStaffToAssignment: (assignmentId: string, staffId: string, notes?: string) => void
  updateStaffAssignmentStatus: (assignmentId: string, status: StaffAssignmentStatus) => void
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
  updateCartItem: (cartItemId: string, updates: Partial<CartItem>) => void
  updateCartQuantity: (cartItemId: string, quantity: number) => void
  applyCoupon: (code: string) => void
  /** Apply a code + discount already validated (e.g. shared CouponPanel). */
  setCouponDirect: (code: string, discount: number) => void
  removeCoupon: () => void
  clearCart: () => void
  setRentalDates: (start: string | null, end: string | null) => void
  setFulfillmentMode: (mode: 'PICKUP' | 'DELIVERY' | null, address?: string | null) => void
  setDeliveryFee: (fee: number) => void
  setDepositTotal: (amount: number) => void
  setAcknowledgments: (acknowledgments: RentalAcknowledgmentType[]) => void
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
  const dispatch = useAppDispatch()
  const products = useAppSelector(selectInventoryProducts)
  const productCategories = useAppSelector(selectInventoryProductCategories)
  const bookingAddOns = useAppSelector(selectInventoryBookingAddOns)
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() =>
    shopStockMovements.map((m) => ({ ...m })),
  )
  const [orders, setOrders] = useState<Order[]>(() => [
    ...baseOrders.map((o) => ({ ...o })),
    ...shopOrders.map((o) => ({ ...o })),
  ])
  const [staffAssignments, setStaffAssignments] = useState<StaffAssignment[]>(() =>
    seedStaffAssignments.map((assignment) => ({ ...assignment })),
  )
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
      dispatch(addProductAction(p))
    }

    function updateProduct(id: string, updates: Partial<Product>) {
      dispatch(updateProductAction({ id, updates }))
    }

    function deleteProduct(id: string) {
      const linkedAddOnId = products.find((product) => product.id === id)?.linkedAddOnId ?? null
      dispatch(deleteProductAction(id))
      if (linkedAddOnId) {
        dispatch(
          updateBookingAddOnAction({
            id: linkedAddOnId,
            updates: {
              inventoryProductId: null,
              referenceType: 'ALL',
            },
          }),
        )
      }
    }

    function createBookingAddOn(input: {
      name: string
      description?: string
      pricingType: AddOn['pricingType']
      price: number
      memberPrice?: number | null
      isActive: boolean
      referenceType?: AddOn['referenceType']
      inventoryProductId?: string | null
    }): AddOn {
      const created: AddOn = {
        id: `addon-admin-${Date.now()}`,
        tenantId: 'tenant-1',
        name: input.name.trim(),
        description: input.description?.trim() || undefined,
        pricingType: input.pricingType,
        price: input.price,
        memberPrice: input.memberPrice ?? null,
        referenceType: input.referenceType ?? 'ALL',
        inventoryProductId: input.inventoryProductId ?? null,
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
        isActive: input.isActive,
        deletedAt: null,
      }
      dispatch(addBookingAddOnAction(created))
      return created
    }

    function updateBookingAddOn(id: string, updates: Partial<AddOn>) {
      dispatch(updateBookingAddOnAction({ id, updates }))
    }

    function delinkBookingAddOnFromProduct(id: string) {
      const linkedProductIds = products
        .filter((product) => product.linkedAddOnId === id)
        .map((product) => product.id)
      for (const productId of linkedProductIds) {
        dispatch(
          updateProductAction({
            id: productId,
            updates: {
              linkedAddOnId: null,
              canBeAddOn: false,
            },
          }),
        )
      }
      dispatch(deleteBookingAddOnAction(id))
    }

    function deleteBookingAddOn(id: string) {
      const linkedProductIds = products
        .filter((product) => product.linkedAddOnId === id)
        .map((product) => product.id)
      for (const productId of linkedProductIds) {
        dispatch(
          updateProductAction({
            id: productId,
            updates: {
              linkedAddOnId: null,
              canBeAddOn: false,
            },
          }),
        )
      }
      dispatch(deleteBookingAddOnAction(id))
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
      const parentKey = input.parentId ?? null
      const parentProductType =
        parentKey != null
          ? productCategories.find((category) => category.id === parentKey)?.productType
          : null
      const nextProductType = input.productType?.trim().toLowerCase() || parentProductType || 'shop'
      const siblings = productCategories.filter((category) => (category.parentId ?? null) === parentKey)
      const maxOrder = siblings.reduce((max, category) => Math.max(max, category.displayOrder), 0)
      const created: ProductCategory = {
        id,
        tenantId: 'tenant-1',
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || undefined,
        displayOrder: maxOrder + 1,
        productType: nextProductType,
        parentId: parentKey,
      }
      dispatch(addProductCategoryAction(created))
      return created
    }

    function updateProductCategory(id: string, patch: Partial<ProductCategory>) {
      dispatch(updateProductCategoryAction({ id, patch }))
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
      dispatch(deleteProductCategoryAction(id))
      return { ok: true }
    }

    function reorderProductCategory(categoryId: string, direction: 'up' | 'down') {
      dispatch(reorderProductCategoryAction({ id: categoryId, direction }))
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
        memberPrice: product.memberPrice ?? null,
        referenceType: 'PRODUCT',
        inventoryProductId: product.id,
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
      dispatch(addBookingAddOnAction(row))
      dispatch(
        updateProductAction({
          id: productId,
          updates: {
            canBeAddOn: true,
            linkedAddOnId: addOnId,
          },
        }),
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
      const product = products.find((p) => p.id === productId)
      if (!product) return
      const nowIso = new Date().toISOString()
      const previousStock = product.stockCount
      const newStock = Math.max(0, previousStock + quantity)
      dispatch(
        updateProductAction({
          id: productId,
          updates: { stockCount: newStock, updatedAt: nowIso },
        }),
      )
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

    function confirmRentalOrder(id: string) {
      const nowIso = new Date().toISOString()
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? { ...o, rentalStatus: 'CONFIRMED', status: 'PROCESSING', updatedAt: nowIso }
            : o,
        ),
      )
    }

    function markRentalOut(id: string) {
      const nowIso = new Date().toISOString()
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, rentalStatus: 'OUT', status: 'PROCESSING', updatedAt: nowIso } : o,
        ),
      )
    }

    function markRentalReturned(id: string) {
      const nowIso = new Date().toISOString()
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? { ...o, rentalStatus: 'RETURNED', status: 'DELIVERED', updatedAt: nowIso }
            : o,
        ),
      )
    }

    function reportRentalDamage(id: string, capturedAmount: number, notes: string) {
      const nowIso = new Date().toISOString()
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                rentalStatus: 'COMPLETED',
                status: 'DELIVERED',
                depositCapturedAmount: Math.max(0, capturedAmount),
                damageNotes: notes,
                updatedAt: nowIso,
              }
            : o,
        ),
      )
    }

    function markInvitationDesignComplete(id: string) {
      const nowIso = new Date().toISOString()
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? { ...o, designCompletedAt: nowIso, status: 'DELIVERED', updatedAt: nowIso }
            : o,
        ),
      )
    }

    function assignStaffToAssignment(assignmentId: string, staffId: string, notes?: string) {
      const nowIso = new Date().toISOString()
      setStaffAssignments((prev) =>
        prev.map((assignment) =>
          assignment.id === assignmentId
            ? {
                ...assignment,
                staffId,
                status: 'CONFIRMED',
                notes: notes != null && notes.length > 0 ? notes : assignment.notes,
                updatedAt: nowIso,
              }
            : assignment,
        ),
      )
    }

    function updateStaffAssignmentStatus(assignmentId: string, status: StaffAssignmentStatus) {
      const nowIso = new Date().toISOString()
      setStaffAssignments((prev) =>
        prev.map((assignment) =>
          assignment.id === assignmentId
            ? {
                ...assignment,
                status,
                updatedAt: nowIso,
              }
            : assignment,
        ),
      )
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

    function updateCartItem(cartItemId: string, updates: Partial<CartItem>) {
      setCart((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === cartItemId ? { ...item, ...updates } : item,
        ),
      }))
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

    function setRentalDates(start: string | null, end: string | null) {
      setCart((prev) => ({ ...prev, rentalStartAt: start, rentalEndAt: end }))
    }

    function setFulfillmentMode(mode: 'PICKUP' | 'DELIVERY' | null, address?: string | null) {
      setCart((prev) => ({
        ...prev,
        fulfillmentMode: mode,
        deliveryAddress: mode === 'DELIVERY' ? (address ?? prev.deliveryAddress ?? '') : null,
      }))
    }

    function setDeliveryFee(fee: number) {
      setCart((prev) => ({ ...prev, deliveryFee: Math.max(0, fee) }))
    }

    function setDepositTotal(amount: number) {
      setCart((prev) => ({ ...prev, depositTotal: Math.max(0, amount) }))
    }

    function setAcknowledgments(acknowledgments: RentalAcknowledgmentType[]) {
      setCart((prev) => ({ ...prev, acknowledgments }))
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
      staffAssignments,
      coupons,
      cart,
      posCart,
      paymentMethods,
      addProduct,
      updateProduct,
      deleteProduct,
      createBookingAddOn,
      updateBookingAddOn,
      deleteBookingAddOn,
      delinkBookingAddOnFromProduct,
      addProductCategory,
      updateProductCategory,
      deleteProductCategory,
      reorderProductCategory,
      promoteProductToAddOn,
      adjustStock,
      addOrder,
      confirmRentalOrder,
      markRentalOut,
      markRentalReturned,
      reportRentalDamage,
      markInvitationDesignComplete,
      assignStaffToAssignment,
      updateStaffAssignmentStatus,
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
      updateCartItem,
      updateCartQuantity,
      applyCoupon,
      setCouponDirect,
      removeCoupon,
      clearCart,
      setRentalDates,
      setFulfillmentMode,
      setDeliveryFee,
      setDepositTotal,
      setAcknowledgments,
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
    staffAssignments,
    stockMovements,
  ])

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}

export function useInventory(): InventoryStore {
  const ctx = useContext(InventoryContext)
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider')
  return ctx
}

