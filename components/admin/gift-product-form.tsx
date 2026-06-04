/** Gifts product form with locked category and linked catalog pickers. */
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  ProductLinkMultiSelect,
  type ProductLinkPickerOption,
} from '@/components/admin/product-link-multi-select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { computeGiftPriceUpperLimit } from '@/lib/gift-product'
import { cn } from '@/lib/utils'
import type { Coupon, ProductCategory, SchedulingOccasion } from '@/lib/types'

export interface GiftProductDraft {
  name: string
  sku: string
  description: string
  categoryId: string
  imageUrl: string
  price: string
  memberPrice: string
  compareAtPrice: string
  costPrice: string
  taxable: boolean
  taxRate: string
  productIds: string[]
  addOnProductIds: string[]
  couponIds: string[]
  couponsWithPackage: boolean
  isPerishable: boolean
  basketCapacity: string
  occasionIds: string[]
  /** Auto-derived basket + add-on price ceiling; persisted as `giftPriceUpperLimit`. */
  giftPriceUpperLimit: string
  /** Customer visibility only (does not remove from admin). */
  isActive: boolean
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })
}

export interface GiftProductFormProps {
  readonly value: GiftProductDraft
  readonly onChange: (next: GiftProductDraft) => void
  readonly giftsCategoryName: string
  readonly subCategories: ProductCategory[]
  readonly productOptions: Array<{
    id: string
    name: string
    sku?: string
    imageUrl?: string
    description?: string
    price: number
  }>
  readonly addOnOptions: Array<{
    id: string
    name: string
    sku?: string
    imageUrl?: string
    description?: string
    price?: number
  }>
  readonly couponOptions: Coupon[]
  readonly occasions: SchedulingOccasion[]
}

export function GiftProductForm({
  value,
  onChange,
  giftsCategoryName,
  subCategories,
  productOptions,
  addOnOptions,
  couponOptions,
  occasions,
}: Readonly<GiftProductFormProps>) {
  const [uploading, setUploading] = useState(false)
  const [basketCapacityError, setBasketCapacityError] = useState<string | null>(null)

  const set = useCallback(
    <K extends keyof GiftProductDraft>(key: K, next: GiftProductDraft[K]) => {
      onChange({ ...value, [key]: next })
    },
    [onChange, value],
  )

  const productPickerOptions = useMemo<ProductLinkPickerOption[]>(
    () =>
      productOptions.map((product) => ({
        id: product.id,
        label: product.name,
        secondary: product.sku,
        imageUrl: product.imageUrl,
        description: product.description,
        price: product.price,
      })),
    [productOptions],
  )

  const addOnPickerOptions = useMemo<ProductLinkPickerOption[]>(
    () =>
      addOnOptions.map((product) => ({
        id: product.id,
        label: product.name,
        secondary: product.sku,
        imageUrl: product.imageUrl,
        description: product.description,
        price: product.price,
      })),
    [addOnOptions],
  )

  const occasionPickerOptions = useMemo<ProductLinkPickerOption[]>(
    () =>
      occasions.map((occasion) => ({
        id: occasion.id,
        label: occasion.name,
        description: occasion.description,
        imageUrl: occasion.image,
      })),
    [occasions],
  )

  const couponPickerOptions = useMemo<ProductLinkPickerOption[]>(
    () =>
      couponOptions.map((coupon) => {
        const maybeCoupon = coupon as unknown as Record<string, unknown>
        const imageUrl =
          typeof maybeCoupon.imageUrl === 'string' ? maybeCoupon.imageUrl : undefined
        return {
          id: coupon.id,
          label: `${coupon.code} - ${coupon.name}`,
          imageUrl,
        }
      }),
    [couponOptions],
  )

  const basketCapacityLimit = useMemo(() => {
    const parsed = Number.parseInt(value.basketCapacity.trim(), 10)
    if (!Number.isFinite(parsed) || parsed < 0) {
      return undefined
    }
    return parsed
  }, [value.basketCapacity])

  const productPriceById = useMemo(() => {
    return new Map(productOptions.map((product) => [product.id, product.price]))
  }, [productOptions])

  const resolveLinkPrice = useMemo(() => {
    const merged = new Map<string, number>(productPriceById)
    for (const row of addOnOptions) {
      merged.set(row.id, row.price ?? 0)
    }
    return (id: string) => merged.get(id) ?? 0
  }, [addOnOptions, productPriceById])

  const selectedProductsTotal = useMemo(() => {
    return value.productIds.reduce((sum, productId) => {
      return sum + (productPriceById.get(productId) ?? 0)
    }, 0)
  }, [productPriceById, value.productIds])

  const computedGiftPriceUpperLimit = useMemo(
    () =>
      computeGiftPriceUpperLimit({
        basketProductIds: value.productIds,
        addOnProductIds: value.addOnProductIds,
        resolvePrice: resolveLinkPrice,
      }),
    [resolveLinkPrice, value.addOnProductIds, value.productIds],
  )

  useEffect(() => {
    const nextPrice = selectedProductsTotal.toFixed(2)
    if (value.price === nextPrice) return
    set('price', nextPrice)
  }, [selectedProductsTotal, set, value.price])

  useEffect(() => {
    const nextUpper = computedGiftPriceUpperLimit.toFixed(2)
    if (value.giftPriceUpperLimit === nextUpper) return
    set('giftPriceUpperLimit', nextUpper)
  }, [computedGiftPriceUpperLimit, set, value.giftPriceUpperLimit])

  useEffect(() => {
    if (typeof basketCapacityLimit !== 'number') return
    setBasketCapacityError(null)
    if (value.productIds.length <= basketCapacityLimit) return
    set('productIds', value.productIds.slice(0, basketCapacityLimit))
  }, [basketCapacityLimit, set, value.productIds])

  async function onPickImageFile(file: File | null): Promise<void> {
    if (!file) return
    setUploading(true)
    try {
      const dataUrl = await fileToDataUrl(file)
      set('imageUrl', dataUrl)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="gift-name">Name</Label>
          <Input
            id="gift-name"
            value={value.name}
            onChange={(event) => set('name', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gift-sku">SKU</Label>
          <Input
            id="gift-sku"
            value={value.sku}
            onChange={(event) => set('sku', event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gift-description">Description</Label>
        <Textarea
          id="gift-description"
          value={value.description}
          onChange={(event) => set('description', event.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-2">
          <Label>Category</Label>
          <Input value={giftsCategoryName} disabled />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="gift-sub-category">Sub-category</Label>
          <Select value={value.categoryId} onValueChange={(next) => set('categoryId', next)}>
            <SelectTrigger id="gift-sub-category" className="w-full min-w-0">
              <SelectValue placeholder="Select sub-category" className="truncate" />
            </SelectTrigger>
            <SelectContent>
              {subCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gift-image">Image URL</Label>
          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            <Input
              id="gift-image"
              value={value.imageUrl}
              onChange={(event) => set('imageUrl', event.target.value)}
              placeholder="https://... or upload"
            />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="gift-image-file"
              onChange={(event) => void onPickImageFile(event.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => document.getElementById('gift-image-file')?.click()}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <ProductLinkMultiSelect
            label="Occasions"
            placeholder="Select occasions"
            searchPlaceholder="Search occasions..."
            options={occasionPickerOptions}
            selectedIds={value.occasionIds}
            onChange={(next) => set('occasionIds', next)}
            helperText="Choose all occasions this gift bundle fits."
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="gift-basket-capacity">Basket capacity</Label>
          <Input
            id="gift-basket-capacity"
            type="number"
            step="1"
            min="0"
            className={cn(
              'w-full',
              basketCapacityError ? 'border-destructive focus-visible:ring-destructive/30' : '',
            )}
            value={value.basketCapacity}
            onChange={(event) => {
              const next = event.target.value
              set('basketCapacity', next)
              const parsed = Number.parseInt(next.trim(), 10)
              if (Number.isFinite(parsed) && parsed >= 0) {
                setBasketCapacityError(null)
              }
            }}
            placeholder="0"
          />
          {basketCapacityError ? (
            <p className="text-xs text-destructive">{basketCapacityError}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="gift-price">Price (basket)</Label>
          <Input
            id="gift-price"
            type="number"
            inputMode="decimal"
            step="0.01"
            disabled
            value={value.price}
            onChange={(event) => set('price', event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Auto-calculated from selected products.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gift-price-upper-limit">Upper limit (basket + add-ons)</Label>
          <Input
            id="gift-price-upper-limit"
            type="number"
            inputMode="decimal"
            step="0.01"
            disabled
            value={value.giftPriceUpperLimit}
            onChange={(event) => set('giftPriceUpperLimit', event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Auto-calculated from basket total plus nice-to-have add-ons.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="gift-member-price">Member price</Label>
          <Input
            id="gift-member-price"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={value.memberPrice}
            onChange={(event) => set('memberPrice', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gift-compare-price">Compare at price</Label>
          <Input
            id="gift-compare-price"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={value.compareAtPrice}
            onChange={(event) => set('compareAtPrice', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gift-cost-price">Cost price</Label>
          <Input
            id="gift-cost-price"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={value.costPrice}
            onChange={(event) => set('costPrice', event.target.value)}
          />
        </div>
      </div>

      <ProductLinkMultiSelect
        label="Products"
        placeholder="Select products"
        searchPlaceholder="Search products..."
        options={productPickerOptions}
        selectedIds={value.productIds}
        onChange={(next) => set('productIds', next)}
        maxSelections={basketCapacityLimit}
        requiresLimit={true}
        onBlockedSelection={() =>
          setBasketCapacityError('First select basket capacity.')
        }
        helperText={
          typeof basketCapacityLimit === 'number'
            ? `Select exactly ${basketCapacityLimit} products to match basket capacity.`
            : 'Set basket capacity first to lock product selection count.'
        }
      />

      <ProductLinkMultiSelect
        label="Nice to have addon products"
        placeholder="Select addon products"
        searchPlaceholder="Search addon products..."
        options={addOnPickerOptions}
        selectedIds={value.addOnProductIds}
        onChange={(next) => set('addOnProductIds', next)}
      />

      <ProductLinkMultiSelect
        label="Voucher coupons"
        placeholder="Select voucher coupons"
        searchPlaceholder="Search coupons..."
        options={couponPickerOptions}
        selectedIds={value.couponIds}
        onChange={(next) => set('couponIds', next)}
        modalExtraContent={
          <div className="flex items-center justify-between">
            <Label htmlFor="gift-coupons-with-package">With package</Label>
            <Switch
              id="gift-coupons-with-package"
              checked={value.couponsWithPackage}
              onCheckedChange={(next) => set('couponsWithPackage', next)}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="gift-active">Is active</Label>
          <Switch
            id="gift-active"
            checked={value.isActive}
            onCheckedChange={(next) => set('isActive', next)}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="gift-perishable">Is perishable</Label>
          <Switch
            id="gift-perishable"
            checked={value.isPerishable}
            onCheckedChange={(next) => set('isPerishable', next)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="gift-taxable">Taxable</Label>
          <Switch
            id="gift-taxable"
            checked={value.taxable}
            onCheckedChange={(next) => set('taxable', next)}
          />
        </div>
        <div className={cn('space-y-2', !value.taxable && 'opacity-50')}>
          <Label htmlFor="gift-tax-rate">Tax rate (%)</Label>
          <Input
            id="gift-tax-rate"
            type="number"
            inputMode="decimal"
            step="0.01"
            disabled={!value.taxable}
            value={value.taxRate}
            onChange={(event) => set('taxRate', event.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
