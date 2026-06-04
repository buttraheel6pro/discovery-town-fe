/** Shop product detail client — quantity + add/buy actions, gallery, related products. */
'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Minus, Plus, ShoppingCart } from 'lucide-react'

import { ShopProductLinkedAddOnSection } from '@/components/customer/shop-product-linked-add-on-section'
import { ShopImageGallery } from '@/components/customer/shop-image-gallery'
import { ShopProductCard } from '@/components/customer/shop-product-card'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { cn, formatPrice, formatSlotDate, formatSlotTimeRange, getStockStatus } from '@/lib/utils'
import { useInventory } from '@/lib/inventory-store'
import { isRentalProduct } from '@/lib/rental-product'
import { resolveVariantDimensionGroups } from '@/lib/shop-utils'
import type { AttributeGroup, Product, ShopProductVariant } from '@/lib/types'

export interface ShopProductDetailClientProps {
  readonly product: Product | null
  readonly related: Product[]
  readonly relatedTitle?: string
  readonly categoryName: string | null
  readonly isGiftProduct?: boolean
  readonly linkedProducts?: Product[]
  readonly linkedAddOnProducts?: Product[]
  readonly linkedCoupons?: Array<{ id: string; code: string; name: string; description?: string }>
  readonly rentalFromDate?: string
  readonly rentalToDate?: string
  readonly rentalSlotStartAt?: string
  readonly rentalSlotEndAt?: string
  /** Shop merchandising variants (size, colour, etc.). */
  readonly shopAttributeGroups?: AttributeGroup[]
  /** When true, rental add-ons render outside this component (e.g. below availability). */
  readonly deferRentalLinkedAddOnSection?: boolean
  readonly relatedQuantities?: Readonly<Record<string, number>>
  readonly onRelatedQuantitiesChange?: (next: Record<string, number>) => void
}

function isColorGroup(groupName: string): boolean {
  return groupName.trim().toLowerCase().includes('color')
}

function normalizeHexColor(value: string): string | null {
  const raw = value.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
  }
  return null
}

/**
 * Option ids for variant dimension `targetGroupId` that appear on an enabled variant matching
 * every *other* variant dimension the shopper has already picked (order-independent).
 */
function collectAvailableOptionIdsForVariantDimension(
  enabledVariants: readonly ShopProductVariant[],
  variantDimensionGroups: readonly AttributeGroup[],
  targetGroupId: string,
  selectedByGroupId: Readonly<Record<string, string[]>>,
): Set<string> {
  const isDimension = variantDimensionGroups.some((g) => g.id === targetGroupId)
  if (!isDimension) return new Set()
  const out = new Set<string>()
  for (const variant of enabledVariants) {
    let matchesOtherPicks = true
    for (const g of variantDimensionGroups) {
      if (g.id === targetGroupId) continue
      const picked = selectedByGroupId[g.id]?.[0]
      if (!picked) continue
      if (variant.optionValueIdsByGroupId[g.id] !== picked) {
        matchesOtherPicks = false
        break
      }
    }
    if (!matchesOtherPicks) continue
    const id = variant.optionValueIdsByGroupId[targetGroupId]
    if (id) out.add(id)
  }
  return out
}

function isVariantEnabled(variant: ShopProductVariant): boolean {
  return variant.isActive !== false
}

export function ShopProductDetailClient({
  product,
  related,
  relatedTitle = 'You might also like',
  categoryName,
  isGiftProduct = false,
  linkedProducts = [],
  linkedAddOnProducts = [],
  linkedCoupons = [],
  rentalFromDate = '',
  rentalToDate = '',
  rentalSlotStartAt = '',
  rentalSlotEndAt = '',
  shopAttributeGroups = [],
  deferRentalLinkedAddOnSection = false,
  relatedQuantities: relatedQuantitiesProp,
  onRelatedQuantitiesChange,
}: Readonly<ShopProductDetailClientProps>) {
  const router = useRouter()
  const { toast } = useToast()
  const { addToCart, addCustomCartItem, setRentalDates } = useInventory()

  const [qtyRaw, setQtyRaw] = useState('1')
  const [selectedGiftQuantity, setSelectedGiftQuantity] = useState(0)
  const [internalRelatedQuantities, setInternalRelatedQuantities] = useState<Record<string, number>>({})
  const selectedRelatedQuantities = relatedQuantitiesProp ?? internalRelatedQuantities

  const qty = useMemo(() => {
    const parsed = Number.parseInt(qtyRaw || '1', 10)
    if (!Number.isFinite(parsed) || parsed <= 0) return 1
    return parsed
  }, [qtyRaw])

  const perDayRangeComplete =
    rentalFromDate.trim().length > 0 && rentalToDate.trim().length > 0
  const slotScheduleComplete =
    rentalSlotStartAt.trim().length > 0 && rentalSlotEndAt.trim().length > 0
  const defaultUnitPrice = product ? (product.memberPrice ?? product.price) : 0
  const rentalBaseUnitPrice = product
    ? product.rentalBillingType === 'PER_DAY'
      ? (product.rentalPricePerDay ?? product.price)
      : product.rentalBillingType === 'PER_HOUR'
        ? (product.pricePerHour ?? product.price)
        : product.rentalBillingType === 'PER_HALF_DAY'
          ? (product.rentalPricePerHalfDay ?? product.price)
          : product.price
    : 0
  const hourlyDurationHours = useMemo(() => {
    if (
      product?.rentalBillingType !== 'PER_HOUR' ||
      rentalSlotStartAt.trim().length === 0 ||
      rentalSlotEndAt.trim().length === 0
    ) {
      return null
    }
    const startMs = new Date(rentalSlotStartAt.trim()).getTime()
    const endMs = new Date(rentalSlotEndAt.trim()).getTime()
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      return null
    }
    return (endMs - startMs) / 3_600_000
  }, [product?.rentalBillingType, rentalSlotEndAt, rentalSlotStartAt])
  const standardHourlyTotal = useMemo(() => {
    if (product?.rentalBillingType !== 'PER_HOUR' || hourlyDurationHours == null) return null
    const hourlyRate = product.pricePerHour ?? rentalBaseUnitPrice
    return Math.round(hourlyRate * hourlyDurationHours * 100) / 100
  }, [hourlyDurationHours, product?.pricePerHour, product?.rentalBillingType, rentalBaseUnitPrice])
  const tierHourlyTotal = useMemo(() => {
    if (product?.rentalBillingType !== 'PER_HOUR' || hourlyDurationHours == null) return null
    if (!Number.isInteger(hourlyDurationHours)) return null
    const tier = (product.rentalHourlyTierPrices ?? []).find((row) => row.hours === hourlyDurationHours)
    return tier ? Math.round(tier.price * 100) / 100 : null
  }, [hourlyDurationHours, product?.rentalBillingType, product?.rentalHourlyTierPrices])
  const perDaySelectedDays = useMemo(() => {
    if (product?.rentalBillingType !== 'PER_DAY') return null
    const fromYmd = rentalFromDate.trim()
    const toYmd = rentalToDate.trim()
    if (!fromYmd || !toYmd) return null
    const fromCheck = new Date(`${fromYmd}T12:00:00`)
    const toCheck = new Date(`${toYmd}T12:00:00`)
    if (!Number.isFinite(fromCheck.getTime()) || !Number.isFinite(toCheck.getTime())) return null
    if (fromYmd > toYmd) return null
    return getInclusiveRentalDays(fromYmd, toYmd)
  }, [product?.rentalBillingType, rentalFromDate, rentalToDate])
  const standardDailyTotal = useMemo(() => {
    if (product?.rentalBillingType !== 'PER_DAY' || perDaySelectedDays == null) return null
    const perDayRate = product.rentalPricePerDay ?? rentalBaseUnitPrice
    return Math.round(perDayRate * perDaySelectedDays * 100) / 100
  }, [perDaySelectedDays, product?.rentalBillingType, product?.rentalPricePerDay, rentalBaseUnitPrice])
  const tierDailyTotal = useMemo(() => {
    if (product?.rentalBillingType !== 'PER_DAY' || perDaySelectedDays == null) return null
    const tier = (product.rentalDailyTierPrices ?? []).find((row) => row.days === perDaySelectedDays)
    return tier ? Math.round(tier.price * 100) / 100 : null
  }, [perDaySelectedDays, product?.rentalBillingType, product?.rentalDailyTierPrices])
  const compareAt = useMemo(() => {
    if (!product) return null
    if (product.rentalBillingType === 'PER_HOUR' && tierHourlyTotal != null) {
      return standardHourlyTotal
    }
    if (
      product.rentalBillingType === 'PER_HOUR' &&
      hourlyDurationHours != null &&
      product.compareAtPrice != null
    ) {
      return Math.round(product.compareAtPrice * hourlyDurationHours * 100) / 100
    }
    if (product.rentalBillingType === 'PER_DAY' && tierDailyTotal != null) {
      return standardDailyTotal
    }
    if (product.rentalBillingType === 'PER_DAY' && perDaySelectedDays != null && product.compareAtPrice != null) {
      return Math.round(product.compareAtPrice * perDaySelectedDays * 100) / 100
    }
    return product.compareAtPrice ?? null
  }, [
    hourlyDurationHours,
    perDaySelectedDays,
    product,
    standardDailyTotal,
    standardHourlyTotal,
    tierDailyTotal,
    tierHourlyTotal,
  ])

  const variantGroups = useMemo(() => {
    if (!product) return [] as AttributeGroup[]
    const raw =
      shopAttributeGroups.length > 0 ? shopAttributeGroups : product.shopAttributeGroups ?? []
    const allGroups = raw.filter((group) => group.options.length > 0)
    const variants = product.shopVariants ?? []
    if (variants.length === 0) {
      return allGroups
    }
    const enabledVariants = variants.filter(isVariantEnabled)
    const variantsForAllowlist = enabledVariants.length > 0 ? enabledVariants : variants
    return allGroups
      .map((group) => {
        if (group.selectionType !== 'single' || group.isVariantDimension !== true) {
          return group
        }
        const allowedOptionIds = new Set(
          variantsForAllowlist
            .map((variant) => variant.optionValueIdsByGroupId[group.id])
            .filter((optionId): optionId is string => Boolean(optionId)),
        )
        if (allowedOptionIds.size === 0) {
          return group
        }
        return {
          ...group,
          options: group.options.filter((option) => allowedOptionIds.has(option.id)),
        }
      })
      .filter((group) => group.options.length > 0)
  }, [product, shopAttributeGroups])
  const variantDimensionGroups = useMemo(
    () => resolveVariantDimensionGroups(variantGroups),
    [variantGroups],
  )

  const [selectedShopAttributes, setSelectedShopAttributes] = useState<Record<string, string[]>>(
    {},
  )
  const [showShopOptions, setShowShopOptions] = useState(true)

  useEffect(() => {
    if (!product) return
    const next: Record<string, string[]> = {}
    for (const group of variantGroups) {
      next[group.id] = []
    }
    setSelectedShopAttributes(next)
    const needPick =
      !isGiftProduct && !isRentalProduct(product) && variantGroups.length > 0
    setShowShopOptions(!needPick)
  }, [product, variantGroups, isGiftProduct])

  useEffect(() => {
    if (!product || variantDimensionGroups.length === 0) return
    const enabled = (product.shopVariants ?? []).filter(isVariantEnabled)
    if (enabled.length === 0) return
    setSelectedShopAttributes((prev) => {
      const next = { ...prev }
      let changed = false
      const maxPasses = variantDimensionGroups.length + 2
      for (let pass = 0; pass < maxPasses; pass++) {
        let passChanged = false
        for (const g of variantDimensionGroups) {
          const selected = next[g.id]?.[0]
          if (!selected) continue
          const allowed = collectAvailableOptionIdsForVariantDimension(
            enabled,
            variantDimensionGroups,
            g.id,
            next,
          )
          if (!allowed.has(selected)) {
            next[g.id] = []
            passChanged = true
            changed = true
          }
        }
        if (!passChanged) break
      }
      return changed ? next : prev
    })
  }, [product, variantDimensionGroups, selectedShopAttributes])

  if (!product) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <p className="text-sm font-semibold text-foreground">Product not found.</p>
        <p className="mt-1 text-sm text-muted-foreground">Try browsing the shop instead.</p>
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={() => router.push('/shop')}>
            Back to shop
          </Button>
        </div>
      </div>
    )
  }

  const shopProduct = product
  const needsVariantPick =
    !isGiftProduct && !isRentalProduct(shopProduct) && variantGroups.length > 0

  const isRental = isRentalProduct(shopProduct)
  const rentalBilling = shopProduct.rentalBillingType ?? ''
  const requiresRentalCalendar =
    isRental &&
    (rentalBilling === 'PER_DAY' ||
      rentalBilling === 'PER_HOUR' ||
      rentalBilling === 'PER_HALF_DAY')

  const status = getStockStatus(shopProduct)
  const dailyEffectiveTotal = tierDailyTotal ?? standardDailyTotal
  const hourlyEffectiveTotal = tierHourlyTotal ?? standardHourlyTotal
  const rentalBaseTimesPeriod =
    shopProduct.rentalBillingType === 'PER_DAY' &&
    perDaySelectedDays != null &&
    tierDailyTotal == null
      ? `${shopProduct.rentalPricePerDay ?? defaultUnitPrice}*${perDaySelectedDays}`
      : shopProduct.rentalBillingType === 'PER_HOUR' &&
          hourlyDurationHours != null &&
          tierHourlyTotal == null
        ? `${shopProduct.pricePerHour ?? defaultUnitPrice}*${hourlyDurationHours}`
        : null
  const selectedRentalUnitPrice =
    shopProduct.rentalBillingType === 'PER_HOUR' && hourlyEffectiveTotal != null
      ? hourlyEffectiveTotal
      : shopProduct.rentalBillingType === 'PER_DAY' && dailyEffectiveTotal != null
        ? dailyEffectiveTotal
        : rentalBaseUnitPrice
  const baseMaxQty =
    shopProduct.allowBackorders || shopProduct.stockCount <= 0 ? undefined : Math.max(1, shopProduct.stockCount)

  function buildSelectedShopLabels(): Record<string, string[]> {
    const out: Record<string, string[]> = {}
    for (const group of variantGroups) {
      const ids = selectedShopAttributes[group.id] ?? []
      const labels = ids
        .map((id) => group.options.find((option) => option.id === id)?.label)
        .filter((label): label is string => Boolean(label && label.length > 0))
      if (labels.length > 0) {
        out[group.id] = labels
      }
    }
    return out
  }

  function shopSelectionsValid(): boolean {
    for (const group of variantGroups) {
      if (!group.isRequired) continue
      const ids = selectedShopAttributes[group.id] ?? []
      if (ids.length === 0) return false
    }
    return true
  }

  function resolveSelectedVariant() {
    if (variantDimensionGroups.length === 0) return null
    const variants = shopProduct.shopVariants ?? []
    if (variants.length === 0) return null
    const enabledVariants = variants.filter(isVariantEnabled)
    const pool = enabledVariants.length > 0 ? enabledVariants : variants
    const selectedOptionIdsByGroupId: Record<string, string> = {}
    for (const group of variantDimensionGroups) {
      const selected = selectedShopAttributes[group.id]?.[0]
      if (!selected) return null
      selectedOptionIdsByGroupId[group.id] = selected
    }
    return (
      pool.find((variant) =>
        Object.entries(selectedOptionIdsByGroupId).every(
          ([groupId, optionId]) => variant.optionValueIdsByGroupId[groupId] === optionId,
        ),
      ) ?? null
    )
  }
  const selectedVariant = resolveSelectedVariant()
  const selectedShopUnitPrice =
    !isGiftProduct && !isRental && selectedVariant?.priceOverride != null
      ? selectedVariant.priceOverride
      : defaultUnitPrice
  const variantPriceRangeLabel = (() => {
    if (isGiftProduct || isRental) return null
    const variants = shopProduct.shopVariants ?? []
    if (variants.length === 0) return null
    const activeVariants = variants.filter(isVariantEnabled)
    const source = activeVariants.length > 0 ? activeVariants : variants
    const prices = source.map((variant) => variant.priceOverride ?? defaultUnitPrice)
    if (prices.length === 0) return null
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    if (minPrice === maxPrice) return null
    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
  })()
  const effectiveAllowBackorders = selectedVariant?.allowBackorders ?? shopProduct.allowBackorders
  const effectiveStockCount = selectedVariant?.stockCount ?? shopProduct.stockCount
  const effectiveLowStockThreshold =
    selectedVariant?.lowStockThreshold ?? shopProduct.lowStockThreshold
  const isOutOfStock = !effectiveAllowBackorders && effectiveStockCount <= 0
  const isLowStock = !isOutOfStock && effectiveStockCount <= effectiveLowStockThreshold
  const totalPrice = (isRental ? selectedRentalUnitPrice : selectedShopUnitPrice) * qty
  const heroUnitPrice =
    isRental && (rentalBilling === 'PER_DAY' || rentalBilling === 'PER_HOUR' || rentalBilling === 'PER_HALF_DAY')
      ? rentalBaseUnitPrice
      : selectedShopUnitPrice
  const heroCompareAt = shopProduct.compareAtPrice ?? null
  const heroSavings =
    heroCompareAt != null && heroCompareAt > heroUnitPrice ? heroCompareAt - heroUnitPrice : null
  const maxQty =
    selectedVariant
      ? (effectiveAllowBackorders ? undefined : Math.max(1, effectiveStockCount))
      : baseMaxQty

  function toggleShopAttribute(group: AttributeGroup, optionId: string) {
    setSelectedShopAttributes((prev) => {
      const current = prev[group.id] ?? []
      if (group.selectionType === 'single') {
        return { ...prev, [group.id]: [optionId] }
      }
      const cap = Math.max(1, (group.maxSelect ?? group.options.length) || 1)
      if (!current.includes(optionId) && current.length >= cap) {
        return prev
      }
      const nextIds = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
      return { ...prev, [group.id]: nextIds }
    })
  }

  function clearShopMulti(groupId: string) {
    setSelectedShopAttributes((prev) => ({ ...prev, [groupId]: [] }))
  }

  function toIsoRange(fromDate: string, toDate: string): { fromIso: string; toIso: string } | null {
    const fromTrimmed = fromDate.trim()
    const toTrimmed = toDate.trim()
    if (!fromTrimmed || !toTrimmed) return null
    const fromDateTime = new Date(`${fromTrimmed}T00:00:00`)
    const toDateTime = new Date(`${toTrimmed}T23:59:59`)
    if (!Number.isFinite(fromDateTime.getTime()) || !Number.isFinite(toDateTime.getTime())) return null
    return { fromIso: fromDateTime.toISOString(), toIso: toDateTime.toISOString() }
  }

  function getInclusiveRentalDays(fromYmd: string, toYmd: string): number {
    const from = new Date(`${fromYmd}T12:00:00`)
    const to = new Date(`${toYmd}T12:00:00`)
    const fromDay = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
    const toDay = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
    return Math.floor((toDay - fromDay) / 86400000) + 1
  }

  function validateAndPersistPerDayDates(): boolean {
    if (shopProduct.rentalBillingType !== 'PER_DAY') return true

    const isoRange = toIsoRange(rentalFromDate, rentalToDate)
    if (!isoRange) {
      toast({
        title: 'Select rental period first',
        description: 'Please select From and To dates in the availability section below before adding to cart.',
        variant: 'destructive',
      })
      return false
    }
    const { fromIso, toIso } = isoRange

    if (new Date(fromIso).getTime() > new Date(toIso).getTime()) {
      toast({
        title: 'Invalid date range',
        description: 'The to date must be the same day or after the from date.',
        variant: 'destructive',
      })
      return false
    }

    const selectedDays = getInclusiveRentalDays(rentalFromDate.trim(), rentalToDate.trim())
    const maxRentalDays = shopProduct.maxRentalDays ?? null
    if (maxRentalDays != null && selectedDays > maxRentalDays) {
      toast({
        title: 'Selected period exceeds max rental days',
        description: `Your selected To date exceeds the ${maxRentalDays}-day rental limit. Please choose an earlier To date.`,
        variant: 'destructive',
      })
      return false
    }

    setRentalDates(fromIso, toIso)
    return true
  }

  function validateAndPersistRentalSchedule(): boolean {
    if (shopProduct.rentalBillingType === 'PER_DAY') {
      return validateAndPersistPerDayDates()
    }
    if (
      shopProduct.rentalBillingType === 'PER_HOUR' ||
      shopProduct.rentalBillingType === 'PER_HALF_DAY'
    ) {
      const start = rentalSlotStartAt.trim()
      const end = rentalSlotEndAt.trim()
      if (!start || !end) {
        toast({
          title: 'Select rental slot',
          description:
            'Choose a day in the week strip, then pick a time or half-day block before adding to cart.',
          variant: 'destructive',
        })
        return false
      }
      setRentalDates(start, end)
      return true
    }
    return true
  }

  function dec() {
    setQtyRaw(String(Math.max(1, qty - 1)))
  }

  function inc() {
    const next = qty + 1
    if (maxQty != null && next > maxQty) return
    setQtyRaw(String(next))
  }

  function add() {
    if (isGiftProduct) {
      if (selectedGiftQuantity <= 0) {
        return
      }
      const selectedAddOns = Object.entries(selectedRelatedQuantities)
        .map(([relatedId, quantity]) => {
          const product = related.find((row) => row.id === relatedId) ?? null
          if (!product || quantity <= 0) return null
          return {
            productId: product.id,
            name: product.name,
            imageUrl: product.imageUrl ?? '/placeholder.jpg',
            unitPrice: product.memberPrice ?? product.price,
            quantity,
          }
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      const totalPrice =
        heroUnitPrice * selectedGiftQuantity +
        selectedAddOns.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

      addCustomCartItem({
        type: 'product',
        name: `${shopProduct.name} bundle`,
        description: `${selectedGiftQuantity} gift item(s), ${selectedAddOns.length} add-on type(s)`,
        price: totalPrice,
        quantity: 1,
        imageUrl: shopProduct.imageUrl ?? '/placeholder.jpg',
        metadata: {
          giftBundle: true,
          primary: {
            productId: shopProduct.id,
            name: shopProduct.name,
            imageUrl: shopProduct.imageUrl ?? '/placeholder.jpg',
            unitPrice: heroUnitPrice,
            quantity: selectedGiftQuantity,
          },
          addOns: selectedAddOns,
        },
      })
      return
    }

    if (!validateAndPersistRentalSchedule()) return

    const selectedRentalAddOns = Object.entries(selectedRelatedQuantities)
      .map(([relatedId, quantity]) => {
        const relatedProduct = related.find((row) => row.id === relatedId) ?? null
        if (!relatedProduct || quantity <= 0) return null
        return {
          productId: relatedProduct.id,
          name: relatedProduct.name,
          imageUrl: relatedProduct.imageUrl ?? '/placeholder.jpg',
          unitPrice: relatedProduct.memberPrice ?? relatedProduct.price,
          quantity,
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    const rentalAddOnTotal = selectedRentalAddOns.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    )
    const rentalLineTotal = selectedRentalUnitPrice * qty + rentalAddOnTotal

    if (selectedRentalAddOns.length > 0) {
      const scheduleDescription =
        shopProduct.rentalBillingType === 'PER_DAY'
          ? `${rentalFromDate.trim()} to ${rentalToDate.trim()}`
          : formatSlotTimeRange(rentalSlotStartAt.trim(), rentalSlotEndAt.trim())
      addCustomCartItem({
        type: 'product',
        name: `${shopProduct.name} rental`,
        description: `${shopProduct.sku ?? 'Rental'} · ${scheduleDescription}`,
        price: rentalLineTotal,
        quantity: 1,
        imageUrl: shopProduct.imageUrl ?? '/placeholder.jpg',
        metadata: {
          rentalBundle: true,
          primary: {
            productId: shopProduct.id,
            name: shopProduct.name,
            imageUrl: shopProduct.imageUrl ?? '/placeholder.jpg',
            unitPrice: selectedRentalUnitPrice,
            quantity: qty,
            rentalBillingType: shopProduct.rentalBillingType,
            rentalFromDate:
              shopProduct.rentalBillingType === 'PER_DAY' ? rentalFromDate.trim() : undefined,
            rentalToDate:
              shopProduct.rentalBillingType === 'PER_DAY' ? rentalToDate.trim() : undefined,
            rentalSlotStartAt:
              shopProduct.rentalBillingType === 'PER_HOUR' ||
              shopProduct.rentalBillingType === 'PER_HALF_DAY'
                ? rentalSlotStartAt.trim()
                : undefined,
            rentalSlotEndAt:
              shopProduct.rentalBillingType === 'PER_HOUR' ||
              shopProduct.rentalBillingType === 'PER_HALF_DAY'
                ? rentalSlotEndAt.trim()
                : undefined,
            rentalDays: perDaySelectedDays ?? undefined,
            rentalHours: hourlyDurationHours ?? undefined,
          },
          addOns: selectedRentalAddOns,
        },
      })
      return
    }

    if (shopProduct.rentalBillingType === 'PER_DAY') {
      const isoRange = toIsoRange(rentalFromDate, rentalToDate)
      if (!isoRange) return
      addCustomCartItem({
        type: 'product',
        name: shopProduct.name,
        description: `${shopProduct.sku ?? 'Rental'} · ${rentalFromDate.trim()} to ${rentalToDate.trim()}`,
        price: selectedRentalUnitPrice,
        quantity: qty,
        imageUrl: shopProduct.imageUrl ?? '/placeholder.jpg',
        metadata: {
          productId: shopProduct.id,
          rentalFromDate: rentalFromDate.trim(),
          rentalToDate: rentalToDate.trim(),
          rentalDays: perDaySelectedDays ?? undefined,
          standardDailyTotal: standardDailyTotal ?? undefined,
          tierDailyTotal: tierDailyTotal ?? undefined,
        },
      })
      return
    }
    if (shopProduct.rentalBillingType === 'PER_HOUR') {
      const start = rentalSlotStartAt.trim()
      const end = rentalSlotEndAt.trim()
      if (!start || !end) return
      addCustomCartItem({
        type: 'product',
        name: shopProduct.name,
        description: `${shopProduct.sku ?? 'Rental'} · ${formatSlotTimeRange(start, end)}`,
        price: selectedRentalUnitPrice,
        quantity: qty,
        imageUrl: shopProduct.imageUrl ?? '/placeholder.jpg',
        metadata: {
          productId: shopProduct.id,
          rentalSlotStartAt: start,
          rentalSlotEndAt: end,
          rentalHours: hourlyDurationHours ?? undefined,
          standardHourlyTotal: standardHourlyTotal ?? undefined,
          tierHourlyTotal: tierHourlyTotal ?? undefined,
        },
      })
      return
    }
    if (needsVariantPick) {
      if (!shopSelectionsValid()) {
        toast({
          title: 'Select options',
          description: 'Choose all required options before adding to cart.',
          variant: 'destructive',
        })
        return
      }
      if (variantDimensionGroups.length > 0 && !selectedVariant) {
        toast({
          title: 'Variant unavailable',
          description: 'This combination is not available right now.',
          variant: 'destructive',
        })
        return
      }
      if (selectedVariant && !isVariantEnabled(selectedVariant)) {
        toast({
          title: 'Variant unavailable',
          description: 'This variant is currently inactive.',
          variant: 'destructive',
        })
        return
      }
      if (
        selectedVariant &&
        !effectiveAllowBackorders &&
        qty > effectiveStockCount
      ) {
        toast({
          title: 'Limited stock',
          description: `Only ${effectiveStockCount} item(s) available for this variant.`,
          variant: 'destructive',
        })
        return
      }
      addToCart({
        product: shopProduct,
        quantity: qty,
        selectedShopAttributes: buildSelectedShopLabels(),
        shopAttributeGroupsSnapshot: variantGroups,
        shopVariantId: selectedVariant?.id,
        shopVariantSku: selectedVariant?.sku,
        unitPrice: selectedVariant?.priceOverride ?? defaultUnitPrice,
      })
      return
    }

    addToCart({ product: shopProduct, quantity: qty })
  }

  function buyNow() {
    add()
    router.push('/cart')
  }

  const images = [
    selectedVariant?.imageUrl ?? '',
    selectedVariant?.imageUrl ? '' : (shopProduct.imageUrl ?? ''),
    ...(shopProduct.galleryUrls ?? shopProduct.galleryImages ?? []),
  ].filter((image, index, list) => image.trim().length > 0 && list.indexOf(image) === index)
  const selectedRelatedRows = related
    .filter((row) => (selectedRelatedQuantities[row.id] ?? 0) > 0)
    .map((row) => ({
      product: row,
      quantity: selectedRelatedQuantities[row.id] ?? 0,
      unitPrice: row.memberPrice ?? row.price,
    }))
  const selectedRelatedTotal = selectedRelatedRows.reduce(
    (sum, row) => sum + row.unitPrice * row.quantity,
    0,
  )
  const selectedGiftTotal = heroUnitPrice * selectedGiftQuantity
  const hasRentalSelection =
    requiresRentalCalendar &&
    ((rentalBilling === 'PER_DAY' && perDayRangeComplete) ||
      ((rentalBilling === 'PER_HOUR' || rentalBilling === 'PER_HALF_DAY') && slotScheduleComplete))
  const rentalGrandTotal = totalPrice + selectedRelatedTotal
  const grandTotal = isGiftProduct
    ? selectedGiftTotal + selectedRelatedTotal
    : isRental
      ? rentalGrandTotal
      : totalPrice
  const showGiftLinkedAddOnSection = isGiftProduct && selectedGiftQuantity > 0
  const showRentalLinkedAddOnSection =
    isRental && related.length > 0 && !deferRentalLinkedAddOnSection
  const showLinkedPackageDetails =
    (isGiftProduct || isRental) &&
    (linkedProducts.length > 0 || linkedCoupons.length > 0)
  const linkedPackageDetailsTitle = isRental ? 'Rental package details' : 'Gift bundle details'
  const linkedProductFallbackDescription = isRental
    ? 'Included with this rental'
    : 'Gift bundle product'
  const showInlineRentalControls = !isRental
  const alignImageWithDetails = true
  const showPinnedStandardCheckout = !isGiftProduct && !isRental && needsVariantPick && showShopOptions

  function updateRelatedQuantity(productId: string, delta: number) {
    const apply = (prev: Record<string, number>) => {
      const current = prev[productId] ?? 0
      const next = Math.max(0, current + delta)
      const out = { ...prev }
      if (next === 0) {
        delete out[productId]
      } else {
        out[productId] = next
      }
      return out
    }
    if (onRelatedQuantitiesChange) {
      onRelatedQuantitiesChange(apply(selectedRelatedQuantities))
      return
    }
    setInternalRelatedQuantities(apply)
  }

  function renderVariantCustomiseSection() {
    if (!(needsVariantPick && showShopOptions)) return null

    return (
      <div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
        {variantGroups
          .filter((group) => group.selectionType === 'single')
          .map((group) => {
            const selectedId = selectedShopAttributes[group.id]?.[0] ?? ''
            const selectedLabel =
              group.options.find((option) => option.id === selectedId)?.label ?? '—'
            const isColor = isColorGroup(group.name)
            const isVariantDimension = variantDimensionGroups.some((dim) => dim.id === group.id)
            const enabledVariants = (shopProduct.shopVariants ?? []).filter(isVariantEnabled)
            const allowedIdsForDim =
              isVariantDimension && enabledVariants.length > 0
                ? collectAvailableOptionIdsForVariantDimension(
                    enabledVariants,
                    variantDimensionGroups,
                    group.id,
                    selectedShopAttributes,
                  )
                : null
            const optionsToShow =
              allowedIdsForDim != null
                ? group.options.filter((option) => allowedIdsForDim.has(option.id))
                : group.options
            return (
              <div key={group.id} className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  {group.name}: <span className="font-medium">{selectedLabel}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {optionsToShow.map((option) => {
                    const selected = selectedShopAttributes[group.id]?.includes(option.id) ?? false
                    const colorHex = isColor && option.color ? normalizeHexColor(option.color) : null
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => toggleShopAttribute(group, option.id)}
                        className={cn(
                          'inline-flex items-center justify-center rounded-md border text-sm transition-colors',
                          selected
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border bg-background text-foreground hover:border-muted-foreground/40',
                          colorHex ? 'h-8 w-8 p-0' : 'h-8 min-w-8 px-3',
                        )}
                        aria-label={`${group.name}: ${option.label}`}
                        title={option.label}
                      >
                        {colorHex ? (
                          <span
                            className="h-5 w-5 rounded-sm border border-background/20"
                            style={{ backgroundColor: colorHex }}
                          />
                        ) : (
                          option.label
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        {variantGroups.some((group) => group.selectionType === 'multiple') ? (
          <div className="space-y-3 border-t border-border pt-3">
            {variantGroups
              .filter((group) => group.selectionType === 'multiple')
              .map((group) => (
                <div key={group.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{group.name}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => clearShopMulti(group.id)}
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.options.map((option) => {
                      const selected = selectedShopAttributes[group.id]?.includes(option.id) ?? false
                      const colorHex =
                        isColorGroup(group.name) && option.color ? normalizeHexColor(option.color) : null
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => toggleShopAttribute(group, option.id)}
                          className={cn(
                            'inline-flex items-center justify-center rounded-md border text-sm transition-colors',
                            selected
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-border bg-background text-foreground hover:border-muted-foreground/40',
                            colorHex ? 'h-8 w-8 p-0' : 'h-8 min-w-8 px-3',
                          )}
                          aria-label={`${group.name}: ${option.label}`}
                          title={option.label}
                        >
                          {colorHex ? (
                            <span
                              className="h-5 w-5 rounded-sm border border-background/20"
                              style={{ backgroundColor: colorHex }}
                            />
                          ) : (
                            option.label
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
          </div>
        ) : null}
      </div>
    )
  }

  const productDetailSection = (
    <div
      className={cn(
        'grid grid-cols-1 lg:grid-cols-12 lg:items-stretch',
        isGiftProduct ? 'gap-6 lg:gap-8' : 'gap-10',
      )}
    >
      <div
        className={cn(
          'lg:col-span-5',
          alignImageWithDetails && 'flex min-h-[18rem] flex-col self-stretch lg:min-h-0',
        )}
      >
        <div
          className={cn(
            alignImageWithDetails
              ? 'flex min-h-0 w-full flex-1 flex-col'
              : 'mx-auto max-w-2xl',
          )}
        >
          <ShopImageGallery
            images={images}
            alt={shopProduct.name}
            fillMainHeight={alignImageWithDetails}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-col lg:col-span-7">
        <div className="flex h-full min-h-0 flex-col space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {categoryName ?? 'Shop'}
            </p>
            <h1
              className="text-3xl font-black tracking-tight text-foreground"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              {shopProduct.name}
            </h1>
            {shopProduct.description ? (
              <div
                className={cn(
                  'max-w-none text-sm font-normal leading-relaxed text-muted-foreground',
                  '[&_p]:m-0 [&_p]:text-sm [&_p]:font-normal [&_p]:leading-relaxed [&_p]:text-muted-foreground',
                )}
                dangerouslySetInnerHTML={{ __html: shopProduct.description }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-end gap-3">
              <p
                className="text-3xl font-black text-foreground"
                style={{ fontFamily: 'var(--font-barlow)' }}
              >
                {formatPrice(heroUnitPrice)}
              </p>
              {heroCompareAt != null ? (
                <p className="text-sm text-muted-foreground line-through">
                  {formatPrice(heroCompareAt)}
                </p>
              ) : null}
              {heroSavings != null ? (
                <span className="inline-flex rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                  Save {formatPrice(heroSavings)}
                </span>
              ) : null}
            </div>
            {/* {variantPriceRangeLabel ? (
              <p className="text-base font-semibold text-foreground/85">
                {variantPriceRangeLabel}
              </p>
            ) : null} */}
            {shopProduct.memberPrice != null && !isRental ? (
              <p className="text-sm font-semibold text-accent">
                Member price: {formatPrice(shopProduct.memberPrice)}
              </p>
            ) : null}
            {shopProduct.taxable ? (
              <p className="text-xs text-muted-foreground">
                Price includes {shopProduct.taxRate ?? 20}% tax
              </p>
            ) : null}
          </div>

          {renderVariantCustomiseSection()}

          {isRental &&
          ((shopProduct.rentalBillingType === 'PER_HOUR' &&
            (shopProduct.rentalHourlyTierPrices?.length ?? 0) > 0) ||
            (shopProduct.rentalBillingType === 'PER_DAY' &&
              (shopProduct.rentalDailyTierPrices?.length ?? 0) > 0)) ? (
            <div className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-3 text-xs">
              <p className="text-sm font-bold text-foreground">Tier pricing</p>
              {shopProduct.rentalBillingType === 'PER_HOUR' &&
              shopProduct.rentalHourlyTierPrices?.length ? (
                <div className="mt-2 space-y-1.5">
                  <p className="font-semibold text-foreground">Hourly</p>
                  {shopProduct.rentalHourlyTierPrices
                    .slice()
                    .sort((a, b) => a.hours - b.hours)
                    .map((tier) => {
                      const baseHourlyRate = shopProduct.pricePerHour ?? heroUnitPrice
                      const regular = baseHourlyRate * tier.hours
                      const savingsAmount = Math.max(0, regular - tier.price)
                      return (
                        <div
                          key={`hourly-tier-${tier.hours}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-accent/20 bg-background/80 px-2.5 py-1.5"
                        >
                          <span className="font-medium text-foreground">
                            {tier.hours}h: {formatPrice(tier.price)}
                          </span>
                          <span className="font-semibold text-accent">
                            You save {formatPrice(savingsAmount)}
                          </span>
                        </div>
                      )
                    })}
                </div>
              ) : null}
              {shopProduct.rentalBillingType === 'PER_DAY' &&
              shopProduct.rentalDailyTierPrices?.length ? (
                <div className="mt-2 space-y-1.5">
                  <p className="font-semibold text-foreground">Daily</p>
                  {shopProduct.rentalDailyTierPrices
                    .slice()
                    .sort((a, b) => a.days - b.days)
                    .map((tier) => {
                      const baseDailyRate = shopProduct.rentalPricePerDay ?? heroUnitPrice
                      const regular = baseDailyRate * tier.days
                      const savingsAmount = Math.max(0, regular - tier.price)
                      return (
                        <div
                          key={`daily-tier-${tier.days}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-accent/20 bg-background/80 px-2.5 py-1.5"
                        >
                          <span className="font-medium text-foreground">
                            {tier.days}d: {formatPrice(tier.price)}
                          </span>
                          <span className="font-semibold text-accent">
                            You save {formatPrice(savingsAmount)}
                          </span>
                        </div>
                      )
                    })}
                </div>
              ) : null}
            </div>
          ) : null}

          {showLinkedPackageDetails ? (
            <div className="space-y-4 rounded-xl border border-border bg-card p-4">
              <h2 className="text-base font-semibold text-foreground">{linkedPackageDetailsTitle}</h2>
              {linkedProducts.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Included products</p>
                  <div className="flex flex-wrap gap-2">
                    {linkedProducts.map((linkedProduct) => (
                      <HoverCard key={linkedProduct.id} openDelay={120} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <button
                            type="button"
                            className="relative h-14 w-14 overflow-hidden rounded-md border border-border bg-muted/30"
                            aria-label={linkedProduct.name}
                          >
                            <Image
                              src={linkedProduct.imageUrl ?? '/placeholder.jpg'}
                              alt={linkedProduct.name}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent
                          side="top"
                          align="start"
                          className="w-72 space-y-3 rounded-xl border border-border bg-card p-0"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-muted/30">
                            <Image
                              src={linkedProduct.imageUrl ?? '/placeholder.jpg'}
                              alt={linkedProduct.name}
                              fill
                              className="object-cover"
                              sizes="288px"
                            />
                          </div>
                          <div className="space-y-1 p-3">
                            <p className="text-base font-semibold text-foreground">
                              {linkedProduct.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {linkedProduct.description ?? linkedProductFallbackDescription}
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              {formatPrice(linkedProduct.memberPrice ?? linkedProduct.price)}
                            </p>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ))}
                  </div>
                </div>
              ) : null}
              {linkedCoupons.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Voucher coupons</p>
                  <div className="space-y-2">
                    {linkedCoupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className="rounded-md border border-border bg-muted/30 px-3 py-2"
                      >
                        <p className="text-sm font-semibold text-foreground">{coupon.code}</p>
                        <p className="text-xs text-muted-foreground">{coupon.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {selectedVariant?.sku || shopProduct.sku ? (
              <span className="inline-flex rounded-md bg-muted px-2 py-1 font-mono text-xs text-foreground">
                {selectedVariant?.sku ?? shopProduct.sku}
              </span>
            ) : null}
            {shopProduct.targetGender ? (
              <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs text-foreground capitalize">
                {shopProduct.targetGender}
              </span>
            ) : null}
            {isOutOfStock ? (
              <span className="rounded-md bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">
                Out of stock
              </span>
            ) : isLowStock ? (
              <span className="text-xs font-semibold text-amber-700">
                Only {effectiveStockCount} left
              </span>
            ) : (
              <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                In stock: {effectiveStockCount}
              </span>
            )}
          </div>

          <Separator />

          {isGiftProduct && selectedGiftQuantity <= 0 ? (
            <Button
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              onClick={() => setSelectedGiftQuantity(1)}
            >
              Select items
            </Button>
          ) : needsVariantPick && !showShopOptions ? (
            <Button
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              type="button"
              onClick={() => setShowShopOptions(true)}
            >
              Select items
            </Button>
          ) : (
            <>
              {isGiftProduct ? null : (
                <>
                  {requiresRentalCalendar ? (
                    rentalBilling === 'PER_DAY' ? (
                      perDayRangeComplete ? (
                        <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs">
                          <p className="font-semibold text-foreground">Rental period</p>
                          <p className="mt-1 text-muted-foreground">
                            <span className="font-medium text-foreground">From:</span>{' '}
                            {rentalFromDate.trim()}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">To:</span>{' '}
                            {rentalToDate.trim()}
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                          <p className="font-medium text-foreground">
                            Please select your rental period in the availability section below.
                          </p>
                          <p>Choose a start week day, then an end day (use week arrows if needed).</p>
                        </div>
                      )
                    ) : slotScheduleComplete ? (
                      <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs">
                        <p className="font-semibold text-foreground">Rental slot</p>
                        <p className="mt-1 text-muted-foreground">
                          {formatSlotDate(rentalSlotStartAt.trim())}
                        </p>
                        <p className="mt-0.5 text-muted-foreground">
                          {formatSlotTimeRange(rentalSlotStartAt.trim(), rentalSlotEndAt.trim())}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                        <p className="font-medium text-foreground">
                          Select a day, then{' '}
                          {rentalBilling === 'PER_HOUR' ? 'a start time' : 'morning or afternoon'}{' '}
                          in the availability section below.
                        </p>
                      </div>
                    )
                  ) : null}
                  {showInlineRentalControls && !showPinnedStandardCheckout ? (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">Quantity</p>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-9 w-9" onClick={dec} aria-label="Decrease quantity">
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            value={qtyRaw}
                            onChange={(e) => setQtyRaw(e.target.value)}
                            className="h-9 w-20 text-center"
                            inputMode="numeric"
                            aria-label="Quantity"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={inc}
                            aria-label="Increase quantity"
                            disabled={maxQty != null && qty >= maxQty}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div
                        className={cn(
                          'grid grid-cols-1 gap-3',
                          isRental ? '' : 'sm:grid-cols-2',
                        )}
                      >
                        <Button
                          className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                          onClick={add}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Add to cart
                        </Button>
                        {isRental ? null : (
                          <Button variant="outline" className="font-semibold" onClick={buyNow}>
                            Buy now
                          </Button>
                        )}
                      </div>
                    </>
                  ) : null}
                </>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  )

  const linkedAddOnRelatedSection = (
    <ShopProductLinkedAddOnSection
      related={related}
      relatedTitle={relatedTitle}
      selectedQuantities={selectedRelatedQuantities}
      onUpdateQuantity={updateRelatedQuantity}
    />
  )

  const giftLineRowClass =
    'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-background px-3 py-3 sm:gap-x-4 sm:px-4 sm:py-3.5'

  const giftCheckoutCard = (
    <div className="w-full rounded-xl border border-border bg-card p-5">
        <h3
          className="text-lg font-black text-foreground"
          style={{ fontFamily: 'var(--font-barlow)' }}
        >
          Cart & checkout
        </h3>
        {selectedGiftQuantity > 0 ? (
          <div className="translate-y-0 opacity-100 transition-all duration-300 ease-out">
            <div className="mt-5 max-h-[420px] space-y-3 overflow-x-hidden overflow-y-auto pr-1">
              <div className={giftLineRowClass} aria-label={`Gift bundle: ${shopProduct.name}`}>
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border">
                  <Image
                    src={shopProduct.imageUrl ?? '/placeholder.jpg'}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="shrink-0 tabular-nums">
                  <p className="text-sm font-semibold text-foreground">{formatPrice(heroUnitPrice)}</p>
                  <p className="text-xs text-muted-foreground">each</p>
                </div>
                <div className="ml-auto flex shrink-0 flex-col items-end gap-1.5">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setSelectedGiftQuantity((prev) => Math.max(0, prev - 1))}
                      aria-label="Decrease gift quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">
                      {selectedGiftQuantity}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setSelectedGiftQuantity((prev) => prev + 1)}
                      aria-label="Increase gift quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-right text-sm font-bold tabular-nums text-foreground">
                    {formatPrice(selectedGiftTotal)}
                  </p>
                </div>
              </div>
              {selectedRelatedRows.map((row) => (
                <div
                  key={row.product.id}
                  className={giftLineRowClass}
                  aria-label={`Add-on: ${row.product.name}`}
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border">
                    <Image
                      src={row.product.imageUrl ?? '/placeholder.jpg'}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="shrink-0 tabular-nums">
                    <p className="text-sm font-semibold text-foreground">{formatPrice(row.unitPrice)}</p>
                    <p className="text-xs text-muted-foreground">each</p>
                  </div>
                  <div className="ml-auto flex shrink-0 flex-col items-end gap-1.5">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => updateRelatedQuantity(row.product.id, -1)}
                        aria-label="Decrease add-on quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">
                        {row.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => updateRelatedQuantity(row.product.id, 1)}
                        aria-label="Increase add-on quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-right text-sm font-bold tabular-nums text-foreground">
                      {formatPrice(row.unitPrice * row.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg border border-border bg-muted/20 px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Total</span>
                <span className="font-bold tabular-nums text-foreground">{formatPrice(grandTotal)}</span>
              </div>
              <Button
                className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                onClick={add}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to cart
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-5 text-sm text-muted-foreground transition-all duration-300 ease-out">
            Select item to open cart and checkout.
          </div>
        )}
      </div>
  )

  const rentalCheckoutCard = hasRentalSelection ? (
    <div className="w-full rounded-xl border border-border bg-card p-5">
      <h3
        className="text-lg font-black text-foreground"
        style={{ fontFamily: 'var(--font-barlow)' }}
      >
        Cart & checkout
      </h3>
      <div className="translate-y-0 opacity-100 transition-all duration-300 ease-out">
        <div className="mt-5 max-h-[420px] space-y-3 overflow-x-hidden overflow-y-auto pr-1">
          <div className={giftLineRowClass} aria-label={`Rental: ${shopProduct.name}`}>
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border">
              <Image
                src={selectedVariant?.imageUrl ?? shopProduct.imageUrl ?? '/placeholder.jpg'}
                alt=""
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
            <div className="shrink-0 tabular-nums">
              <p className="text-sm font-semibold text-foreground">
                {formatPrice(selectedRentalUnitPrice)}
              </p>
              {rentalBaseTimesPeriod ? <p className="text-xs text-muted-foreground">{rentalBaseTimesPeriod}</p> : null}
            </div>
            <div className="ml-auto flex shrink-0 flex-col items-end gap-1.5">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={dec}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">
                  {qty}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={inc}
                  aria-label="Increase quantity"
                  disabled={maxQty != null && qty >= maxQty}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-right text-sm font-bold tabular-nums text-foreground">
                {formatPrice(totalPrice)}
              </p>
            </div>
          </div>
          {selectedRelatedRows.map((row) => (
            <div
              key={row.product.id}
              className={giftLineRowClass}
              aria-label={`Add-on: ${row.product.name}`}
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border">
                <Image
                  src={row.product.imageUrl ?? '/placeholder.jpg'}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div className="shrink-0 tabular-nums">
                <p className="text-sm font-semibold text-foreground">{formatPrice(row.unitPrice)}</p>
                <p className="text-xs text-muted-foreground">each</p>
              </div>
              <div className="ml-auto flex shrink-0 flex-col items-end gap-1.5">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => updateRelatedQuantity(row.product.id, -1)}
                    aria-label="Decrease add-on quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">
                    {row.quantity}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => updateRelatedQuantity(row.product.id, 1)}
                    aria-label="Increase add-on quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-right text-sm font-bold tabular-nums text-foreground">
                  {formatPrice(row.unitPrice * row.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-lg border border-border bg-muted/20 px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Total</span>
            <span className="font-bold tabular-nums text-foreground">{formatPrice(rentalGrandTotal)}</span>
          </div>
          <Button
            className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            onClick={add}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to cart
          </Button>
        </div>
      </div>
    </div>
  ) : null

  const standardCheckoutCard = showPinnedStandardCheckout ? (
    <div className="w-full rounded-xl border border-border bg-card p-5">
      <h3
        className="text-lg font-black text-foreground"
        style={{ fontFamily: 'var(--font-barlow)' }}
      >
        Cart & checkout
      </h3>
      <div className="translate-y-0 opacity-100 transition-all duration-300 ease-out">
        <div className="mt-5 max-h-[420px] space-y-3 overflow-x-hidden overflow-y-auto pr-1">
          <div className={giftLineRowClass} aria-label={`Product: ${shopProduct.name}`}>
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border">
              <Image
                src={shopProduct.imageUrl ?? '/placeholder.jpg'}
                alt=""
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
            <div className="shrink-0 tabular-nums">
              <p className="text-sm font-semibold text-foreground">{formatPrice(heroUnitPrice)}</p>
              <p className="text-xs text-muted-foreground">each</p>
            </div>
            <div className="ml-auto flex shrink-0 flex-col items-end gap-1.5">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={dec}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">
                  {qty}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={inc}
                  aria-label="Increase quantity"
                  disabled={maxQty != null && qty >= maxQty}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-right text-sm font-bold tabular-nums text-foreground">
                {formatPrice(totalPrice)}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 rounded-lg border border-border bg-muted/20 px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Total</span>
            <span className="font-bold tabular-nums text-foreground">{formatPrice(totalPrice)}</span>
          </div>
          <Button
            className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            onClick={add}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to cart
          </Button>
        </div>
      </div>
    </div>
  ) : null

  return (
    <div
      className={cn(
        'space-y-12',
        isGiftProduct && selectedGiftQuantity > 0 && 'xl:pr-[460px] 2xl:pr-[480px]',
        isRental && hasRentalSelection && 'xl:pr-[460px] 2xl:pr-[480px]',
        showPinnedStandardCheckout && 'xl:pr-[460px] 2xl:pr-[480px]',
      )}
    >
      {productDetailSection}

      {showGiftLinkedAddOnSection ? (
        <div className="relative">
          <div className="min-w-0 transition-all duration-300 ease-out">
            {linkedAddOnRelatedSection}
          </div>
          <div className="mt-6 xl:hidden">
            {giftCheckoutCard}
          </div>
          <div className="hidden xl:block">
            <div className="fixed right-[max(1rem,calc((100vw-88rem)/2+1rem))] top-30 z-40 w-[min(420px,calc(100vw-2rem))]">
              {giftCheckoutCard}
            </div>
          </div>
        </div>
      ) : null}

      {showRentalLinkedAddOnSection ? (
        <div className="min-w-0 transition-all duration-300 ease-out">
          {linkedAddOnRelatedSection}
        </div>
      ) : null}

      {isRental && hasRentalSelection ? (
        <div className="relative">
          <div className="mt-6 xl:hidden">
            {rentalCheckoutCard}
          </div>
          <div className="hidden xl:block">
            <div className="fixed right-[max(1rem,calc((100vw-88rem)/2+1rem))] top-24 z-40 w-[min(420px,calc(100vw-2rem))]">
              {rentalCheckoutCard}
            </div>
          </div>
        </div>
      ) : null}

      {showPinnedStandardCheckout ? (
        <div className="relative">
          <div className="mt-6 xl:hidden">{standardCheckoutCard}</div>
          <div className="hidden xl:block">
            <div className="fixed right-[max(1rem,calc((100vw-88rem)/2+1rem))] top-24 z-40 w-[min(420px,calc(100vw-2rem))]">
              {standardCheckoutCard}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

