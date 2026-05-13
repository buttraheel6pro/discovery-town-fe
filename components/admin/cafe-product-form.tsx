/** Cafe product admin form — card sections aligned with gifts/rentals layout. */
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { cn } from '@/lib/utils'
import type { AttributeGroup, CafeProduct, ModifierGroup, RotationGroup } from '@/lib/types'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export interface CafeSubCategoryOption {
  readonly id: string
  readonly name: string
}

export interface CafeProductFormProps {
  readonly value: CafeProduct
  readonly onChange: (next: CafeProduct) => void
  readonly selectedSubCategoryId: string
  readonly subCategoryOptions: CafeSubCategoryOption[]
  readonly onSubCategoryChange: (nextCategoryId: string) => void
  readonly modifierGroups: ModifierGroup[]
  readonly attributeGroups: AttributeGroup[]
  readonly rotationGroups: RotationGroup[]
  /** When set, attribute group ids listed here show inline validation messages. */
  readonly attributeErrors?: Record<string, string>
}

export function CafeProductForm({
  value,
  onChange,
  selectedSubCategoryId,
  subCategoryOptions,
  onSubCategoryChange,
  modifierGroups,
  attributeGroups,
  rotationGroups,
  attributeErrors,
}: Readonly<CafeProductFormProps>) {
  const [uploading, setUploading] = useState(false)
  const [singleModalOpen, setSingleModalOpen] = useState(false)
  const [multiModalOpen, setMultiModalOpen] = useState(false)
  const [showAttributeGroups, setShowAttributeGroups] = useState(false)
  const [singleExistingGroupId, setSingleExistingGroupId] = useState('')
  const [multiExistingGroupId, setMultiExistingGroupId] = useState('')
  const [singlePendingAddGroupIds, setSinglePendingAddGroupIds] = useState<string[]>([])
  const [singlePendingRemoveGroupIds, setSinglePendingRemoveGroupIds] = useState<string[]>([])
  const [multiPendingAddGroupIds, setMultiPendingAddGroupIds] = useState<string[]>([])
  const [multiPendingRemoveGroupIds, setMultiPendingRemoveGroupIds] = useState<string[]>([])
  const [didAutoOpenAttributeGroups, setDidAutoOpenAttributeGroups] = useState(false)
  const [modifierModalOpen, setModifierModalOpen] = useState(false)
  const [modifierExistingGroupId, setModifierExistingGroupId] = useState('')
  const [modifierPendingAddGroupIds, setModifierPendingAddGroupIds] = useState<string[]>([])
  const [modifierPendingRemoveGroupIds, setModifierPendingRemoveGroupIds] = useState<string[]>([])

  const set = useCallback(
    <K extends keyof CafeProduct>(key: K, next: CafeProduct[K]) => {
      onChange({ ...value, [key]: next, updatedAt: new Date().toISOString() })
    },
    [onChange, value],
  )

  useEffect(() => {
    if (didAutoOpenAttributeGroups) return
    if (Object.keys(value.attributeGroups).length === 0) return
    setShowAttributeGroups(true)
    setDidAutoOpenAttributeGroups(true)
  }, [didAutoOpenAttributeGroups, value.attributeGroups])

  const attachedModifiers = useMemo(() => {
    const map = new Map(modifierGroups.map((g) => [g.id, g]))
    return value.modifierGroupIds.map((id) => map.get(id)).filter(Boolean) as ModifierGroup[]
  }, [modifierGroups, value.modifierGroupIds])

  function toggleDay(day: number) {
    const cur = value.availableDaysOfWeek ?? []
    const has = cur.includes(day)
    const next = has ? cur.filter((d) => d !== day) : [...cur, day].sort((a, b) => a - b)
    set('availableDaysOfWeek', next)
  }

  const singleGroups = useMemo(
    () => attributeGroups.filter((group) => group.selectionType === 'single'),
    [attributeGroups],
  )
  const multiGroups = useMemo(
    () => attributeGroups.filter((group) => group.selectionType === 'multiple'),
    [attributeGroups],
  )
  const selectedSingleOptions = useMemo(
    () =>
      singleGroups.flatMap((group) => {
        const ids = value.attributeGroups[group.id] ?? []
        return ids
          .map((id) => group.options.find((option) => option.id === id))
          .filter((option): option is NonNullable<typeof option> => Boolean(option))
          .map((option) => ({
            groupId: group.id,
            optionId: option.id,
            display: option.label,
          }))
      }),
    [singleGroups, value.attributeGroups],
  )
  const selectedMultiOptions = useMemo(
    () =>
      multiGroups.flatMap((group) => {
        const ids = value.attributeGroups[group.id] ?? []
        return ids
          .map((id) => group.options.find((option) => option.id === id))
          .filter((option): option is NonNullable<typeof option> => Boolean(option))
          .map((option) => ({
            groupId: group.id,
            optionId: option.id,
            display: option.label,
          }))
      }),
    [multiGroups, value.attributeGroups],
  )
  const selectedModifierGroupIds = useMemo(
    () => modifierGroups.filter((group) => value.modifierGroupIds.includes(group.id)).map((group) => group.id),
    [modifierGroups, value.modifierGroupIds],
  )
  const appliedModifierGroups = useMemo(
    () => modifierGroups.filter((group) => selectedModifierGroupIds.includes(group.id)),
    [modifierGroups, selectedModifierGroupIds],
  )
  const availableModifierGroups = useMemo(
    () => modifierGroups.filter((group) => !selectedModifierGroupIds.includes(group.id)),
    [modifierGroups, selectedModifierGroupIds],
  )
  const modifierAvailableSelectableGroups = useMemo(
    () =>
      availableModifierGroups.filter(
        (group) => !modifierPendingAddGroupIds.includes(group.id),
      ),
    [availableModifierGroups, modifierPendingAddGroupIds],
  )
  const selectedAvailableModifierGroup = useMemo(
    () => availableModifierGroups.find((group) => group.id === modifierExistingGroupId) ?? null,
    [availableModifierGroups, modifierExistingGroupId],
  )
  const selectedSingleGroupIds = useMemo(
    () =>
      singleGroups
        .filter((group) => (value.attributeGroups[group.id] ?? []).length > 0)
        .map((group) => group.id),
    [singleGroups, value.attributeGroups],
  )
  const selectedMultiGroupIds = useMemo(
    () =>
      multiGroups
        .filter((group) => (value.attributeGroups[group.id] ?? []).length > 0)
        .map((group) => group.id),
    [multiGroups, value.attributeGroups],
  )
  const availableSingleGroups = useMemo(
    () => singleGroups.filter((group) => !selectedSingleGroupIds.includes(group.id)),
    [singleGroups, selectedSingleGroupIds],
  )
  const availableMultiGroups = useMemo(
    () => multiGroups.filter((group) => !selectedMultiGroupIds.includes(group.id)),
    [multiGroups, selectedMultiGroupIds],
  )
  const appliedSingleGroups = useMemo(
    () => singleGroups.filter((group) => selectedSingleGroupIds.includes(group.id)),
    [singleGroups, selectedSingleGroupIds],
  )
  const appliedMultiGroups = useMemo(
    () => multiGroups.filter((group) => selectedMultiGroupIds.includes(group.id)),
    [multiGroups, selectedMultiGroupIds],
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
  function closeSingleModal() {
    const addIds = singlePendingAddGroupIds.filter((id) => !selectedSingleGroupIds.includes(id))
    const removeIds = singlePendingRemoveGroupIds.filter((id) => selectedSingleGroupIds.includes(id))
    const nextAttributeGroups = { ...value.attributeGroups }
    for (const groupId of removeIds) {
      delete nextAttributeGroups[groupId]
    }
    for (const groupId of addIds) {
      const group = singleGroups.find((entry) => entry.id === groupId)
      if (!group) continue
      nextAttributeGroups[groupId] = group.options.map((option) => option.id)
    }
    set('attributeGroups', nextAttributeGroups)
    setSinglePendingAddGroupIds([])
    setSinglePendingRemoveGroupIds([])
    setSingleModalOpen(false)
  }

  function closeMultiModal() {
    const addIds = multiPendingAddGroupIds.filter((id) => !selectedMultiGroupIds.includes(id))
    const removeIds = multiPendingRemoveGroupIds.filter((id) => selectedMultiGroupIds.includes(id))
    const nextAttributeGroups = { ...value.attributeGroups }
    for (const groupId of removeIds) {
      delete nextAttributeGroups[groupId]
    }
    for (const groupId of addIds) {
      const group = multiGroups.find((entry) => entry.id === groupId)
      if (!group) continue
      nextAttributeGroups[groupId] = group.options.map((option) => option.id)
    }
    set('attributeGroups', nextAttributeGroups)
    setMultiPendingAddGroupIds([])
    setMultiPendingRemoveGroupIds([])
    setMultiModalOpen(false)
  }

  function saveModifierModal() {
    const addIds = modifierPendingAddGroupIds.filter(
      (id) => !selectedModifierGroupIds.includes(id),
    )
    const removeIds = modifierPendingRemoveGroupIds.filter((id) =>
      selectedModifierGroupIds.includes(id),
    )
    const nextModifierGroupIds = [
      ...value.modifierGroupIds.filter((id) => !removeIds.includes(id)),
      ...addIds.filter((id) => !value.modifierGroupIds.includes(id)),
    ]
    set('modifierGroupIds', nextModifierGroupIds)
    setModifierPendingAddGroupIds([])
    setModifierPendingRemoveGroupIds([])
    setModifierModalOpen(false)
  }

  async function onPickImage(file: File | null) {
    if (!file) return
    setUploading(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result ?? ''))
        reader.onerror = () => reject(new Error('Failed to read image'))
        reader.readAsDataURL(file)
      })
      set('imageUrl', dataUrl)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cafe-name">Name</Label>
            <Input
              id="cafe-name"
              value={value.name}
              onChange={(e) => set('name', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cafe-sku">SKU</Label>
            <Input
              id="cafe-sku"
              value={value.sku ?? ''}
              onChange={(e) => set('sku', e.target.value || undefined)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cafe-subtype">Subtype</Label>
            <Input
              id="cafe-subtype"
              value={value.subtype ?? ''}
              onChange={(e) => set('subtype', e.target.value || undefined)}
              placeholder="Optional — muted label under title"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cafe-desc">Description</Label>
            <Textarea
              id="cafe-desc"
              rows={3}
              value={value.description ?? ''}
              onChange={(e) => set('description', e.target.value || undefined)}
            />
          </div>
          <div className="grid w-full gap-4 md:col-span-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value="Cafe & Food" disabled />
            </div>
            <div className="space-y-2">
              <Label>Sub-category</Label>
              <Select value={selectedSubCategoryId} onValueChange={onSubCategoryChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select sub-category" />
                </SelectTrigger>
                <SelectContent>
                  {subCategoryOptions.map((entry) => (
                    <SelectItem key={entry.id} value={entry.id}>
                      {entry.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid w-full gap-4 md:col-span-2 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cafe-price">Base price</Label>
              <Input
                id="cafe-price"
                type="number"
                min={0}
                step={0.01}
                value={value.basePrice}
                onChange={(e) => set('basePrice', Number.parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cafe-stock">Stock (optional)</Label>
              <Input
                id="cafe-stock"
                type="number"
                min={0}
                step={1}
                value={value.stockCount ?? ''}
                onChange={(e) => {
                  const next = e.target.value
                  set('stockCount', next === '' ? undefined : Number.parseInt(next, 10))
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cafe-image-url">Image URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="cafe-image-url"
                  className="flex-1"
                  value={value.imageUrl ?? ''}
                  onChange={(event) => set('imageUrl', event.target.value || undefined)}
                  placeholder="https://... or upload"
                />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="cafe-image-file"
                  onChange={(event) => void onPickImage(event.target.files?.[0] ?? null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => document.getElementById('cafe-image-file')?.click()}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cafe-notes">Product notes (staff)</Label>
            <Textarea
              id="cafe-notes"
              rows={2}
              value={value.notes ?? ''}
              onChange={(e) => set('notes', e.target.value || undefined)}
              placeholder="Shown as tooltip on POS / consumer cards"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4 md:col-span-2">
            <div>
              <p className="font-medium">Print notes on kitchen ticket</p>
              <p className="text-xs text-muted-foreground">
                When on, notes print on the kitchen ticket for this item.
              </p>
            </div>
            <Switch
              checked={value.printNotesOnTicket}
              onCheckedChange={(v) => set('printNotesOnTicket', v)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Availability</h3>
          <p className="text-sm text-muted-foreground">
            Customer visibility, rotation, days on menu, and prep time.
          </p>
        </div>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium">Is active</p>
                <p className="text-xs text-muted-foreground">
                  Off = hide this product from customer pages.
                </p>
              </div>
              <Switch checked={value.isActive ?? true} onCheckedChange={(v) => set('isActive', v)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium">Rotation</p>
                <p className="text-xs text-muted-foreground">
                  Assign to a rotation group when item rotates.
                </p>
              </div>
              <Switch checked={value.rotatable} onCheckedChange={(v) => set('rotatable', v)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Available days</Label>
            <div className="flex flex-wrap gap-2">
              {DAY_LABELS.map((label, idx) => (
                <label
                  key={label}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                    value.availableDaysOfWeek.includes(idx)
                      ? 'border-primary bg-primary/10'
                      : 'border-border',
                  )}
                >
                  <Checkbox
                    checked={value.availableDaysOfWeek.includes(idx)}
                    onCheckedChange={() => toggleDay(idx)}
                  />
                  {label}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Select at least one day.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cafe-prep">Preparation time (minutes)</Label>
              <Input
                id="cafe-prep"
                type="number"
                min={0}
                step={1}
                value={value.preparationTimeMinutes ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  set('preparationTimeMinutes', v === '' ? undefined : Number.parseInt(v, 10))
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-4">
          {value.rotatable ? (
            <div className="space-y-2">
              <Label>Rotation group</Label>
              <Select
                value={value.rotationGroupId ?? ''}
                onValueChange={(id) => set('rotationGroupId', id || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {rotationGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Link
                href="/admin/cafe/rotation"
                className="text-sm font-medium text-primary underline underline-offset-4"
              >
                Manage rotation schedules →
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="text-base font-semibold text-foreground">Modifier groups</h3>
            <p className="text-sm text-muted-foreground">Order matches consumer customiser order.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            aria-label="Open modifier groups picker"
            onClick={() => {
              setModifierExistingGroupId(availableModifierGroups[0]?.id ?? '')
              setModifierPendingAddGroupIds([])
              setModifierPendingRemoveGroupIds([])
              setModifierModalOpen(true)
            }}
          >
            Manage modifiers
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {attachedModifiers.length === 0 ? (
            <span className="text-xs text-muted-foreground">None attached</span>
          ) : (
            <>
              {attachedModifiers.slice(0, 3).map((group) => (
                <Badge key={group.id} variant="secondary" className="max-w-[10rem] truncate font-normal">
                  {group.name}
                </Badge>
              ))}
              {attachedModifiers.length > 3 ? (
                <Badge variant="outline" className="font-normal">
                  +{attachedModifiers.length - 3}
                </Badge>
              ) : null}
              <Button type="button" size="sm" variant="ghost" onClick={() => set('modifierGroupIds', [])}>
                Clear all
              </Button>
            </>
          )}
        </div>
      </section>

      <Dialog
        open={modifierModalOpen}
        onOpenChange={(open) => {
          setModifierModalOpen(open)
          if (!open) {
            setModifierExistingGroupId('')
            setModifierPendingAddGroupIds([])
            setModifierPendingRemoveGroupIds([])
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Modifier groups</DialogTitle>
            <DialogDescription>
              Attach shared modifier groups from the cafe library (manage definitions under Cafe & Food).
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[62vh] space-y-3 overflow-y-auto pr-1">
            <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="space-y-2">
                  {appliedModifierGroups.length > 0 ? (
                    <div className="space-y-2">
                      <Label>Already applied</Label>
                      {appliedModifierGroups.map((group) => (
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
                              setModifierPendingRemoveGroupIds((prev) =>
                                prev.includes(group.id)
                                  ? prev.filter((id) => id !== group.id)
                                  : [...prev, group.id],
                              )
                            }
                          >
                            {modifierPendingRemoveGroupIds.includes(group.id)
                              ? 'Undo remove'
                              : 'Remove'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <Label>Select existing group</Label>
                  {modifierAvailableSelectableGroups.length > 0 ? (
                    <div className="space-y-3">
                      <Select value={modifierExistingGroupId} onValueChange={setModifierExistingGroupId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select group" />
                        </SelectTrigger>
                        <SelectContent>
                          {modifierAvailableSelectableGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedAvailableModifierGroup ? (
                        <div className="space-y-2">
                          <Label>Options</Label>
                          <div className="space-y-2">
                            {selectedAvailableModifierGroup.modifiers.map((modifier) => (
                              <div
                                key={modifier.id}
                                className="rounded-lg border border-border p-3 space-y-2"
                              >
                                <Input value={modifier.name} readOnly />
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Price delta</Label>
                                    <Input value={String(modifier.priceDelta)} readOnly />
                                  </div>
                                  <div className="flex items-end justify-between gap-2 pb-1">
                                    <span className="text-xs text-muted-foreground">Default</span>
                                    <Switch checked={modifier.isDefault} disabled />
                                  </div>
                                </div>
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
                        disabled={!modifierExistingGroupId}
                        onClick={() => {
                          if (!modifierExistingGroupId) return
                          setModifierPendingAddGroupIds((prev) =>
                            prev.includes(modifierExistingGroupId)
                              ? prev
                              : [...prev, modifierExistingGroupId],
                          )
                          const nextOptions = modifierAvailableSelectableGroups.filter(
                            (group) => group.id !== modifierExistingGroupId,
                          )
                          setModifierExistingGroupId(nextOptions[0]?.id ?? '')
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No more groups available to add.</p>
                  )}
                </div>
                {modifierPendingAddGroupIds.length > 0 ? (
                  <div className="space-y-2">
                    <Label>Groups to add</Label>
                    {modifierPendingAddGroupIds
                      .map((groupId) => availableModifierGroups.find((group) => group.id === groupId))
                      .filter((group): group is ModifierGroup => Boolean(group))
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
                              setModifierPendingAddGroupIds((prev) =>
                                prev.filter((groupId) => groupId !== group.id),
                              )
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                  </div>
                ) : null}
              </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModifierModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveModifierModal}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Attribute groups</h3>
            <p className="text-sm text-muted-foreground">
              Attach shared library groups to this menu item. Single = one choice per group; multi =
              several.
            </p>
          </div>
          <Switch checked={showAttributeGroups} onCheckedChange={setShowAttributeGroups} />
        </div>
        {showAttributeGroups ? (
          <div className="space-y-6">
          {/* <Link href="/admin/cafe/attributes" className="inline-flex text-sm font-medium text-primary underline underline-offset-4">+ Create / manage Attribute Groups →</Link> */}
          <div className="space-y-2 rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium text-foreground">Single-select attributes</p>
                <p className="text-xs text-muted-foreground">
                  From <span className="font-medium text-foreground">Cafe & Food → Attributes</span>. Attach
                  size, milk type, and other single-choice groups.
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
              {appliedSingleGroups.length === 0 ? (
                <span className="text-xs text-muted-foreground">None attached</span>
              ) : (
                <>
                  {appliedSingleGroups.slice(0, 3).map((group) => (
                    <Badge key={group.id} variant="secondary" className="max-w-[10rem] truncate font-normal">
                      {group.name.trim() || 'Unnamed'}
                    </Badge>
                  ))}
                  {appliedSingleGroups.length > 3 ? (
                    <Badge variant="outline" className="font-normal">
                      +{appliedSingleGroups.length - 3}
                    </Badge>
                  ) : null}
                </>
              )}
            </div>
            {singleGroups.map((group) =>
              attributeErrors?.[group.id] ? (
                <p key={group.id} className="text-sm text-destructive">
                  {attributeErrors[group.id]}
                </p>
              ) : null,
            )}
          </div>

          <div className="space-y-2 rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium text-foreground">Multi-select attributes</p>
                <p className="text-xs text-muted-foreground">
                  Same library as single-select. Use when customers may pick several options per group.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                aria-label="Open multi-select attribute picker"
                onClick={() => {
                  setMultiExistingGroupId('')
                  setMultiPendingAddGroupIds([])
                  setMultiPendingRemoveGroupIds([])
                  setMultiModalOpen(true)
                }}
              >
                Manage groups
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {appliedMultiGroups.length === 0 ? (
                <span className="text-xs text-muted-foreground">None attached</span>
              ) : (
                <>
                  {appliedMultiGroups.slice(0, 3).map((group) => (
                    <Badge key={group.id} variant="secondary" className="max-w-[10rem] truncate font-normal">
                      {group.name.trim() || 'Unnamed'}
                    </Badge>
                  ))}
                  {appliedMultiGroups.length > 3 ? (
                    <Badge variant="outline" className="font-normal">
                      +{appliedMultiGroups.length - 3}
                    </Badge>
                  ) : null}
                </>
              )}
            </div>
            {multiGroups.map((group) =>
              attributeErrors?.[group.id] ? (
                <p key={group.id} className="text-sm text-destructive">
                  {attributeErrors[group.id]}
                </p>
              ) : null,
            )}
          </div>
          </div>
        ) : null}
      </section>

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
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Single-select attributes</DialogTitle>
            <DialogDescription>
              Choose a library group, review options, tap <span className="font-medium text-foreground">Add</span>
              , then <span className="font-medium text-foreground">Save</span> to attach it to this product.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[62vh] space-y-3 overflow-y-auto pr-1">
            {appliedSingleGroups.length > 0 || singleAvailableSelectableGroups.length > 0 ? (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="space-y-2">
                  {appliedSingleGroups.length > 0 ? (
                    <div className="space-y-2">
                      <Label>Already applied</Label>
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
                                className="rounded-lg border p-3 text-sm font-medium"
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
                No single-select attribute groups in the library. Create them under Cafe & Food →
                Attributes.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSingleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={closeSingleModal}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
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
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Multi-select attributes</DialogTitle>
            <DialogDescription>
              Same flow as single-select: pick a group, review options, tap{' '}
              <span className="font-medium text-foreground">Add</span>, then{' '}
              <span className="font-medium text-foreground">Save</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[62vh] space-y-3 overflow-y-auto pr-1">
            {appliedMultiGroups.length > 0 || multiAvailableSelectableGroups.length > 0 ? (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="space-y-2">
                  {appliedMultiGroups.length > 0 ? (
                    <div className="space-y-2">
                      <Label>Already applied</Label>
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
                                className="rounded-lg border p-3 text-sm font-medium"
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
                          setMultiExistingGroupId('')
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
            ) : (
              <p className="text-sm text-muted-foreground">
                No multi-select attribute groups in the library. Create them under Cafe & Food →
                Attributes.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMultiModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={closeMultiModal}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
