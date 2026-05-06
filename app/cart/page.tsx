/** Cart page — shared cart for shop + future checkout flows. */
'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Minus, Plus, ShoppingBag } from 'lucide-react'

import { CouponPanel } from '@/components/customer/coupon-panel'
import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { RentalCartSidebar } from '@/components/customer/rental-cart-sidebar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useClients } from '@/lib/client-store'
import { formatModifierSummary } from '@/lib/cafe-utils'
import { calcCartTotals, formatPrice } from '@/lib/utils'
import { useInventory } from '@/lib/inventory-store'
import { isGiftProduct } from '@/lib/gift-product'
import {
  isEventCartBookingMetadata,
  isGymCartBookingMetadata,
  isPlayCartBookingMetadata,
} from '@/lib/play-cart'
import { collectRentalAcknowledgmentOptions } from '@/lib/rental-acknowledgments'
import { isRentalProduct } from '@/lib/rental-product'
import type { CartItem, Coupon } from '@/lib/types'

interface GiftBundleItem {
  readonly productId: string
  readonly name: string
  readonly imageUrl: string
  readonly unitPrice: number
  readonly quantity: number
}

interface GiftBundleMetadata {
  readonly giftBundle: true
  readonly primary: GiftBundleItem
  readonly addOns: GiftBundleItem[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseGiftBundleMetadata(value: unknown): GiftBundleMetadata | null {
  if (!isRecord(value)) return null
  if (value.giftBundle !== true) return null
  const primaryRaw = value.primary
  if (!isRecord(primaryRaw)) return null
  const addOnsRaw = Array.isArray(value.addOns) ? value.addOns : []
  const primary: GiftBundleItem = {
    productId: typeof primaryRaw.productId === 'string' ? primaryRaw.productId : '',
    name: typeof primaryRaw.name === 'string' ? primaryRaw.name : 'Gift item',
    imageUrl:
      typeof primaryRaw.imageUrl === 'string' ? primaryRaw.imageUrl : '/placeholder.jpg',
    unitPrice:
      typeof primaryRaw.unitPrice === 'number' && Number.isFinite(primaryRaw.unitPrice)
        ? primaryRaw.unitPrice
        : 0,
    quantity:
      typeof primaryRaw.quantity === 'number' && Number.isFinite(primaryRaw.quantity)
        ? Math.max(1, primaryRaw.quantity)
        : 1,
  }
  if (!primary.productId) return null
  const addOns = addOnsRaw
    .map((row) => {
      if (!isRecord(row)) return null
      const productId = typeof row.productId === 'string' ? row.productId : ''
      if (!productId) return null
      return {
        productId,
        name: typeof row.name === 'string' ? row.name : 'Add-on',
        imageUrl: typeof row.imageUrl === 'string' ? row.imageUrl : '/placeholder.jpg',
        unitPrice:
          typeof row.unitPrice === 'number' && Number.isFinite(row.unitPrice) ? row.unitPrice : 0,
        quantity:
          typeof row.quantity === 'number' && Number.isFinite(row.quantity)
            ? Math.max(1, row.quantity)
            : 1,
      } satisfies GiftBundleItem
    })
    .filter((row): row is GiftBundleItem => Boolean(row))
  return { giftBundle: true, primary, addOns }
}

export default function CartPage() {
  const [showRentalDetails, setShowRentalDetails] = useState(false)
  const [showShopSummary, setShowShopSummary] = useState(false)
  const [selectedGrouping, setSelectedGrouping] = useState<
    'rental' | 'request' | 'play' | 'gym' | 'event' | 'gift' | 'cafe' | 'shop' | null
  >(null)
  const {
    cart,
    products,
    productCategories,
    updateCartItem,
    removeFromCart,
    setCouponDirect,
    removeCoupon,
    setFulfillmentMode,
    setDeliveryFee,
    setAcknowledgments,
  } = useInventory()
  const { contacts, subscriptions } = useClients()
  const [editingGiftBundleItemId, setEditingGiftBundleItemId] = useState<string | null>(null)
  const [editingGiftPrimaryQty, setEditingGiftPrimaryQty] = useState(1)
  const [editingGiftAddOns, setEditingGiftAddOns] = useState<GiftBundleItem[]>([])
  const [viewingCafeItemId, setViewingCafeItemId] = useState<string | null>(null)

  const primaryContact =
    contacts.find((c) => c.contactType === 'CUSTOMER') ?? contacts[0] ?? null
  const hasActiveSubscription = Boolean(
    primaryContact &&
      subscriptions.some(
        (s) =>
          s.contactId === primaryContact.id &&
          (s.status === 'ACTIVE' ||
            s.status === 'TRIALING' ||
            s.status === 'PAUSED'),
      ),
  )

  const groupedRequestItems = useMemo(
    () =>
      cart.items.filter(
        (item) => item.type === 'booking' && typeof item.metadata?.requestType === 'string',
      ),
    [cart.items],
  )
  const playCartItems = useMemo(
    () =>
      cart.items.filter(
        (item) => item.type === 'booking' && isPlayCartBookingMetadata(item.metadata),
      ),
    [cart.items],
  )
  const gymCartItems = useMemo(
    () =>
      cart.items.filter(
        (item) => item.type === 'booking' && isGymCartBookingMetadata(item.metadata),
      ),
    [cart.items],
  )
  const eventCartItems = useMemo(
    () =>
      cart.items.filter(
        (item) => item.type === 'booking' && isEventCartBookingMetadata(item.metadata),
      ),
    [cart.items],
  )
  const standardItems = useMemo(
    () => cart.items.filter((item) => !groupedRequestItems.some((requestItem) => requestItem.id === item.id)),
    [cart.items, groupedRequestItems],
  )
  const rentalItems = useMemo(() => {
    return standardItems.filter((item) => {
      if (item.type !== 'product') return false
      const productId = item.metadata?.productId
      if (typeof productId !== 'string') return false
      const product = products.find((row) => row.id === productId) ?? null
      if (product) return isRentalProduct(product)
      return productId.startsWith('prod-rental-')
    })
  }, [products, standardItems])
  const rentalSubtotal = useMemo(
    () => rentalItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [rentalItems],
  )
  const rentalAcknowledgmentOptions = useMemo(
    () =>
      collectRentalAcknowledgmentOptions(rentalItems, products, productCategories),
    [productCategories, products, rentalItems],
  )
  const nonRentalItems = useMemo(
    () => standardItems.filter((item) => !rentalItems.some((rentalItem) => rentalItem.id === item.id)),
    [rentalItems, standardItems],
  )
  const giftCartItems = useMemo(() => {
    return nonRentalItems.filter((item) => {
      if (parseGiftBundleMetadata(item.metadata)) return true
      if (item.type !== 'product') return false
      const productId = item.metadata?.productId
      if (typeof productId !== 'string') return false
      const product = products.find((row) => row.id === productId) ?? null
      if (product) return isGiftProduct(product, productCategories)
      return false
    })
  }, [nonRentalItems, productCategories, products])
  const cafeCartItems = useMemo(() => {
    return nonRentalItems.filter((item) => {
      if (item.type !== 'product') return false
      const productId = item.metadata?.productId
      const isCafeByMetadata =
        item.metadata &&
        typeof item.metadata === 'object' &&
        (item.metadata as { itemType?: string }).itemType === 'cafe'
      if (isCafeByMetadata) return true
      if (typeof productId !== 'string') return false
      const product = products.find((row) => row.id === productId) ?? null
      if (!product) return false
      const category = productCategories.find((row) => row.id === product.categoryId) ?? null
      return (category?.productType ?? '').toLowerCase() === 'cafe&food'
    })
  }, [nonRentalItems, productCategories, products])
  const shopCartItems = useMemo(
    () =>
      nonRentalItems.filter(
        (item) =>
          !giftCartItems.some((giftItem) => giftItem.id === item.id) &&
          !cafeCartItems.some((cafeItem) => cafeItem.id === item.id) &&
          !playCartItems.some((playItem) => playItem.id === item.id) &&
          !gymCartItems.some((gymItem) => gymItem.id === item.id) &&
          !eventCartItems.some((eventItem) => eventItem.id === item.id),
      ),
    [cafeCartItems, eventCartItems, giftCartItems, gymCartItems, nonRentalItems, playCartItems],
  )
  const shopCheckoutEligibleItems = useMemo(
    () => [...groupedRequestItems, ...nonRentalItems],
    [groupedRequestItems, nonRentalItems],
  )
  const shopSidebarLineItems = useMemo((): readonly CartItem[] => {
    if (
      !showShopSummary ||
      selectedGrouping === null ||
      selectedGrouping === 'rental'
    ) {
      return []
    }
    switch (selectedGrouping) {
      case 'request':
        return groupedRequestItems
      case 'play':
        return playCartItems
      case 'gym':
        return gymCartItems
      case 'event':
        return eventCartItems
      case 'gift':
        return giftCartItems
      case 'cafe':
        return cafeCartItems
      case 'shop':
        return shopCartItems
      default:
        return []
    }
  }, [
    eventCartItems,
    cafeCartItems,
    giftCartItems,
    groupedRequestItems,
    gymCartItems,
    playCartItems,
    selectedGrouping,
    shopCartItems,
    showShopSummary,
  ])
  const shopCheckoutEligibleSubtotal = useMemo(
    () =>
      shopCheckoutEligibleItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [shopCheckoutEligibleItems],
  )
  const shopSidebarSubtotal = useMemo(
    () => shopSidebarLineItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [shopSidebarLineItems],
  )
  const shopSidebarCouponShare = useMemo(() => {
    if (cart.couponDiscount <= 0 || shopCheckoutEligibleSubtotal <= 0) {
      return 0
    }
    const raw =
      (cart.couponDiscount * shopSidebarSubtotal) / shopCheckoutEligibleSubtotal
    return Math.round(raw * 100) / 100
  }, [cart.couponDiscount, shopCheckoutEligibleSubtotal, shopSidebarSubtotal])
  const shopSidebarTotals = useMemo(
    () => calcCartTotals([...shopSidebarLineItems], shopSidebarCouponShare, 20),
    [shopSidebarCouponShare, shopSidebarLineItems],
  )
  const giftCartDeliveryFee = useMemo(() => {
    if (
      (selectedGrouping !== 'gift' && selectedGrouping !== 'cafe') ||
      cart.fulfillmentMode !== 'DELIVERY'
    ) {
      return 0
    }
    return Math.max(0, cart.deliveryFee ?? 0)
  }, [cart.deliveryFee, cart.fulfillmentMode, selectedGrouping])
  const giftRentalStyleTotal = useMemo(() => {
    const delivery =
      (selectedGrouping === 'gift' || selectedGrouping === 'cafe') &&
      cart.fulfillmentMode === 'DELIVERY'
        ? Math.max(0, cart.deliveryFee ?? 0)
        : 0
    return (
      Math.round((shopSidebarSubtotal + delivery + (cart.depositTotal ?? 0)) * 100) / 100
    )
  }, [
    cart.depositTotal,
    cart.deliveryFee,
    cart.fulfillmentMode,
    selectedGrouping,
    shopSidebarSubtotal,
  ])
  const editingGiftCartItem = useMemo(() => {
    if (!editingGiftBundleItemId) return null
    return cart.items.find((item) => item.id === editingGiftBundleItemId) ?? null
  }, [cart.items, editingGiftBundleItemId])
  const editingGiftMetadata = useMemo(
    () => parseGiftBundleMetadata(editingGiftCartItem?.metadata),
    [editingGiftCartItem?.metadata],
  )
  const viewingCafeItem = useMemo(() => {
    if (!viewingCafeItemId) return null
    return cart.items.find((item) => item.id === viewingCafeItemId) ?? null
  }, [cart.items, viewingCafeItemId])
  const viewingCafeCustomerNote = useMemo(() => {
    if (!viewingCafeItem?.metadata || typeof viewingCafeItem.metadata !== 'object') return ''
    const note = (viewingCafeItem.metadata as { customerNote?: unknown }).customerNote
    return typeof note === 'string' ? note.trim() : ''
  }, [viewingCafeItem?.metadata])
  const viewingCafeSelectedAttributes = useMemo(() => {
    if (!viewingCafeItem?.metadata || typeof viewingCafeItem.metadata !== 'object') return []
    const selectedAttributes = (
      viewingCafeItem.metadata as {
        selectedAttributes?: Array<{
          groupName?: unknown
          optionLabel?: unknown
        }>
      }
    ).selectedAttributes
    if (!Array.isArray(selectedAttributes)) return []
    return selectedAttributes
      .map((entry) =>
        typeof entry.groupName === 'string' && typeof entry.optionLabel === 'string'
          ? `${entry.groupName}: ${entry.optionLabel}`
          : '',
      )
      .filter((entry) => entry.length > 0)
  }, [viewingCafeItem?.metadata])
  const editingGiftTotal = useMemo(() => {
    if (!editingGiftMetadata) return 0
    const primaryTotal = editingGiftMetadata.primary.unitPrice * editingGiftPrimaryQty
    const addOnTotal = editingGiftAddOns.reduce(
      (sum, addOn) => sum + addOn.unitPrice * addOn.quantity,
      0,
    )
    return primaryTotal + addOnTotal
  }, [editingGiftAddOns, editingGiftMetadata, editingGiftPrimaryQty])

  function handleCouponApplied(coupon: Coupon | null, discountAmount: number) {
    if (!coupon || discountAmount <= 0) {
      removeCoupon()
      return
    }
    setCouponDirect(coupon.code, discountAmount)
  }

  function selectGrouping(
    grouping: 'rental' | 'request' | 'play' | 'gym' | 'event' | 'gift' | 'cafe' | 'shop',
  ) {
    setSelectedGrouping(grouping)
    if (grouping === 'rental') {
      setShowRentalDetails(true)
      setShowShopSummary(false)
      return
    }
    setShowShopSummary(true)
    setShowRentalDetails(false)
  }

  function openGiftBundleEditor(cartItemId: string) {
    const cartItem = cart.items.find((item) => item.id === cartItemId) ?? null
    const metadata = parseGiftBundleMetadata(cartItem?.metadata)
    if (!metadata) return
    setEditingGiftBundleItemId(cartItemId)
    setEditingGiftPrimaryQty(metadata.primary.quantity)
    setEditingGiftAddOns(metadata.addOns)
  }

  function closeGiftBundleEditor() {
    setEditingGiftBundleItemId(null)
    setEditingGiftPrimaryQty(1)
    setEditingGiftAddOns([])
  }

  function updateEditingGiftAddOnQuantity(productId: string, delta: number) {
    setEditingGiftAddOns((prev) =>
      prev.flatMap((item) => {
        if (item.productId !== productId) return [item]
        const nextQty = item.quantity + delta
        if (nextQty <= 0) return []
        return [{ ...item, quantity: nextQty }]
      }),
    )
  }

  function saveGiftBundleChanges() {
    if (!editingGiftCartItem || !editingGiftMetadata) return
    const nextMetadata: GiftBundleMetadata = {
      giftBundle: true,
      primary: {
        ...editingGiftMetadata.primary,
        quantity: editingGiftPrimaryQty,
      },
      addOns: editingGiftAddOns,
    }
    updateCartItem(editingGiftCartItem.id, {
      price: editingGiftTotal,
      quantity: 1,
      description: `${editingGiftPrimaryQty} gift item(s), ${editingGiftAddOns.length} add-on type(s)`,
      metadata: nextMetadata as unknown as Record<string, unknown>,
    })
    closeGiftBundleEditor()
  }

  return (
    <>
      <CustomerNavbar />
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link
            href="/store/shop"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Link>

          <h1
            className="text-3xl font-black text-foreground mb-8"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            Your cart
          </h1>

          {cart.items.length === 0 ? (
            <div className="text-center py-24 space-y-4">
              <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto" />
              <p className="text-xl font-bold text-muted-foreground">Your cart is empty</p>
              <Link href="/store/shop">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Browse products
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-4">
                {rentalItems.length > 0 ? (
                  <div
                    className="space-y-3 rounded-xl border border-border bg-card p-4 cursor-pointer"
                    onClick={() => selectGrouping('rental')}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                        Rental items
                      </h2>
                      <label
                        className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground"
                        onClick={(event) => {
                          event.stopPropagation()
                          selectGrouping('rental')
                        }}
                      >
                        <input
                          type="radio"
                          name="checkout-grouping"
                          checked={selectedGrouping === 'rental'}
                          onChange={() => selectGrouping('rental')}
                          className="h-4 w-4"
                        />
                        Open rental details
                      </label>
                    </div>
                    {rentalItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-border bg-background p-3 text-sm cursor-pointer"
                        onClick={() => {
                          selectGrouping('rental')
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{item.name}</p>
                            {item.description ? (
                              <p className="text-xs whitespace-pre-line text-muted-foreground">
                                {item.description}
                              </p>
                            ) : null}
                            <p className="mt-1 text-xs text-muted-foreground">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation()
                              removeFromCart(item.id)
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="font-semibold text-foreground">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {groupedRequestItems.length > 0 ? (
                  <div
                    className="space-y-3 rounded-xl border border-border bg-card p-4 cursor-pointer"
                    onClick={() => selectGrouping('request')}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                        Request bundles
                      </h2>
                      <label
                        className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground"
                        onClick={(event) => {
                          event.stopPropagation()
                          selectGrouping('request')
                        }}
                      >
                        <input
                          type="radio"
                          name="checkout-grouping"
                          checked={selectedGrouping === 'request'}
                          onChange={() => selectGrouping('request')}
                          className="h-4 w-4"
                        />
                        Open checkout details
                      </label>
                    </div>
                    {groupedRequestItems.map((item) => (
                      <div key={item.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{item.name}</p>
                            {item.description ? (
                              <p className="text-xs whitespace-pre-line text-muted-foreground">
                                {item.description}
                              </p>
                            ) : null}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)}>
                            Remove
                          </Button>
                        </div>
                        <p className="mt-2 font-semibold text-foreground">{formatPrice(item.price)}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {playCartItems.length > 0 ? (
                  <div
                    className="space-y-3 rounded-xl border border-border bg-card p-4 cursor-pointer"
                    onClick={() => selectGrouping('play')}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                        Play bookings
                      </h2>
                      <label
                        className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground"
                        onClick={(event) => {
                          event.stopPropagation()
                          selectGrouping('play')
                        }}
                      >
                        <input
                          type="radio"
                          name="checkout-grouping"
                          checked={selectedGrouping === 'play'}
                          onChange={() => selectGrouping('play')}
                          className="h-4 w-4"
                        />
                        Open checkout details
                      </label>
                    </div>
                    {playCartItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-border bg-background p-3 text-sm cursor-pointer"
                        onClick={() => {
                          selectGrouping('play')
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{item.name}</p>
                            {item.description ? (
                              <p className="text-xs whitespace-pre-line text-muted-foreground">
                                {item.description}
                              </p>
                            ) : null}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation()
                              removeFromCart(item.id)
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                        <p className="mt-2 font-semibold text-foreground">{formatPrice(item.price)}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {gymCartItems.length > 0 ? (
                  <div
                    className="space-y-3 rounded-xl border border-border bg-card p-4 cursor-pointer"
                    onClick={() => selectGrouping('gym')}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                        Gym bookings
                      </h2>
                      <label
                        className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground"
                        onClick={(event) => {
                          event.stopPropagation()
                          selectGrouping('gym')
                        }}
                      >
                        <input
                          type="radio"
                          name="checkout-grouping"
                          checked={selectedGrouping === 'gym'}
                          onChange={() => selectGrouping('gym')}
                          className="h-4 w-4"
                        />
                        Open checkout details
                      </label>
                    </div>
                    {gymCartItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-border bg-background p-3 text-sm cursor-pointer"
                        onClick={() => {
                          selectGrouping('gym')
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{item.name}</p>
                            {item.description ? (
                              <p className="text-xs whitespace-pre-line text-muted-foreground">
                                {item.description}
                              </p>
                            ) : null}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation()
                              removeFromCart(item.id)
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                        <p className="mt-2 font-semibold text-foreground">{formatPrice(item.price)}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {eventCartItems.length > 0 ? (
                  <div
                    className="space-y-3 rounded-xl border border-border bg-card p-4 cursor-pointer"
                    onClick={() => selectGrouping('event')}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                        Event bookings
                      </h2>
                      <label
                        className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground"
                        onClick={(event) => {
                          event.stopPropagation()
                          selectGrouping('event')
                        }}
                      >
                        <input
                          type="radio"
                          name="checkout-grouping"
                          checked={selectedGrouping === 'event'}
                          onChange={() => selectGrouping('event')}
                          className="h-4 w-4"
                        />
                        Open checkout details
                      </label>
                    </div>
                    {eventCartItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-border bg-background p-3 text-sm cursor-pointer"
                        onClick={() => {
                          selectGrouping('event')
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{item.name}</p>
                            {item.description ? (
                              <p className="text-xs whitespace-pre-line text-muted-foreground">
                                {item.description}
                              </p>
                            ) : null}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation()
                              removeFromCart(item.id)
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                        <p className="mt-2 font-semibold text-foreground">{formatPrice(item.price)}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {giftCartItems.length > 0 ? (
                  <div
                    className="space-y-3 rounded-xl border border-border bg-card p-4 cursor-pointer"
                    onClick={() => selectGrouping('gift')}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                        Gift items
                      </h2>
                      <label
                        className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground"
                        onClick={(event) => {
                          event.stopPropagation()
                          selectGrouping('gift')
                        }}
                      >
                        <input
                          type="radio"
                          name="checkout-grouping"
                          checked={selectedGrouping === 'gift'}
                          onChange={() => selectGrouping('gift')}
                          className="h-4 w-4"
                        />
                        Open checkout details
                      </label>
                    </div>
                    {giftCartItems.map((item) => (
                      <div key={item.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                        {(() => {
                          const giftBundle = parseGiftBundleMetadata(item.metadata)
                          if (giftBundle) {
                            return (
                              <>
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-foreground">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Gift x{giftBundle.primary.quantity} · Add-ons {giftBundle.addOns.length}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openGiftBundleEditor(item.id)}
                                    >
                                      View details
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)}>
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                  <p className="font-semibold text-foreground">{formatPrice(item.price)}</p>
                                </div>
                              </>
                            )
                          }
                          return (
                            <>
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-foreground">{item.name}</p>
                                  {item.description ? (
                                    <p className="text-xs whitespace-pre-line text-muted-foreground">
                                      {item.description}
                                    </p>
                                  ) : null}
                                  <p className="mt-1 text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)}>
                                  Remove
                                </Button>
                              </div>
                              <div className="mt-2 flex items-center justify-between">
                                <p className="font-semibold text-foreground">
                                  {formatPrice(item.price * item.quantity)}
                                </p>
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    ))}
                  </div>
                ) : null}

                {cafeCartItems.length > 0 ? (
                  <div
                    className="space-y-3 rounded-xl border border-border bg-card p-4 cursor-pointer"
                    onClick={() => selectGrouping('cafe')}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                        Cafe & Food items
                      </h2>
                      <label
                        className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground"
                        onClick={(event) => {
                          event.stopPropagation()
                          selectGrouping('cafe')
                        }}
                      >
                        <input
                          type="radio"
                          name="checkout-grouping"
                          checked={selectedGrouping === 'cafe'}
                          onChange={() => selectGrouping('cafe')}
                          className="h-4 w-4"
                        />
                        Open checkout details
                      </label>
                    </div>
                    {cafeCartItems.map((item) => (
                      <div key={item.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{item.name}</p>
                            {item.subtypeLabel?.trim() ? (
                              <p className="text-xs text-muted-foreground">{item.subtypeLabel}</p>
                            ) : null}
                            <p className="mt-1 text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingCafeItemId(item.id)}
                            >
                              View details
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)}>
                              Remove
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="font-semibold text-foreground">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {shopCartItems.length > 0 ? (
                  <div
                    className="space-y-3 rounded-xl border border-border bg-card p-4 cursor-pointer"
                    onClick={() => selectGrouping('shop')}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                        Shop & other items
                      </h2>
                      <label
                        className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground"
                        onClick={(event) => {
                          event.stopPropagation()
                          selectGrouping('shop')
                        }}
                      >
                        <input
                          type="radio"
                          name="checkout-grouping"
                          checked={selectedGrouping === 'shop'}
                          onChange={() => selectGrouping('shop')}
                          className="h-4 w-4"
                        />
                        Open checkout details
                      </label>
                    </div>
                    {shopCartItems.map((item) => (
                      <div key={item.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                        {(() => {
                          const giftBundle = parseGiftBundleMetadata(item.metadata)
                          if (giftBundle) {
                            return (
                              <>
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-foreground">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Gift x{giftBundle.primary.quantity} · Add-ons {giftBundle.addOns.length}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openGiftBundleEditor(item.id)}
                                    >
                                      View details
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)}>
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                  <p className="font-semibold text-foreground">{formatPrice(item.price)}</p>
                                </div>
                              </>
                            )
                          }
                          return (
                            <>
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-foreground">{item.name}</p>
                                  {(() => {
                                    const meta = item.metadata
                                    const isCafe =
                                      meta &&
                                      typeof meta === 'object' &&
                                      (meta as { itemType?: string }).itemType === 'cafe'
                                    return (
                                      <>
                                        {isCafe && item.subtypeLabel?.trim() ? (
                                          <p className="text-xs text-muted-foreground">{item.subtypeLabel}</p>
                                        ) : null}
                                        {isCafe && item.selectedModifiers?.length ? (
                                          <p className="text-xs text-muted-foreground">
                                            {formatModifierSummary(item.selectedModifiers)}
                                          </p>
                                        ) : null}
                                        {isCafe
                                          ? (() => {
                                              const note =
                                                item.metadata &&
                                                typeof item.metadata === 'object' &&
                                                typeof (
                                                  item.metadata as { customerNote?: unknown }
                                                ).customerNote === 'string'
                                                  ? (
                                                      (item.metadata as { customerNote?: string })
                                                        .customerNote ?? ''
                                                    ).trim()
                                                  : ''
                                              return note ? (
                                                <p className="text-xs text-muted-foreground">
                                                  Note: {note}
                                                </p>
                                              ) : null
                                            })()
                                          : null}
                                      </>
                                    )
                                  })()}
                                  {item.description ? (
                                    <p className="text-xs whitespace-pre-line text-muted-foreground">
                                      {item.description}
                                    </p>
                                  ) : null}
                                  <p className="mt-1 text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)}>
                                  Remove
                                </Button>
                              </div>
                              <div className="mt-2 flex items-center justify-between">
                                <p className="font-semibold text-foreground">
                                  {formatPrice(item.price * item.quantity)}
                                </p>
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <aside className="space-y-6">
                {rentalItems.length > 0 && showRentalDetails ? (
                  <RentalCartSidebar
                    cart={cart}
                    rentalSubtotal={rentalSubtotal}
                    acknowledgmentOptions={rentalAcknowledgmentOptions}
                    onSetFulfillmentMode={setFulfillmentMode}
                    onSetDeliveryFee={setDeliveryFee}
                    onSetAcknowledgments={setAcknowledgments}
                    onCouponApplied={handleCouponApplied}
                    hasActiveSubscription={hasActiveSubscription}
                    contactId={cart.contactId ?? primaryContact?.id}
                    externalAppliedCode={cart.couponCode}
                    externalDiscount={cart.couponDiscount}
                    onClose={() => {
                      setShowRentalDetails(false)
                    }}
                  />
                ) : null}
                {nonRentalItems.length > 0 &&
                showShopSummary &&
                !showRentalDetails ? (
                  <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                    <h2 className="font-bold text-lg">Shop order summary</h2>
                    <Separator />

                    {selectedGrouping === 'gift' || selectedGrouping === 'cafe' ? (
                      <>
                        <div className="space-y-3">
                          <Label>Fulfillment</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={cart.fulfillmentMode === 'PICKUP' ? 'default' : 'outline'}
                              onClick={() => setFulfillmentMode('PICKUP', null)}
                              className="flex-1"
                            >
                              Pickup
                            </Button>
                            <Button
                              type="button"
                              variant={cart.fulfillmentMode === 'DELIVERY' ? 'default' : 'outline'}
                              onClick={() => setFulfillmentMode('DELIVERY')}
                              className="flex-1"
                            >
                              Delivery
                            </Button>
                          </div>
                        </div>
                        {cart.fulfillmentMode === 'DELIVERY' ? (
                          <div className="space-y-3">
                            <Label htmlFor="delivery-address">Delivery address</Label>
                            <Input
                              id="delivery-address"
                              value={cart.deliveryAddress ?? ''}
                              onChange={(event) =>
                                setFulfillmentMode('DELIVERY', event.target.value)
                              }
                              placeholder="Street, city, postcode"
                            />
                            <Label htmlFor="delivery-fee">Delivery fee</Label>
                            <Input
                              id="delivery-fee"
                              type="number"
                              min={0}
                              value={cart.deliveryFee ?? 0}
                              onChange={(event) => setDeliveryFee(Number(event.target.value))}
                            />
                          </div>
                        ) : null}
                        <Separator />
                      </>
                    ) : null}

                    <CouponPanel
                      context="ORDER"
                      subtotal={shopSidebarSubtotal}
                      onCouponApplied={handleCouponApplied}
                      hasActiveSubscription={hasActiveSubscription}
                      contactId={cart.contactId ?? primaryContact?.id}
                      externalAppliedCode={cart.couponCode}
                      externalDiscount={cart.couponDiscount}
                    />

                    <Separator />

                    {shopSidebarLineItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No lines in this grouping. Choose another section or add items to this group.
                      </p>
                    ) : selectedGrouping === 'gift' || selectedGrouping === 'cafe' ? (
                      <div className="space-y-1 text-sm">
                        <p className="flex items-center justify-between text-muted-foreground">
                          <span>
                            {selectedGrouping === 'gift' ? 'Gift subtotal' : 'Cafe subtotal'}
                          </span>
                          <span>{formatPrice(shopSidebarSubtotal)}</span>
                        </p>
                        <p className="flex items-center justify-between text-muted-foreground">
                          <span>Delivery fee</span>
                          <span>{formatPrice(giftCartDeliveryFee)}</span>
                        </p>
                        <p className="flex items-center justify-between text-muted-foreground">
                          <span>Deposit</span>
                          <span>{formatPrice(cart.depositTotal ?? 0)}</span>
                        </p>
                        <Separator />
                        <p className="flex items-center justify-between text-base font-black text-foreground">
                          <span>Total</span>
                          <span className="text-accent">{formatPrice(giftRentalStyleTotal)}</span>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Subtotal</span>
                          <span>{formatPrice(shopSidebarTotals.subtotal)}</span>
                        </div>
                        {shopSidebarCouponShare > 0 ? (
                          <div className="flex justify-between text-green-700">
                            <span>Discount</span>
                            <span>-{formatPrice(shopSidebarCouponShare)}</span>
                          </div>
                        ) : null}
                        <div className="flex justify-between text-muted-foreground">
                          <span>VAT (20%)</span>
                          <span>{formatPrice(shopSidebarTotals.tax)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-black text-base">
                          <span>Total</span>
                          <span className="text-accent">{formatPrice(shopSidebarTotals.total)}</span>
                        </div>
                      </div>
                    )}

                    {shopSidebarLineItems.length === 0 ? (
                      <Button className="w-full font-bold h-11" type="button" disabled>
                        Nothing to checkout in this grouping
                      </Button>
                    ) : (
                      <Button
                        className="h-11 w-full bg-accent font-bold text-accent-foreground hover:bg-accent/90"
                        asChild
                      >
                        <Link href="/shop/checkout">Proceed to checkout</Link>
                      </Button>
                    )}
                  </div>
                ) : null}
                {!showRentalDetails && !showShopSummary ? (
                  <div className="rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
                    To proceed with checkout, select a cart grouping (Rental, Request bundles, Play
                    bookings, Gym bookings, Event bookings, Gift items, Cafe & Food items, or Shop & other items).
                  </div>
                ) : null}
                {rentalItems.length > 0 &&
                (giftCartItems.length > 0 ||
                  cafeCartItems.length > 0 ||
                  shopCartItems.length > 0 ||
                  playCartItems.length > 0 ||
                  gymCartItems.length > 0 ||
                  eventCartItems.length > 0) ? (
                  <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
                    Rentals use a separate checkout from play, gym, event, gift, and shop items.
                    Complete each flow when both are in your cart.
                  </div>
                ) : null}
              </aside>
            </div>
          )}
        </div>
      </main>
      <Dialog open={editingGiftBundleItemId !== null} onOpenChange={(open) => !open && closeGiftBundleEditor()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gift bundle details</DialogTitle>
            <DialogDescription>Adjust selected gift and add-on quantities.</DialogDescription>
          </DialogHeader>
          {editingGiftMetadata ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-md border border-border">
                  <Image
                    src={editingGiftMetadata.primary.imageUrl}
                    alt={editingGiftMetadata.primary.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {editingGiftMetadata.primary.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(editingGiftMetadata.primary.unitPrice)} each
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditingGiftPrimaryQty((prev) => Math.max(1, prev - 1))}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-6 text-center text-sm font-semibold">{editingGiftPrimaryQty}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditingGiftPrimaryQty((prev) => prev + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {editingGiftAddOns.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="relative h-12 w-12 overflow-hidden rounded-md border border-border">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(item.unitPrice)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateEditingGiftAddOnQuantity(item.productId, -1)}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateEditingGiftAddOnQuantity(item.productId, 1)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
                <span className="text-sm font-medium text-foreground">Bundle total</span>
                <span className="text-sm font-bold text-foreground">{formatPrice(editingGiftTotal)}</span>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeGiftBundleEditor}>
                  Cancel
                </Button>
                <Button type="button" onClick={saveGiftBundleChanges}>
                  Save changes
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog open={viewingCafeItemId !== null} onOpenChange={(open) => !open && setViewingCafeItemId(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Cafe item details</DialogTitle>
            <DialogDescription>Review customisation and notes for this line item.</DialogDescription>
          </DialogHeader>
          {viewingCafeItem ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3">
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{viewingCafeItem.name}</p>
                  {viewingCafeItem.subtypeLabel?.trim() ? (
                    <p className="text-xs text-muted-foreground">{viewingCafeItem.subtypeLabel}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">Qty: {viewingCafeItem.quantity}</p>
                </div>
                <p className="font-semibold text-foreground">
                  {formatPrice(viewingCafeItem.price * viewingCafeItem.quantity)}
                </p>
              </div>
              {viewingCafeItem.selectedModifiers?.length ? (
                <div className="space-y-1 rounded-lg border border-border bg-card p-3">
                  <p className="text-sm font-semibold text-foreground">Selected options</p>
                  <p className="text-sm text-muted-foreground">
                    {formatModifierSummary(viewingCafeItem.selectedModifiers)}
                  </p>
                </div>
              ) : null}
              {viewingCafeSelectedAttributes.length > 0 ? (
                <div className="space-y-1 rounded-lg border border-border bg-card p-3">
                  <p className="text-sm font-semibold text-foreground">Selected attributes</p>
                  <p className="text-sm text-muted-foreground">
                    {viewingCafeSelectedAttributes.join(' • ')}
                  </p>
                </div>
              ) : null}
              {viewingCafeCustomerNote ? (
                <div className="space-y-1 rounded-lg border border-border bg-card p-3">
                  <p className="text-sm font-semibold text-foreground">Notes</p>
                  <p className="text-sm text-muted-foreground">{viewingCafeCustomerNote}</p>
                </div>
              ) : null}
              {viewingCafeItem.description ? (
                <div className="space-y-1 rounded-lg border border-border bg-card p-3">
                  <p className="text-sm font-semibold text-foreground">Details</p>
                  <p className="text-sm text-muted-foreground">{viewingCafeItem.description}</p>
                </div>
              ) : null}
              <div className="flex justify-end">
                <Button type="button" onClick={() => setViewingCafeItemId(null)}>
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <CustomerFooter />
    </>
  )
}
