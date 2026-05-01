/** Rental product form with locked Rentals category and rental settings. */
'use client'

import { useCallback, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { ProductCategory, RentalBillingType } from '@/lib/types'

import type { ProductDraft } from './product-form'

export interface RentalProductFormProps {
  readonly value: ProductDraft
  readonly onChange: (next: ProductDraft) => void
  readonly rentalsCategoryName: string
  readonly subCategories: ProductCategory[]
}

export function RentalProductForm({
  value,
  onChange,
  rentalsCategoryName,
  subCategories,
}: Readonly<RentalProductFormProps>) {
  const [uploading, setUploading] = useState(false)

  const set = useCallback(
    <K extends keyof ProductDraft>(key: K, next: ProductDraft[K]) => {
      onChange({ ...value, [key]: next })
    },
    [onChange, value],
  )

  const rentalPricingLabel = useMemo(() => {
    switch (value.rentalBillingType) {
      case 'PER_DAY':
        return 'Set per-day pricing (optional half-day pricing can also be added).'
      case 'PER_HALF_DAY':
        return 'Set half-day pricing for rental checkout.'
      case 'PER_HOUR':
        return 'Set hourly pricing used for time-based rental totals.'
      case 'PER_EVENT':
        return 'Set one fixed price per event rental.'
      default:
        return 'Select a rental billing type to configure pricing.'
    }
  }, [value.rentalBillingType])

  const tierRows = value.rentalHourlyTierPrices

  async function onPickImageFile(file: File | null): Promise<void> {
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rental-name">Name</Label>
          <Input
            id="rental-name"
            value={value.name}
            onChange={(event) => set('name', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rental-sku">SKU</Label>
          <Input
            id="rental-sku"
            value={value.sku}
            onChange={(event) => set('sku', event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rental-description">Description</Label>
        <Textarea
          id="rental-description"
          value={value.description}
          onChange={(event) => set('description', event.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Category</Label>
          <Input value={rentalsCategoryName} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rental-sub-category">Sub-category</Label>
          <Select
            value={value.categoryId}
            onValueChange={(next) => set('categoryId', next)}
          >
            <SelectTrigger id="rental-sub-category">
              <SelectValue placeholder="Select sub-category" />
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
          <Label htmlFor="rental-image-url">Image URL</Label>
          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            <Input
              id="rental-image-url"
              value={value.imageUrl}
              onChange={(event) => set('imageUrl', event.target.value)}
              placeholder="https://... or upload"
            />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="rental-image-file"
              onChange={(event) =>
                void onPickImageFile(event.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => document.getElementById('rental-image-file')?.click()}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rental-billing-type">Rental billing type</Label>
        <Select
          value={value.rentalBillingType}
          onValueChange={(next) => set('rentalBillingType', next as RentalBillingType)}
        >
          <SelectTrigger id="rental-billing-type">
            <SelectValue placeholder="Select billing type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PER_DAY">Per day</SelectItem>
            <SelectItem value="PER_HALF_DAY">Per half day</SelectItem>
            <SelectItem value="PER_HOUR">Per hour</SelectItem>
            <SelectItem value="PER_EVENT">Per event</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{rentalPricingLabel}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(value.rentalBillingType === 'PER_DAY' || value.rentalBillingType === '') ? (
          <div className="space-y-2">
            <Label htmlFor="rental-price-day">Rental price per day</Label>
            <Input
              id="rental-price-day"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={value.rentalPricePerDay}
              onChange={(event) => set('rentalPricePerDay', event.target.value)}
            />
          </div>
        ) : null}
        {(value.rentalBillingType === 'PER_DAY' || value.rentalBillingType === 'PER_HALF_DAY') ? (
          <div className="space-y-2">
            <Label htmlFor="rental-price-half-day">Rental price per half day</Label>
            <Input
              id="rental-price-half-day"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={value.rentalPricePerHalfDay}
              onChange={(event) => set('rentalPricePerHalfDay', event.target.value)}
            />
          </div>
        ) : null}
        {value.rentalBillingType === 'PER_HOUR' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="rental-price-hour">Default hourly rate (fallback)</Label>
              <Input
                id="rental-price-hour"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={value.rentalPricePerHour}
                onChange={(event) => set('rentalPricePerHour', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rental-price-first-hour">First hour premium (optional)</Label>
              <Input
                id="rental-price-first-hour"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={value.rentalPriceFirstHourPremium}
                onChange={(event) => set('rentalPriceFirstHourPremium', event.target.value)}
                placeholder="Overrides 1-hour price"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rental-min-hours">Minimum hours (optional)</Label>
              <Input
                id="rental-min-hours"
                type="number"
                step="1"
                value={value.rentalMinHours}
                onChange={(event) => set('rentalMinHours', event.target.value)}
                placeholder="e.g. 2"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Tiered duration prices</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    set('rentalHourlyTierPrices', [
                      ...value.rentalHourlyTierPrices,
                      { hours: '', price: '' },
                    ])
                  }
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add tier
                </Button>
              </div>
              {tierRows.length > 0 ? (
                <div className="space-y-2">
                  {tierRows.map((tier, index) => (
                    <div key={`${index}-${tier.hours}-${tier.price}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <Input
                        type="number"
                        step="1"
                        min="2"
                        placeholder="Hours (2+)"
                        value={tier.hours}
                        onChange={(event) => {
                          const next = tierRows.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, hours: event.target.value } : row,
                          )
                          set('rentalHourlyTierPrices', next)
                        }}
                      />
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        placeholder="Price"
                        value={tier.price}
                        onChange={(event) => {
                          const next = tierRows.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, price: event.target.value } : row,
                          )
                          set('rentalHourlyTierPrices', next)
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          set(
                            'rentalHourlyTierPrices',
                            tierRows.filter((_, rowIndex) => rowIndex !== index),
                          )
                        }
                        aria-label="Remove tier"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Example: 2 hours = 250, 3 hours = 375.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Add custom duration prices for specific hours.
                </p>
              )}
            </div>
          </>
        ) : null}
        {value.rentalBillingType === 'PER_EVENT' ? (
          <div className="space-y-2">
            <Label htmlFor="rental-price-event">Rental price per event</Label>
            <Input
              id="rental-price-event"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={value.rentalPricePerEvent}
              onChange={(event) => set('rentalPricePerEvent', event.target.value)}
            />
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="rental-setup-minutes">Setup minutes</Label>
          <Input
            id="rental-setup-minutes"
            type="number"
            step="1"
            value={value.setupMinutes}
            onChange={(event) => set('setupMinutes', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rental-max-days">Max rental days</Label>
          <Input
            id="rental-max-days"
            type="number"
            step="1"
            value={value.maxRentalDays}
            onChange={(event) => set('maxRentalDays', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rental-deposit-amount">Deposit amount</Label>
          <Input
            id="rental-deposit-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={value.depositAmount}
            onChange={(event) => set('depositAmount', event.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="rental-requires-delivery">Requires delivery</Label>
          <Switch
            id="rental-requires-delivery"
            checked={value.requiresDelivery}
            onCheckedChange={(next) => set('requiresDelivery', next)}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="rental-requires-staff">Requires staff</Label>
          <Switch
            id="rental-requires-staff"
            checked={value.requiresStaff}
            onCheckedChange={(next) => set('requiresStaff', next)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rental-member-price">Member price</Label>
          <Input
            id="rental-member-price"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={value.memberPrice}
            onChange={(event) => set('memberPrice', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rental-compare-price">Compare at price</Label>
          <Input
            id="rental-compare-price"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={value.compareAtPrice}
            onChange={(event) => set('compareAtPrice', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rental-cost-price">Cost price</Label>
          <Input
            id="rental-cost-price"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={value.costPrice}
            onChange={(event) => set('costPrice', event.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="rental-taxable">Taxable</Label>
          <Switch
            id="rental-taxable"
            checked={value.taxable}
            onCheckedChange={(next) => set('taxable', next)}
          />
        </div>
        <div className={cn('space-y-2', !value.taxable && 'opacity-50')}>
          <Label htmlFor="rental-tax-rate">Tax rate (%)</Label>
          <Input
            id="rental-tax-rate"
            type="number"
            inputMode="decimal"
            step="0.01"
            disabled={!value.taxable}
            value={value.taxRate}
            onChange={(event) => set('taxRate', event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold text-foreground">Inventory</p>
        <div className="flex items-center justify-between">
          <Label htmlFor="rental-track">Track inventory</Label>
          <Switch
            id="rental-track"
            checked={value.trackInventory}
            onCheckedChange={(next) => set('trackInventory', next)}
          />
        </div>
        <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-3', !value.trackInventory && 'opacity-50')}>
          <div className="space-y-2">
            <Label htmlFor="rental-stock">Stock count</Label>
            <Input
              id="rental-stock"
              type="number"
              step="1"
              disabled={!value.trackInventory}
              value={value.stockCount}
              onChange={(event) => set('stockCount', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rental-low-stock">Low stock threshold</Label>
            <Input
              id="rental-low-stock"
              type="number"
              step="1"
              disabled={!value.trackInventory}
              value={value.lowStockThreshold}
              onChange={(event) => set('lowStockThreshold', event.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label htmlFor="rental-backorders">Allow backorders</Label>
            <Switch
              id="rental-backorders"
              checked={value.allowBackorders}
              disabled={!value.trackInventory}
              onCheckedChange={(next) => set('allowBackorders', next)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="rental-online">Available online</Label>
          <Switch
            id="rental-online"
            checked={value.availableOnline}
            onCheckedChange={(next) => set('availableOnline', next)}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="rental-pos">Available POS</Label>
          <Switch
            id="rental-pos"
            checked={value.availablePOS}
            onCheckedChange={(next) => set('availablePOS', next)}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="rental-active">Active</Label>
          <Switch
            id="rental-active"
            checked={value.isActive}
            onCheckedChange={(next) => set('isActive', next)}
          />
        </div>
      </div>
    </div>
  )
}
