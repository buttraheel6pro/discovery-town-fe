/** Product form — shared create/edit form for inventory products. */
'use client'

import { useCallback, useMemo, useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Product, ProductCategory, RentalBillingType } from '@/lib/types'

export interface HourlyTierDraft {
  hours: string
  price: string
}

export interface DailyTierDraft {
  days: string
  price: string
}

export type ProductDraft = {
  name: string
  sku: string
  description: string
  categoryId: string
  price: string
  memberPrice: string
  compareAtPrice: string
  costPrice: string
  taxable: boolean
  taxRate: string
  trackInventory: boolean
  stockCount: string
  lowStockThreshold: string
  allowBackorders: boolean
  availableOnline: boolean
  availablePOS: boolean
  isActive: boolean
  imageUrl: string
  canBeAddOn: boolean
  isRental: boolean
  rentalBillingType: RentalBillingType | ''
  rentalPricePerDay: string
  rentalPricePerHalfDay: string
  rentalPricePerHour: string
  rentalPricePerEvent: string
  rentalPriceFirstHourPremium: string
  rentalMinHours: string
  rentalHourlyTierPrices: HourlyTierDraft[]
  rentalDailyTierPrices: DailyTierDraft[]
  requiresDelivery: boolean
  requiresStaff: boolean
  setupMinutes: string
  maxRentalDays: string
  rentalSlotIncrementMinutes: string
  depositAmount: string
}

export interface ProductFormProps {
  readonly value: ProductDraft
  readonly onChange: (next: ProductDraft) => void
  readonly categories: ProductCategory[]
  /** When set, product is already promoted — show read-only linked add-on chip. */
  readonly lockedPromotedAddOn?: { readonly id: string; readonly name: string } | null
  readonly disabled?: boolean
  readonly className?: string
}

function toNumberOrEmpty(value: string): number | undefined {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed)) return undefined
  return parsed
}

export function productToDraft(product: Product, categories: ProductCategory[]): ProductDraft {
  return {
    name: product.name ?? '',
    sku: product.sku ?? '',
    description: product.description ?? '',
    categoryId: product.categoryId ?? categories[0]?.id ?? '',
    price: String(product.price ?? ''),
    memberPrice: product.memberPrice != null ? String(product.memberPrice) : '',
    compareAtPrice: product.compareAtPrice != null ? String(product.compareAtPrice) : '',
    costPrice: product.costPrice != null ? String(product.costPrice) : '',
    taxable: product.taxable ?? true,
    taxRate: String(product.taxRate ?? 20),
    trackInventory: product.trackInventory ?? true,
    stockCount: String(product.stockCount ?? 0),
    lowStockThreshold: String(product.lowStockThreshold ?? 10),
    allowBackorders: product.allowBackorders ?? false,
    availableOnline: product.availableOnline ?? true,
    availablePOS: product.availablePOS ?? true,
    isActive: product.isActive ?? true,
    imageUrl: product.imageUrl ?? '',
    canBeAddOn: false,
    isRental: product.isRental ?? false,
    rentalBillingType: product.rentalBillingType ?? '',
    rentalPricePerDay: product.rentalPricePerDay != null ? String(product.rentalPricePerDay) : '',
    rentalPricePerHalfDay:
      product.rentalPricePerHalfDay != null ? String(product.rentalPricePerHalfDay) : '',
    rentalPricePerHour: product.pricePerHour != null ? String(product.pricePerHour) : '',
    rentalPricePerEvent: product.pricePerEvent != null ? String(product.pricePerEvent) : '',
    rentalPriceFirstHourPremium:
      product.priceFirstHourPremium != null ? String(product.priceFirstHourPremium) : '',
    rentalMinHours: product.minHours != null ? String(product.minHours) : '',
    rentalHourlyTierPrices: (product.rentalHourlyTierPrices ?? []).map((tier) => ({
      hours: String(tier.hours),
      price: String(tier.price),
    })),
    rentalDailyTierPrices: (product.rentalDailyTierPrices ?? []).map((tier) => ({
      days: String(tier.days),
      price: String(tier.price),
    })),
    requiresDelivery: product.requiresDelivery ?? false,
    requiresStaff: product.requiresStaff ?? false,
    setupMinutes: product.setupMinutes != null ? String(product.setupMinutes) : '',
    maxRentalDays: product.maxRentalDays != null ? String(product.maxRentalDays) : '',
    rentalSlotIncrementMinutes:
      product.rentalSlotIncrementMinutes != null ? String(product.rentalSlotIncrementMinutes) : '',
    depositAmount: product.depositAmount != null ? String(product.depositAmount) : '',
  }
}

export function draftToProductPatch(draft: ProductDraft): Partial<Product> {
  const price = toNumberOrEmpty(draft.price)
  const memberPrice = toNumberOrEmpty(draft.memberPrice)
  const compareAtPrice = toNumberOrEmpty(draft.compareAtPrice)
  const costPrice = toNumberOrEmpty(draft.costPrice)
  const taxRate = toNumberOrEmpty(draft.taxRate)
  const rentalPricePerDay = toNumberOrEmpty(draft.rentalPricePerDay)
  const rentalPricePerHalfDay = toNumberOrEmpty(draft.rentalPricePerHalfDay)
  const rentalPricePerHour = toNumberOrEmpty(draft.rentalPricePerHour)
  const rentalPricePerEvent = toNumberOrEmpty(draft.rentalPricePerEvent)
  const rentalPriceFirstHourPremium = toNumberOrEmpty(draft.rentalPriceFirstHourPremium)
  const depositAmount = toNumberOrEmpty(draft.depositAmount)
  const rentalMinHours = Number.parseInt(draft.rentalMinHours || '0', 10)
  const rentalHourlyTierPrices = draft.rentalHourlyTierPrices
    .map((tier) => {
      const hours = Number.parseInt(tier.hours.trim(), 10)
      const price = Number.parseFloat(tier.price.trim())
      if (!Number.isFinite(hours) || hours < 2) return null
      if (!Number.isFinite(price) || price < 0) return null
      return { hours, price }
    })
    .filter((tier): tier is { hours: number; price: number } => Boolean(tier))
  const rentalDailyTierPrices = draft.rentalDailyTierPrices
    .map((tier) => {
      const days = Number.parseInt(tier.days.trim(), 10)
      const price = Number.parseFloat(tier.price.trim())
      if (!Number.isFinite(days) || days < 2) return null
      if (!Number.isFinite(price) || price < 0) return null
      return { days, price }
    })
    .filter((tier): tier is { days: number; price: number } => Boolean(tier))
  const stockCount = Number.parseInt(draft.stockCount || '0', 10)
  const lowStockThreshold = Number.parseInt(draft.lowStockThreshold || '0', 10)
  const setupMinutes = Number.parseInt(draft.setupMinutes || '0', 10)
  const maxRentalDays = Number.parseInt(draft.maxRentalDays || '0', 10)
  const rentalSlotIncrementMinutes = Number.parseInt(draft.rentalSlotIncrementMinutes || '0', 10)

  const base: Partial<Product> = {
    name: draft.name.trim(),
    sku: draft.sku.trim() || undefined,
    description: draft.description.trim() || undefined,
    categoryId: draft.categoryId,
    price: price ?? 0,
    memberPrice: memberPrice ?? undefined,
    compareAtPrice: compareAtPrice ?? null,
    costPrice: costPrice ?? undefined,
    taxable: draft.taxable,
    taxRate: taxRate ?? 20,
    trackInventory: draft.trackInventory,
    stockCount: Number.isFinite(stockCount) ? stockCount : 0,
    lowStockThreshold: Number.isFinite(lowStockThreshold) ? lowStockThreshold : 0,
    allowBackorders: draft.allowBackorders,
    availableOnline: draft.availableOnline,
    availablePOS: draft.availablePOS,
    isActive: draft.isActive,
    imageUrl: draft.imageUrl.trim() || undefined,
    isRental: draft.isRental,
    rentalBillingType: draft.rentalBillingType || undefined,
    rentalPricePerDay: rentalPricePerDay ?? undefined,
    rentalPricePerHalfDay: rentalPricePerHalfDay ?? undefined,
    pricePerHour: rentalPricePerHour ?? undefined,
    pricePerEvent: rentalPricePerEvent ?? undefined,
    priceFirstHourPremium: rentalPriceFirstHourPremium ?? undefined,
    minHours:
      Number.isFinite(rentalMinHours) && rentalMinHours > 0 ? rentalMinHours : undefined,
    rentalHourlyTierPrices:
      rentalHourlyTierPrices.length > 0 ? rentalHourlyTierPrices : undefined,
    rentalDailyTierPrices:
      rentalDailyTierPrices.length > 0 ? rentalDailyTierPrices : undefined,
    requiresDelivery: draft.requiresDelivery,
    requiresStaff: draft.requiresStaff,
    setupMinutes: Number.isFinite(setupMinutes) && setupMinutes > 0 ? setupMinutes : undefined,
    maxRentalDays: Number.isFinite(maxRentalDays) && maxRentalDays > 0 ? maxRentalDays : undefined,
    rentalSlotIncrementMinutes:
      Number.isFinite(rentalSlotIncrementMinutes) &&
      (rentalSlotIncrementMinutes === 30 || rentalSlotIncrementMinutes === 60)
        ? rentalSlotIncrementMinutes
        : undefined,
    depositAmount: depositAmount ?? undefined,
  }
  if (draft.canBeAddOn) {
    return { ...base, canBeAddOn: true }
  }
  return base
}

export function ProductForm({
  value,
  onChange,
  categories,
  lockedPromotedAddOn = null,
  disabled = false,
  className,
}: Readonly<ProductFormProps>) {
  const [uploading, setUploading] = useState(false)

  const set = useCallback(
    <K extends keyof ProductDraft>(key: K, next: ProductDraft[K]) => {
      onChange({ ...value, [key]: next })
    },
    [onChange, value],
  )

  const orderedCategories = useMemo(() => {
    return categories.slice().sort((a, b) => a.displayOrder - b.displayOrder)
  }, [categories])

  const categoryById = useMemo(() => {
    return new Map(orderedCategories.map((category) => [category.id, category]))
  }, [orderedCategories])

  const topCategories = useMemo(() => {
    return orderedCategories.filter((category) => category.parentId == null || category.parentId === '')
  }, [orderedCategories])

  const selectedCategory = categoryById.get(value.categoryId) ?? null
  const selectedTopCategoryId = useMemo(() => {
    if (selectedCategory?.parentId) {
      return selectedCategory.parentId
    }
    if (selectedCategory) {
      return selectedCategory.id
    }
    return topCategories[0]?.id ?? ''
  }, [selectedCategory, topCategories])

  const subCategories = useMemo(() => {
    if (!selectedTopCategoryId) {
      return []
    }
    return orderedCategories.filter((category) => category.parentId === selectedTopCategoryId)
  }, [orderedCategories, selectedTopCategoryId])

  const selectedSubCategoryId = useMemo(() => {
    const selectedSubCategory =
      selectedCategory?.parentId === selectedTopCategoryId ? selectedCategory.id : null
    if (selectedSubCategory) {
      return selectedSubCategory
    }
    return subCategories[0]?.id ?? ''
  }, [selectedCategory, selectedTopCategoryId, subCategories])

  async function onPickFile(file: File | null) {
    if (!file) return
    setUploading(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result ?? ''))
        reader.onerror = () => reject(new Error('Failed to read image file'))
        reader.readAsDataURL(file)
      })
      set('imageUrl', dataUrl)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="prod-name">Name</Label>
          <Input
            id="prod-name"
            value={value.name}
            onChange={(e) => set('name', e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prod-sku">SKU</Label>
          <Input
            id="prod-sku"
            value={value.sku}
            onChange={(e) => set('sku', e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prod-desc">Description</Label>
        <Textarea
          id="prod-desc"
          value={value.description}
          onChange={(e) => set('description', e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="prod-category">Category</Label>
          <Select
            value={selectedTopCategoryId}
            onValueChange={(nextTopCategoryId) => {
              const nextSubCategories = orderedCategories.filter(
                (category) => category.parentId === nextTopCategoryId,
              )
              const nextCategoryId = nextSubCategories[0]?.id ?? nextTopCategoryId
              set('categoryId', nextCategoryId)
            }}
            disabled={disabled}
          >
            <SelectTrigger id="prod-category" className="w-full min-w-0">
              <SelectValue placeholder="Select category" className="truncate" />
            </SelectTrigger>
            <SelectContent>
              {topCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="prod-subcategory">Sub-category</Label>
          <Select
            value={selectedSubCategoryId}
            onValueChange={(nextSubCategoryId) => set('categoryId', nextSubCategoryId)}
            disabled={disabled || subCategories.length === 0}
          >
            <SelectTrigger id="prod-subcategory" className="w-full min-w-0">
              <SelectValue
                placeholder={
                  subCategories.length > 0 ? 'Select sub-category' : 'No sub-categories'
                }
                className="truncate"
              />
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
        <div className="min-w-0 space-y-2">
          <Label htmlFor="prod-image">Image</Label>
          <div className="flex items-center gap-2">
            <Input
              id="prod-image"
              value={value.imageUrl}
              onChange={(e) => set('imageUrl', e.target.value)}
              disabled={disabled}
              placeholder="Paste URL or upload…"
            />
            <div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="prod-image-file"
                onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
                disabled={disabled}
              />
              <Button
                type="button"
                variant="outline"
                disabled={disabled || uploading}
                onClick={() => document.getElementById('prod-image-file')?.click()}
              >
                Upload
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="prod-price">Price</Label>
          <Input
            id="prod-price"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={value.price}
            onChange={(e) => set('price', e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prod-member">Member price</Label>
          <Input
            id="prod-member"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={value.memberPrice}
            onChange={(e) => set('memberPrice', e.target.value)}
            disabled={disabled}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prod-compare">Compare at price</Label>
          <Input
            id="prod-compare"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={value.compareAtPrice}
            onChange={(e) => set('compareAtPrice', e.target.value)}
            disabled={disabled}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prod-cost">Cost price</Label>
          <Input
            id="prod-cost"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={value.costPrice}
            onChange={(e) => set('costPrice', e.target.value)}
            disabled={disabled}
            placeholder="Internal only"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="prod-taxable">Taxable</Label>
          <Switch
            id="prod-taxable"
            checked={value.taxable}
            onCheckedChange={(v) => set('taxable', v)}
            disabled={disabled}
          />
        </div>
        <div className={cn('space-y-2', !value.taxable && 'opacity-50')}>
          <Label htmlFor="prod-taxrate">Tax rate (%)</Label>
          <Input
            id="prod-taxrate"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={value.taxRate}
            onChange={(e) => set('taxRate', e.target.value)}
            disabled={disabled || !value.taxable}
          />
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold text-foreground">Inventory</p>
        <div className="flex items-center justify-between">
          <Label htmlFor="prod-track">Track inventory</Label>
          <Switch
            id="prod-track"
            checked={value.trackInventory}
            onCheckedChange={(v) => set('trackInventory', v)}
            disabled={disabled}
          />
        </div>

        <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-3', !value.trackInventory && 'opacity-50')}>
          <div className="space-y-2">
            <Label htmlFor="prod-stock">Stock count</Label>
            <Input
              id="prod-stock"
              type="number"
              step="1"
              value={value.stockCount}
              onChange={(e) => set('stockCount', e.target.value)}
              disabled={disabled || !value.trackInventory}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prod-threshold">Low stock threshold</Label>
            <Input
              id="prod-threshold"
              type="number"
              step="1"
              value={value.lowStockThreshold}
              onChange={(e) => set('lowStockThreshold', e.target.value)}
              disabled={disabled || !value.trackInventory}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3 md:col-span-1">
            <Label htmlFor="prod-backorder">Allow backorders</Label>
            <Switch
              id="prod-backorder"
              checked={value.allowBackorders}
              onCheckedChange={(v) => set('allowBackorders', v)}
              disabled={disabled || !value.trackInventory}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="prod-online">Available online</Label>
          <Switch
            id="prod-online"
            checked={value.availableOnline}
            onCheckedChange={(v) => set('availableOnline', v)}
            disabled={disabled}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="prod-pos">Available POS</Label>
          <Switch
            id="prod-pos"
            checked={value.availablePOS}
            onCheckedChange={(v) => set('availablePOS', v)}
            disabled={disabled}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="prod-active">Active</Label>
          <Switch
            id="prod-active"
            checked={value.isActive}
            onCheckedChange={(v) => set('isActive', v)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold text-foreground">Booking add-on</p>
        {lockedPromotedAddOn ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className="border border-emerald-600/40 bg-emerald-600/10 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-600/15 dark:text-emerald-200">
                Linked add-on: {lockedPromotedAddOn.name}
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-left">
              This product is permanently linked to an add-on. This cannot be reversed.
            </TooltipContent>
          </Tooltip>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <Checkbox
                id="prod-addon"
                checked={value.canBeAddOn}
                onCheckedChange={(v) => set('canBeAddOn', Boolean(v))}
                disabled={disabled}
              />
              <div className="space-y-1">
                <Label htmlFor="prod-addon" className="text-sm font-medium leading-snug">
                  Make available as a booking add-on
                </Label>
                <p className="text-xs text-muted-foreground">
                  This product can also be selected during bookings and event packages.
                </p>
              </div>
            </div>
            {value.canBeAddOn ? (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertTitle className="text-amber-900 dark:text-amber-100">Important</AlertTitle>
                <AlertDescription className="text-amber-900/90 dark:text-amber-100/90">
                  Once saved, this product will be permanently linked to an add-on. This cannot be
                  reversed.
                </AlertDescription>
              </Alert>
            ) : null}
          </>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold text-foreground">Rental settings</p>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="prod-is-rental">Rental product</Label>
          <Switch
            id="prod-is-rental"
            checked={value.isRental}
            onCheckedChange={(next) => set('isRental', next)}
            disabled={disabled}
          />
        </div>

        {value.isRental ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prod-rental-billing">Rental billing type</Label>
              <Select
                value={value.rentalBillingType}
                onValueChange={(next) => set('rentalBillingType', next as RentalBillingType)}
                disabled={disabled}
              >
                <SelectTrigger id="prod-rental-billing">
                  <SelectValue placeholder="Select rental billing type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PER_DAY">Per day</SelectItem>
                  <SelectItem value="PER_HALF_DAY">Per half day</SelectItem>
                  <SelectItem value="PER_HOUR">Per hour</SelectItem>
                  <SelectItem value="PER_EVENT">Per event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(value.rentalBillingType === 'PER_DAY' || value.rentalBillingType === '') && (
                <div className="space-y-2">
                  <Label htmlFor="prod-rental-per-day">Rental price per day</Label>
                  <Input
                    id="prod-rental-per-day"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={value.rentalPricePerDay}
                    onChange={(e) => set('rentalPricePerDay', e.target.value)}
                    disabled={disabled}
                  />
                </div>
              )}
              {(value.rentalBillingType === 'PER_DAY' || value.rentalBillingType === 'PER_HALF_DAY') && (
                <div className="space-y-2">
                  <Label htmlFor="prod-rental-per-half-day">Rental price per half day</Label>
                  <Input
                    id="prod-rental-per-half-day"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={value.rentalPricePerHalfDay}
                    onChange={(e) => set('rentalPricePerHalfDay', e.target.value)}
                    disabled={disabled}
                  />
                </div>
              )}
              {value.rentalBillingType === 'PER_HOUR' && (
                <div className="space-y-2">
                  <Label htmlFor="prod-rental-per-hour">Rental price per hour</Label>
                  <Input
                    id="prod-rental-per-hour"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={value.rentalPricePerHour}
                    onChange={(e) => set('rentalPricePerHour', e.target.value)}
                    disabled={disabled}
                  />
                </div>
              )}
              {value.rentalBillingType === 'PER_EVENT' && (
                <div className="space-y-2">
                  <Label htmlFor="prod-rental-per-event">Rental price per event</Label>
                  <Input
                    id="prod-rental-per-event"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={value.rentalPricePerEvent}
                    onChange={(e) => set('rentalPricePerEvent', e.target.value)}
                    disabled={disabled}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="prod-rental-setup-minutes">Setup minutes</Label>
                <Input
                  id="prod-rental-setup-minutes"
                  type="number"
                  step="1"
                  value={value.setupMinutes}
                  onChange={(e) => set('setupMinutes', e.target.value)}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prod-rental-max-days">Max rental days</Label>
                <Input
                  id="prod-rental-max-days"
                  type="number"
                  step="1"
                  value={value.maxRentalDays}
                  onChange={(e) => set('maxRentalDays', e.target.value)}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prod-rental-deposit">Deposit amount</Label>
                <Input
                  id="prod-rental-deposit"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={value.depositAmount}
                  onChange={(e) => set('depositAmount', e.target.value)}
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label htmlFor="prod-rental-requires-delivery">Requires delivery</Label>
                <Switch
                  id="prod-rental-requires-delivery"
                  checked={value.requiresDelivery}
                  onCheckedChange={(next) => set('requiresDelivery', next)}
                  disabled={disabled}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label htmlFor="prod-rental-requires-staff">Requires staff</Label>
                <Switch
                  id="prod-rental-requires-staff"
                  checked={value.requiresStaff}
                  onCheckedChange={(next) => set('requiresStaff', next)}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

