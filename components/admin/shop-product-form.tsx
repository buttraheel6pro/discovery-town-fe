/** Shop product admin form — aligned with gifts/rentals card layout + variant attribute groups. */
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  generateShopVariants,
  shopAttributeTemplateForSubCategoryId,
} from '@/lib/shop-utils'
import type { AttributeGroup, ProductCategory, ShopProductVariant } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface ShopProductDraft {
  name: string
  sku: string
  description: string
  categoryId: string
  imageUrl: string
  price: string
  memberPrice: string
  compareAtPrice: string
  costPrice: string
  stockCount: string
  lowStockThreshold: string
  trackInventory: boolean
  allowBackorders: boolean
  taxable: boolean
  taxRate: string
  targetGender: 'men' | 'women' | 'unisex'
  /** Maps to `availableOnline` on save — customer visibility. */
  isActive: boolean
  shopAttributeGroups: AttributeGroup[]
  shopVariants: ShopProductVariant[]
}

export interface ShopProductFormProps {
  readonly value: ShopProductDraft
  readonly onChange: (next: ShopProductDraft) => void
  readonly shopCategoryName: string
  readonly subCategories: ProductCategory[]
  readonly attributeGroupsLibrary: AttributeGroup[]
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })
}

export function ShopProductForm({
  value,
  onChange,
  shopCategoryName,
  subCategories,
  attributeGroupsLibrary,
}: Readonly<ShopProductFormProps>) {
  const [uploading, setUploading] = useState(false)
  const [showAttributeGroups, setShowAttributeGroups] = useState(false)
  const [singleModalOpen, setSingleModalOpen] = useState(false)
  const [multiModalOpen, setMultiModalOpen] = useState(false)
  const [singleExistingGroupId, setSingleExistingGroupId] = useState('')
  const [multiExistingGroupId, setMultiExistingGroupId] = useState('')
  const [variantGenerateModalOpen, setVariantGenerateModalOpen] = useState(false)
  const [variantGenerationGroupIds, setVariantGenerationGroupIds] = useState<string[]>([])
  const [variantGenerationOptionIdsByGroupId, setVariantGenerationOptionIdsByGroupId] = useState<
    Record<string, string[]>
  >({})
  const [singlePendingAddGroupIds, setSinglePendingAddGroupIds] = useState<string[]>([])
  const [singlePendingRemoveGroupIds, setSinglePendingRemoveGroupIds] = useState<string[]>([])
  const [multiPendingAddGroupIds, setMultiPendingAddGroupIds] = useState<string[]>([])
  const [multiPendingRemoveGroupIds, setMultiPendingRemoveGroupIds] = useState<string[]>([])
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null)
  const [variantDraft, setVariantDraft] = useState<ShopProductVariant | null>(null)
  const [variantUploading, setVariantUploading] = useState(false)

  const set = useCallback(
    <K extends keyof ShopProductDraft>(key: K, next: ShopProductDraft[K]) => {
      onChange({ ...value, [key]: next })
    },
    [onChange, value],
  )

  useEffect(() => {
    if (value.shopAttributeGroups.length === 0) return
    setShowAttributeGroups(true)
  }, [value.shopAttributeGroups.length])

  useEffect(() => {
    if (value.targetGender === 'unisex') return
    const hasGenderGroup = value.shopAttributeGroups.some(
      (group) => group.name.trim().toLowerCase() === 'gender',
    )
    if (!hasGenderGroup) return
    onChange({
      ...value,
      shopAttributeGroups: value.shopAttributeGroups.filter(
        (group) => group.name.trim().toLowerCase() !== 'gender',
      ),
      shopVariants: [],
    })
  }, [onChange, value])

  const onPickImageFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return
      setUploading(true)
      try {
        const dataUrl = await fileToDataUrl(file)
        set('imageUrl', dataUrl)
      } finally {
        setUploading(false)
      }
    },
    [set],
  )

  const singleGroups = useMemo(
    () => value.shopAttributeGroups.filter((group) => group.selectionType === 'single'),
    [value.shopAttributeGroups],
  )
  const multiGroups = useMemo(
    () => value.shopAttributeGroups.filter((group) => group.selectionType === 'multiple'),
    [value.shopAttributeGroups],
  )
  const selectedSingleGroupIds = useMemo(
    () =>
      singleGroups
        .filter((group) => group.options.length > 0)
        .map((group) => group.id),
    [singleGroups],
  )
  const selectedMultiGroupIds = useMemo(
    () =>
      multiGroups
        .filter((group) => group.options.length > 0)
        .map((group) => group.id),
    [multiGroups],
  )
  const librarySingleGroups = useMemo(
    () => attributeGroupsLibrary.filter((group) => group.selectionType === 'single'),
    [attributeGroupsLibrary],
  )
  const libraryMultiGroups = useMemo(
    () => attributeGroupsLibrary.filter((group) => group.selectionType === 'multiple'),
    [attributeGroupsLibrary],
  )
  const selectableSingleGroups = useMemo(() => {
    const map = new Map<string, AttributeGroup>()
    for (const group of librarySingleGroups) {
      map.set(group.id, group)
    }
    for (const group of singleGroups) {
      if (!map.has(group.id)) {
        map.set(group.id, group)
      }
    }
    return [...map.values()]
  }, [librarySingleGroups, singleGroups])
  const selectableMultiGroups = useMemo(() => {
    const map = new Map<string, AttributeGroup>()
    for (const group of libraryMultiGroups) {
      map.set(group.id, group)
    }
    for (const group of multiGroups) {
      if (!map.has(group.id)) {
        map.set(group.id, group)
      }
    }
    return [...map.values()]
  }, [libraryMultiGroups, multiGroups])
  const availableSingleGroups = useMemo(
    () => selectableSingleGroups.filter((group) => !selectedSingleGroupIds.includes(group.id)),
    [selectableSingleGroups, selectedSingleGroupIds],
  )
  const availableMultiGroups = useMemo(
    () => selectableMultiGroups.filter((group) => !selectedMultiGroupIds.includes(group.id)),
    [selectableMultiGroups, selectedMultiGroupIds],
  )
  const appliedSingleGroups = useMemo(
    () => selectableSingleGroups.filter((group) => selectedSingleGroupIds.includes(group.id)),
    [selectableSingleGroups, selectedSingleGroupIds],
  )
  const appliedMultiGroups = useMemo(
    () => selectableMultiGroups.filter((group) => selectedMultiGroupIds.includes(group.id)),
    [selectableMultiGroups, selectedMultiGroupIds],
  )
  const singleAvailableSelectableGroups = useMemo(
    () => availableSingleGroups.filter((group) => !singlePendingAddGroupIds.includes(group.id)),
    [availableSingleGroups, singlePendingAddGroupIds],
  )
  const multiAvailableSelectableGroups = useMemo(
    () => availableMultiGroups.filter((group) => !multiPendingAddGroupIds.includes(group.id)),
    [availableMultiGroups, multiPendingAddGroupIds],
  )
  const selectedAvailableSingleGroup = useMemo(
    () => availableSingleGroups.find((group) => group.id === singleExistingGroupId) ?? null,
    [availableSingleGroups, singleExistingGroupId],
  )
  const selectedAvailableMultiGroup = useMemo(
    () => availableMultiGroups.find((group) => group.id === multiExistingGroupId) ?? null,
    [availableMultiGroups, multiExistingGroupId],
  )
  const variantDimensionGroups = useMemo(
    () =>
      value.shopAttributeGroups.filter(
        (group) => group.selectionType === 'single' && group.isVariantDimension === true,
      ),
    [value.shopAttributeGroups],
  )

  function variantCombinationLabel(variant: ShopProductVariant): string {
    const rows = variantDimensionGroups
      .map((group) => {
        const optionId = variant.optionValueIdsByGroupId[group.id]
        if (!optionId) return null
        const optionLabel =
          group.options.find((option) => option.id === optionId)?.label ??
          variant.optionLabelsByGroupId[group.id]
        if (!optionLabel) return null
        return `${group.name}: ${optionLabel}`
      })
      .filter((row): row is string => Boolean(row))

    if (rows.length > 0) return rows.join(' · ')
    const fallback = Object.values(variant.optionLabelsByGroupId).filter(Boolean)
    return fallback.join(' / ')
  }

  function regenerateVariants() {
    const selectedGroupIds = new Set(variantGenerationGroupIds)
    const nextGroups = value.shopAttributeGroups.map((group) => {
      if (group.selectionType !== 'single') {
        return { ...group, isVariantDimension: false }
      }
      return { ...group, isVariantDimension: selectedGroupIds.has(group.id) }
    })
    const scopedVariantGroups = nextGroups
      .filter((group) => group.selectionType === 'single' && selectedGroupIds.has(group.id))
      .map((group) => ({
        ...group,
        options: group.options.filter((option) =>
          (variantGenerationOptionIdsByGroupId[group.id] ?? []).includes(option.id),
        ),
      }))
      .filter((group) => group.options.length > 0)
    const nextVariants = generateShopVariants(
      value.name,
      value.sku,
      scopedVariantGroups,
      value.shopVariants,
      {
        stockCount: Number.parseInt(value.stockCount, 10),
        lowStockThreshold: Number.parseInt(value.lowStockThreshold, 10),
      },
    )
    onChange({
      ...value,
      shopAttributeGroups: nextGroups,
      shopVariants: nextVariants,
    })
    setVariantGenerateModalOpen(false)
  }

  function openVariantGenerateModal() {
    const singleSelectionGroups = value.shopAttributeGroups.filter(
      (group) => group.selectionType === 'single' && group.options.length > 0,
    )
    const preselected = singleSelectionGroups
      .filter((group) => group.isVariantDimension)
      .map((group) => group.id)
    const selectedGroupIds =
      preselected.length > 0
        ? preselected
        : singleSelectionGroups.map((group) => group.id)
    const selectedGroupIdSet = new Set(selectedGroupIds)
    const existingVariantOptionIdsByGroupId: Record<string, string[]> = Object.fromEntries(
      selectedGroupIds.map((groupId) => {
        const validOptionIds = new Set(
          (singleSelectionGroups.find((group) => group.id === groupId)?.options ?? []).map(
            (option) => option.id,
          ),
        )
        const fromVariants = [
          ...new Set(
            value.shopVariants
              .map((variant) => variant.optionValueIdsByGroupId[groupId])
              .filter(
                (optionId): optionId is string =>
                  Boolean(optionId) && validOptionIds.has(optionId),
              ),
          ),
        ]
        return [groupId, fromVariants]
      }),
    )
    setVariantGenerationGroupIds(selectedGroupIds)
    setVariantGenerationOptionIdsByGroupId(
      Object.fromEntries(
        singleSelectionGroups.map((group) => [
          group.id,
          selectedGroupIdSet.has(group.id)
            ? existingVariantOptionIdsByGroupId[group.id]?.length
              ? existingVariantOptionIdsByGroupId[group.id]
              : group.options.map((option) => option.id)
            : [],
        ]),
      ),
    )
    setVariantGenerateModalOpen(true)
  }

  const editingVariant =
    editingVariantIndex != null && editingVariantIndex >= 0
      ? value.shopVariants[editingVariantIndex] ?? null
      : null
  const activeVariant = variantDraft ?? editingVariant

  const basePriceNumber = Number.parseFloat(value.price)

  const editingVariantDimensions = activeVariant?.dimensionsCm ?? {}

  const onPickVariantImageFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return
      setVariantUploading(true)
      try {
        const dataUrl = await fileToDataUrl(file)
        setVariantDraft((prev) => (prev ? { ...prev, imageUrl: dataUrl } : prev))
      } finally {
        setVariantUploading(false)
      }
    },
    [],
  )

  function openVariantModal(index: number) {
    const variant = value.shopVariants[index]
    if (!variant) return
    setEditingVariantIndex(index)
    setVariantDraft({
      ...variant,
      optionValueIdsByGroupId: { ...variant.optionValueIdsByGroupId },
      optionLabelsByGroupId: { ...variant.optionLabelsByGroupId },
      dimensionsCm: variant.dimensionsCm
        ? {
            length: variant.dimensionsCm.length,
            width: variant.dimensionsCm.width,
            height: variant.dimensionsCm.height,
          }
        : undefined,
    })
  }

  function closeVariantModal() {
    setEditingVariantIndex(null)
    setVariantDraft(null)
  }

  function saveVariantModal() {
    if (editingVariantIndex == null || !variantDraft) return
    set(
      'shopVariants',
      value.shopVariants.map((variant, index) => (index === editingVariantIndex ? variantDraft : variant)),
    )
    closeVariantModal()
  }

  function applyTargetGenderToGroups(groups: AttributeGroup[]): AttributeGroup[] {
    if (value.targetGender === 'unisex') return groups
    return groups.filter((group) => group.name.trim().toLowerCase() !== 'gender')
  }

  function saveSingleExistingDraft() {
    const addIds = singlePendingAddGroupIds.filter((id) => !selectedSingleGroupIds.includes(id))
    const removeIds = singlePendingRemoveGroupIds.filter((id) => selectedSingleGroupIds.includes(id))
    const groupById = new Map(selectableSingleGroups.map((group) => [group.id, group]))
    const keptGroups = value.shopAttributeGroups.filter(
      (group) => !(group.selectionType === 'single' && removeIds.includes(group.id)),
    )
    const addedGroups = addIds
      .map((id) => groupById.get(id))
      .filter((group): group is AttributeGroup => Boolean(group))
      .map((group) => ({
        ...group,
        options: group.options.map((option) => ({ ...option })),
      }))
    const nextGroups = applyTargetGenderToGroups([...keptGroups, ...addedGroups])
    onChange({
      ...value,
      shopAttributeGroups: nextGroups,
      shopVariants: removeIds.length > 0 ? [] : value.shopVariants,
    })
    setSingleModalOpen(false)
    setSinglePendingAddGroupIds([])
    setSinglePendingRemoveGroupIds([])
  }

  function saveMultiExistingDraft() {
    const addIds = multiPendingAddGroupIds.filter((id) => !selectedMultiGroupIds.includes(id))
    const removeIds = multiPendingRemoveGroupIds.filter((id) => selectedMultiGroupIds.includes(id))
    const groupById = new Map(selectableMultiGroups.map((group) => [group.id, group]))
    const keptGroups = value.shopAttributeGroups.filter(
      (group) => !(group.selectionType === 'multiple' && removeIds.includes(group.id)),
    )
    const addedGroups = addIds
      .map((id) => groupById.get(id))
      .filter((group): group is AttributeGroup => Boolean(group))
      .map((group) => ({
        ...group,
        options: group.options.map((option) => ({ ...option })),
      }))
    const nextGroups = applyTargetGenderToGroups([...keptGroups, ...addedGroups])
    onChange({
      ...value,
      shopAttributeGroups: nextGroups,
      shopVariants: value.shopVariants,
    })
    setMultiModalOpen(false)
    setMultiPendingAddGroupIds([])
    setMultiPendingRemoveGroupIds([])
  }

  const subCategoryLabel = useMemo(() => {
    return subCategories.find((c) => c.id === value.categoryId)?.name ?? ''
  }, [subCategories, value.categoryId])

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="shop-name">Name</Label>
          <Input
            id="shop-name"
            value={value.name}
            onChange={(event) => set('name', event.target.value)}
            placeholder="Product name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shop-sku">SKU</Label>
          <Input
            id="shop-sku"
            value={value.sku}
            onChange={(event) => set('sku', event.target.value)}
            placeholder="SKU"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="shop-description">Description</Label>
          <Textarea
            id="shop-description"
            value={value.description}
            onChange={(event) => set('description', event.target.value)}
            placeholder="Describe this product"
            rows={4}
          />
        </div>

        <div className="grid w-full gap-4 md:col-span-2 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Category</Label>
            <Input value={shopCategoryName} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shop-sub-category">Sub-category</Label>
            <Select value={value.categoryId} onValueChange={(next) => set('categoryId', next)}>
              <SelectTrigger id="shop-sub-category" className="w-full min-w-0">
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
            <Label htmlFor="shop-target-gender">Target audience</Label>
            <Select
              value={value.targetGender}
              onValueChange={(next: 'men' | 'women' | 'unisex') => set('targetGender', next)}
            >
              <SelectTrigger id="shop-target-gender" className="w-full min-w-0">
                <SelectValue placeholder="Select target audience" className="truncate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="women">Women</SelectItem>
                <SelectItem value="men">Men</SelectItem>
                <SelectItem value="unisex">Unisex</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid w-full gap-4 md:col-span-2 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="shop-base-price">Base price</Label>
            <Input
              id="shop-base-price"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={value.price}
              onChange={(event) => set('price', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shop-stock">Stock count</Label>
            <Input
              id="shop-stock"
              type="number"
              step="1"
              min="0"
              value={value.stockCount}
              onChange={(event) => set('stockCount', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shop-image">Image URL</Label>
            <div className="flex items-center gap-2">
              <Input
                id="shop-image"
                className="flex-1"
                value={value.imageUrl}
                onChange={(event) => set('imageUrl', event.target.value)}
                placeholder="https://... or upload"
              />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="shop-image-file"
                onChange={(event) => void onPickImageFile(event.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => document.getElementById('shop-image-file')?.click()}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="shop-member-price">Member price</Label>
          <Input
            id="shop-member-price"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={value.memberPrice}
            onChange={(event) => set('memberPrice', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shop-compare-price">Compare at price</Label>
          <Input
            id="shop-compare-price"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={value.compareAtPrice}
            onChange={(event) => set('compareAtPrice', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shop-cost-price">Cost price</Label>
          <Input
            id="shop-cost-price"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={value.costPrice}
            onChange={(event) => set('costPrice', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shop-low-stock">Low stock threshold</Label>
          <Input
            id="shop-low-stock"
            type="number"
            step="1"
            min="0"
            value={value.lowStockThreshold}
            onChange={(event) => set('lowStockThreshold', event.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border border-border p-3 md:col-span-2">
          <div>
            <p className="text-sm font-medium">Track inventory</p>
            <p className="text-xs text-muted-foreground">Decrement stock on orders when enabled.</p>
          </div>
          <Switch
            checked={value.trackInventory}
            onCheckedChange={(next) => set('trackInventory', next)}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3 md:col-span-2">
          <span className="text-sm font-medium">Allow backorders</span>
          <Switch
            checked={value.allowBackorders}
            onCheckedChange={(next) => set('allowBackorders', next)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <span className="text-sm font-medium">Taxable</span>
          <Switch checked={value.taxable} onCheckedChange={(next) => set('taxable', next)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shop-tax-rate">Tax rate (%)</Label>
          <Input
            id="shop-tax-rate"
            type="number"
            step="0.01"
            value={value.taxRate}
            onChange={(event) => set('taxRate', event.target.value)}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3 md:col-span-2">
          <div>
            <p className="text-sm font-medium">Is active</p>
            <p className="text-xs text-muted-foreground">Show on the customer storefront when on.</p>
          </div>
          <Switch checked={value.isActive} onCheckedChange={(next) => set('isActive', next)} />
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground">Attribute groups</p>
            <p className="text-xs text-muted-foreground">
              Variants such as size and colour. Customers pick one option per group (single) or
              several (multi).
            </p>
          </div>
          <Switch checked={showAttributeGroups} onCheckedChange={setShowAttributeGroups} />
        </div>

        {showAttributeGroups ? (
          <div className="space-y-3">
            {/* <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!value.categoryId}
                onClick={applyTemplateForSubCategory}
              >
                Load suggested groups
              </Button>
            </div> */}
            {/* <Link href="/admin/cafe/attributes" className="inline-flex text-sm font-medium text-primary underline underline-offset-4">+ Create / manage Attribute Groups →</Link> */}
            {subCategoryLabel ? (
              <p className="text-xs text-muted-foreground">
                Sub-category: <span className="font-medium text-foreground">{subCategoryLabel}</span>
              </p>
            ) : null}

            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-medium text-foreground">Single-select attributes</p>
                  <p className="text-xs text-muted-foreground">
                    Groups are shared from{' '}
                    <span className="font-medium text-foreground">Cafe & Food → Attributes</span>. Attach
                    Size, Colour, or other dimensions for variants.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  aria-label="Open single-select attribute picker"
                  onClick={() => {
                    setSingleExistingGroupId('')
                    setSinglePendingAddGroupIds([])
                    setSinglePendingRemoveGroupIds([])
                    setSingleModalOpen(true)
                  }}
                >
                  Manage groups
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {singleGroups.length === 0 ? (
                  <span className="text-xs text-muted-foreground">None attached</span>
                ) : (
                  <>
                    {singleGroups.slice(0, 3).map((group) => (
                      <Badge key={group.id} variant="secondary" className="max-w-[10rem] truncate font-normal">
                        {group.name.trim() || 'Unnamed'}
                      </Badge>
                    ))}
                    {singleGroups.length > 3 ? (
                      <Badge variant="outline" className="font-normal">
                        +{singleGroups.length - 3}
                      </Badge>
                    ) : null}
                  </>
                )}
              </div>
            </div>

            {/* <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-foreground">Multiple select attributes</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Search existing values or type a new value and press Enter.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => {
                  setMultiExistingGroupId(availableMultiGroups[0]?.id ?? '')
                  setMultiPendingAddGroupIds([])
                  setMultiPendingRemoveGroupIds([])
                  setShowMultiNewGroupForm(false)
                  setMultiModalOpen(true)
                }}
              >
                <span className="truncate text-left">
                  {multiGroups.length > 0 ? `${multiGroups.length} group(s) added` : 'Select multiple attributes'}
                </span>
                <span className="text-xs text-muted-foreground">Open</span>
              </Button>
            </div> */}

            <div className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Variant inventory</p>
                  <p className="text-xs text-muted-foreground">
                    Variant groups: {variantDimensionGroups.length}. Variants: {value.shopVariants.length}.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={openVariantGenerateModal}>
                  Generate variants
                </Button>
              </div>
              {value.shopVariants.length > 0 ? (
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                  {value.shopVariants.map((variant, index) => (
                    <div
                      key={variant.id}
                      className="rounded-md border border-border p-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted/30">
                        {variant.imageUrl ? (
                          <img
                            src={variant.imageUrl}
                            alt={variantCombinationLabel(variant)}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                        </div>
                        <p className="line-clamp-2 flex-1 text-sm font-medium text-foreground">
                          {variantCombinationLabel(variant)}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => openVariantModal(index)}
                          aria-label="Edit variant"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Mark one or more single-select groups as variant dimensions, then generate variants.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <Dialog
        open={editingVariantIndex != null}
        onOpenChange={(open) => {
          if (!open) closeVariantModal()
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Variant details</DialogTitle>
          </DialogHeader>
          {activeVariant && editingVariantIndex != null ? (
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground">
                {variantCombinationLabel(activeVariant)}
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Regular price</Label>
                  <Input
                    value={
                      Number.isFinite(basePriceNumber) ? String(basePriceNumber) : value.price
                    }
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sale price</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={
                      activeVariant.priceOverride != null
                        ? String(activeVariant.priceOverride)
                        : ''
                    }
                    onChange={(event) =>
                      setVariantDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              priceOverride:
                                event.target.value.trim().length > 0
                                  ? Math.max(0, Number.parseFloat(event.target.value) || 0)
                                  : undefined,
                            }
                          : prev,
                      )
                    }
                    placeholder="Sale price override"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock quantity</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={String(activeVariant.stockCount)}
                    onChange={(event) =>
                      setVariantDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              stockCount: Math.max(0, Number.parseInt(event.target.value, 10) || 0),
                            }
                          : prev,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Low stock threshold</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={String(activeVariant.lowStockThreshold)}
                    onChange={(event) =>
                      setVariantDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              lowStockThreshold: Math.max(
                                0,
                                Number.parseInt(event.target.value, 10) || 0,
                              ),
                            }
                          : prev,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Allow backorders?</Label>
                  <Select
                    value={activeVariant.allowBackorders ? 'allow' : 'disallow'}
                    onValueChange={(next) =>
                      setVariantDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              allowBackorders: next === 'allow',
                            }
                          : prev,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disallow">Do not allow</SelectItem>
                      <SelectItem value="allow">Allow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Variant SKU</Label>
                  <Input
                    value={activeVariant.sku}
                    onChange={(event) =>
                      setVariantDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              sku: event.target.value,
                            }
                          : prev,
                      )
                    }
                    placeholder="Variant SKU"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={activeVariant.weightKg != null ? String(activeVariant.weightKg) : ''}
                    onChange={(event) =>
                      setVariantDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              weightKg:
                                event.target.value.trim().length > 0
                                  ? Math.max(0, Number.parseFloat(event.target.value) || 0)
                                  : undefined,
                            }
                          : prev,
                      )
                    }
                    placeholder="Weight"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm font-medium">Enabled</span>
                  <Switch
                    checked={activeVariant.isActive}
                    onCheckedChange={(next) =>
                      setVariantDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              isActive: next,
                            }
                          : prev,
                      )
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Dimensions (L x W x H) cm</Label>
                <div className="grid gap-2 md:grid-cols-3">
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={
                      editingVariantDimensions.length != null
                        ? String(editingVariantDimensions.length)
                        : ''
                    }
                    onChange={(event) =>
                      setVariantDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              dimensionsCm: {
                                ...editingVariantDimensions,
                                length:
                                  event.target.value.trim().length > 0
                                    ? Math.max(0, Number.parseFloat(event.target.value) || 0)
                                    : undefined,
                              },
                            }
                          : prev,
                      )
                    }
                    placeholder="Length"
                  />
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={
                      editingVariantDimensions.width != null
                        ? String(editingVariantDimensions.width)
                        : ''
                    }
                    onChange={(event) =>
                      setVariantDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              dimensionsCm: {
                                ...editingVariantDimensions,
                                width:
                                  event.target.value.trim().length > 0
                                    ? Math.max(0, Number.parseFloat(event.target.value) || 0)
                                    : undefined,
                              },
                            }
                          : prev,
                      )
                    }
                    placeholder="Width"
                  />
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={
                      editingVariantDimensions.height != null
                        ? String(editingVariantDimensions.height)
                        : ''
                    }
                    onChange={(event) =>
                      setVariantDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              dimensionsCm: {
                                ...editingVariantDimensions,
                                height:
                                  event.target.value.trim().length > 0
                                    ? Math.max(0, Number.parseFloat(event.target.value) || 0)
                                    : undefined,
                              },
                            }
                          : prev,
                      )
                    }
                    placeholder="Height"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={activeVariant.imageUrl ?? ''}
                    onChange={(event) =>
                      setVariantDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              imageUrl:
                                event.target.value.trim().length > 0
                                  ? event.target.value
                                  : undefined,
                            }
                          : prev,
                      )
                    }
                    placeholder="https://... or upload"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="shop-variant-image-file"
                    onChange={(event) =>
                      void onPickVariantImageFile(event.target.files?.[0] ?? null)
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={variantUploading}
                    onClick={() => document.getElementById('shop-variant-image-file')?.click()}
                  >
                    {variantUploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={activeVariant.description ?? ''}
                  onChange={(event) =>
                    setVariantDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            description:
                              event.target.value.trim().length > 0
                                ? event.target.value
                                : undefined,
                          }
                        : prev,
                    )
                  }
                  placeholder="Optional internal description for this variant"
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeVariantModal}
            >
              Close
            </Button>
            <Button type="button" onClick={saveVariantModal}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={singleModalOpen}
        onOpenChange={(open) => {
          setSingleModalOpen(open)
          if (!open) {
            setSingleExistingGroupId('')
            setSinglePendingAddGroupIds([])
            setSinglePendingRemoveGroupIds([])
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Single-select attributes</DialogTitle>
            <DialogDescription>
              Choose a library group from the list, review its options, tap{' '}
              <span className="font-medium text-foreground">Add</span>, then{' '}
              <span className="font-medium text-foreground">Save</span> to attach it to this product.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {appliedSingleGroups.length > 0 || singleAvailableSelectableGroups.length > 0 ? (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="space-y-2">
                  {appliedSingleGroups.length > 0 ? (
                    <div className="space-y-2">
                      <Label>Already applied</Label>
                      <div className="space-y-2">
                        {appliedSingleGroups.map((group) => (
                          <div
                            key={group.id}
                            className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                          >
                            <span className="text-sm">{group.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setSinglePendingRemoveGroupIds((prev) =>
                                  prev.includes(group.id)
                                    ? prev.filter((id) => id !== group.id)
                                    : [...prev, group.id],
                                )
                              }
                            >
                              {singlePendingRemoveGroupIds.includes(group.id)
                                ? 'Undo remove'
                                : 'Remove'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <Label>Select existing group</Label>
                  {singleAvailableSelectableGroups.length > 0 ? (
                    <div className="space-y-3">
                      <Select value={singleExistingGroupId} onValueChange={setSingleExistingGroupId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select group" />
                        </SelectTrigger>
                        <SelectContent>
                          {singleAvailableSelectableGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedAvailableSingleGroup ? (
                        <div className="space-y-2">
                          <Label>Group options</Label>
                          <div className="space-y-2">
                            {selectedAvailableSingleGroup.options.map((option) => (
                              <div
                                key={option.id}
                                className="rounded-md border border-border px-3 py-2 text-sm"
                              >
                                {option.label}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 w-full font-medium shadow-none"
                        disabled={!singleExistingGroupId}
                        onClick={() => {
                          if (!singleExistingGroupId) return
                          setSinglePendingAddGroupIds((prev) =>
                            prev.includes(singleExistingGroupId) ? prev : [...prev, singleExistingGroupId],
                          )
                          setSingleExistingGroupId('')
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No more groups available to add.</p>
                  )}
                </div>
                {singlePendingAddGroupIds.length > 0 ? (
                  <div className="space-y-2">
                    <Label>Groups to add</Label>
                    <div className="space-y-2">
                      {singlePendingAddGroupIds
                        .map((groupId) => availableSingleGroups.find((group) => group.id === groupId))
                        .filter((group): group is AttributeGroup => Boolean(group))
                        .map((group) => (
                          <div
                            key={group.id}
                            className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                          >
                            <span className="text-sm">{group.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setSinglePendingAddGroupIds((prev) =>
                                  prev.filter((groupId) => groupId !== group.id),
                                )
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No single-select groups in the shared library. Create them under Cafe & Food →
                Attributes.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSingleModalOpen(false)}>
              Close
            </Button>
            <Button type="button" onClick={saveSingleExistingDraft}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* <Dialog
        open={multiModalOpen}
        onOpenChange={(open) => {
          setMultiModalOpen(open)
          if (!open) {
            setMultiExistingGroupId('')
            setMultiPendingAddGroupIds([])
            setMultiPendingRemoveGroupIds([])
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Multiple select attributes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!showMultiNewGroupForm && selectableMultiGroups.length > 0 ? (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="space-y-2">
                  {appliedMultiGroups.length > 0 ? (
                    <div className="space-y-2">
                      <Label>Already applied</Label>
                      <div className="space-y-2">
                        {appliedMultiGroups.map((group) => (
                          <div
                            key={group.id}
                            className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                          >
                            <span className="text-sm">{group.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setMultiPendingRemoveGroupIds((prev) =>
                                  prev.includes(group.id)
                                    ? prev.filter((id) => id !== group.id)
                                    : [...prev, group.id],
                                )
                              }
                            >
                              {multiPendingRemoveGroupIds.includes(group.id)
                                ? 'Undo remove'
                                : 'Remove'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <Label>Select existing group</Label>
                  {multiAvailableSelectableGroups.length > 0 ? (
                    <div className="space-y-3">
                      <Select value={multiExistingGroupId} onValueChange={setMultiExistingGroupId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select group" />
                        </SelectTrigger>
                        <SelectContent>
                          {multiAvailableSelectableGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedAvailableMultiGroup ? (
                        <div className="space-y-2">
                          <Label>Group options</Label>
                          <div className="space-y-2">
                            {selectedAvailableMultiGroup.options.map((option) => (
                              <div
                                key={option.id}
                                className="rounded-md border border-border px-3 py-2 text-sm"
                              >
                                {option.label}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 w-full font-medium shadow-none"
                        disabled={!multiExistingGroupId}
                        onClick={() => {
                          if (!multiExistingGroupId) return
                          setMultiPendingAddGroupIds((prev) =>
                            prev.includes(multiExistingGroupId) ? prev : [...prev, multiExistingGroupId],
                          )
                          const nextOptions = multiAvailableSelectableGroups.filter(
                            (group) => group.id !== multiExistingGroupId,
                          )
                          setMultiExistingGroupId(nextOptions[0]?.id ?? '')
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No more groups available to add.</p>
                  )}
                </div>
                {multiPendingAddGroupIds.length > 0 ? (
                  <div className="space-y-2">
                    <Label>Groups to add</Label>
                    <div className="space-y-2">
                      {multiPendingAddGroupIds
                        .map((groupId) => availableMultiGroups.find((group) => group.id === groupId))
                        .filter((group): group is AttributeGroup => Boolean(group))
                        .map((group) => (
                          <div
                            key={group.id}
                            className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                          >
                            <span className="text-sm">{group.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setMultiPendingAddGroupIds((prev) =>
                                  prev.filter((groupId) => groupId !== group.id),
                                )
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {!showMultiNewGroupForm ? (
              <div className="space-y-2 rounded-lg border border-border p-3">
                <p className="text-sm font-semibold text-foreground">Mode</p>
                <Button type="button" variant="outline" className="w-full" onClick={() => setShowMultiNewGroupForm(true)}>
                  Add new group
                </Button>
              </div>
            ) : (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <p className="text-sm font-semibold text-foreground">New group</p>
                <div className="space-y-2">
                  <Label>Group name</Label>
                  <Input
                    value={multiDraftName}
                    onChange={(event) => setMultiDraftName(event.target.value)}
                    placeholder="e.g. Material"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm font-medium">Required</span>
                  <Switch checked={multiDraftRequired} onCheckedChange={setMultiDraftRequired} />
                </div>
                <div className="space-y-2">
                  <Label>Max selections</Label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={multiDraftMaxSelect}
                    onChange={(event) => setMultiDraftMaxSelect(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Options</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setMultiDraftOptions((prev) => [...prev, { label: '', color: '#607d8b' }])
                      }
                    >
                      Add option
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {multiDraftOptions.map((row, index) => (
                      <div key={`multi-opt-${String(index)}`} className="flex gap-2">
                        <Input
                          value={row.label}
                          onChange={(event) =>
                            setMultiDraftOptions((prev) =>
                              prev.map((cell, idx) =>
                                idx === index ? { ...cell, label: event.target.value } : cell,
                              ),
                            )
                          }
                          placeholder="Option label"
                        />
                        {isColorGroupName(multiDraftName) ? (
                          <input
                            type="color"
                            className="h-10 w-12 rounded border border-border bg-background p-1"
                            value={row.color.startsWith('#') ? row.color : '#607d8b'}
                            onChange={(event) =>
                              setMultiDraftOptions((prev) =>
                                prev.map((cell, idx) =>
                                  idx === index ? { ...cell, color: event.target.value } : cell,
                                ),
                              )
                            }
                            aria-label={`Select color for option ${index + 1}`}
                          />
                        ) : null}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={multiDraftOptions.length <= 1}
                          onClick={() =>
                            setMultiDraftOptions((prev) => prev.filter((_, idx) => idx !== index))
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMultiModalOpen(false)}>
              Close
            </Button>
            {!showMultiNewGroupForm ? (
              <Button type="button" onClick={saveMultiExistingDraft}>
                Save
              </Button>
            ) : null}
            {showMultiNewGroupForm ? (
              <Button type="button" onClick={() => saveNewDraftGroup('multiple')}>
                Save new group
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog> */}

      <Dialog open={variantGenerateModalOpen} onOpenChange={setVariantGenerateModalOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate variants</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {singleGroups.length > 0 ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
                  <p className="text-sm text-muted-foreground">
                    Select groups and options for variant generation.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setVariantGenerationGroupIds(singleGroups.map((group) => group.id))}
                    >
                      Select all groups
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setVariantGenerationGroupIds([])}
                    >
                      Clear groups
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setVariantGenerationOptionIdsByGroupId(
                          Object.fromEntries(
                            singleGroups.map((group) => [
                              group.id,
                              group.options.map((option) => option.id),
                            ]),
                          ),
                        )
                      }
                    >
                      Select all options
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setVariantGenerationOptionIdsByGroupId(
                          Object.fromEntries(singleGroups.map((group) => [group.id, []])),
                        )
                      }
                    >
                      Clear options
                    </Button>
                  </div>
                </div>

                {singleGroups.map((group) => {
                  const groupSelected = variantGenerationGroupIds.includes(group.id)
                  const selectedOptions = variantGenerationOptionIdsByGroupId[group.id] ?? []
                  const allGroupOptionsSelected =
                    group.options.length > 0 &&
                    group.options.every((option) => selectedOptions.includes(option.id))
                  return (
                    <div key={group.id} className="space-y-2 rounded-lg border border-border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={groupSelected}
                            onChange={(event) =>
                              setVariantGenerationGroupIds((prev) =>
                                event.target.checked
                                  ? [...new Set([...prev, group.id])]
                                  : prev.filter((groupId) => groupId !== group.id),
                              )
                            }
                          />
                          <span className="text-sm font-semibold text-foreground">{group.name}</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!groupSelected || allGroupOptionsSelected}
                            onClick={() =>
                              setVariantGenerationOptionIdsByGroupId((prev) => ({
                                ...prev,
                                [group.id]: group.options.map((option) => option.id),
                              }))
                            }
                          >
                            Select all
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!groupSelected || selectedOptions.length === 0}
                            onClick={() =>
                              setVariantGenerationOptionIdsByGroupId((prev) => ({
                                ...prev,
                                [group.id]: [],
                              }))
                            }
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {group.options.map((option) => (
                          <label
                            key={option.id}
                            className="flex items-center gap-2 text-sm text-foreground"
                          >
                            <input
                              type="checkbox"
                              checked={selectedOptions.includes(option.id)}
                              disabled={!groupSelected}
                              onChange={(event) =>
                                setVariantGenerationOptionIdsByGroupId((prev) => {
                                  const current = prev[group.id] ?? []
                                  const next = event.target.checked
                                    ? [...new Set([...current, option.id])]
                                    : current.filter((optionId) => optionId !== option.id)
                                  return { ...prev, [group.id]: next }
                                })
                              }
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Add single-select attribute groups first to generate variants.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setVariantGenerateModalOpen(false)}>
              Close
            </Button>
            <Button
              type="button"
              onClick={regenerateVariants}
              disabled={
                variantGenerationGroupIds.length === 0 ||
                variantGenerationGroupIds.some(
                  (groupId) => (variantGenerationOptionIdsByGroupId[groupId] ?? []).length === 0,
                )
              }
            >
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
