/** Product form — shared create/edit form for inventory products. */
'use client'

import { useCallback, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Product, ProductCategory } from '@/lib/types'

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
}

export interface ProductFormProps {
  readonly value: ProductDraft
  readonly onChange: (next: ProductDraft) => void
  readonly categories: ProductCategory[]
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
  }
}

export function draftToProductPatch(draft: ProductDraft): Partial<Product> {
  const price = toNumberOrEmpty(draft.price)
  const memberPrice = toNumberOrEmpty(draft.memberPrice)
  const compareAtPrice = toNumberOrEmpty(draft.compareAtPrice)
  const costPrice = toNumberOrEmpty(draft.costPrice)
  const taxRate = toNumberOrEmpty(draft.taxRate)
  const stockCount = Number.parseInt(draft.stockCount || '0', 10)
  const lowStockThreshold = Number.parseInt(draft.lowStockThreshold || '0', 10)

  return {
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
  }
}

export function ProductForm({
  value,
  onChange,
  categories,
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="prod-category">Category</Label>
          <Select value={value.categoryId} onValueChange={(v) => set('categoryId', v)} disabled={disabled}>
            <SelectTrigger id="prod-category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {orderedCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
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
    </div>
  )
}

