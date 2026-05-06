/** Cafe product admin form — card sections aligned with gifts/rentals layout. */
'use client'

import Link from 'next/link'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

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
  /** Optional updater to persist new attribute options created from this form. */
  readonly onUpsertAttributeGroup?: (group: AttributeGroup) => void
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
  onUpsertAttributeGroup,
  attributeErrors,
}: Readonly<CafeProductFormProps>) {
  const [uploading, setUploading] = useState(false)
  const [singleModalOpen, setSingleModalOpen] = useState(false)
  const [multiModalOpen, setMultiModalOpen] = useState(false)
  const [showAttributeGroups, setShowAttributeGroups] = useState(false)
  const [singleDraftName, setSingleDraftName] = useState('')
  const [singleDraftOptions, setSingleDraftOptions] = useState<string[]>([''])
  const [multiDraftName, setMultiDraftName] = useState('')
  const [multiDraftOptions, setMultiDraftOptions] = useState<string[]>([''])
  const [multiDraftMaxSelect, setMultiDraftMaxSelect] = useState('1')
  const [singleExistingGroupId, setSingleExistingGroupId] = useState('')
  const [multiExistingGroupId, setMultiExistingGroupId] = useState('')
  const [showSingleNewGroupForm, setShowSingleNewGroupForm] = useState(false)
  const [showMultiNewGroupForm, setShowMultiNewGroupForm] = useState(false)
  const [didAutoOpenAttributeGroups, setDidAutoOpenAttributeGroups] = useState(false)

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

  const availableToAttach = useMemo(() => {
    const attached = new Set(value.modifierGroupIds)
    return modifierGroups.filter((g) => !attached.has(g.id))
  }, [modifierGroups, value.modifierGroupIds])

  function toggleDay(day: number) {
    const cur = value.availableDaysOfWeek ?? []
    const has = cur.includes(day)
    const next = has ? cur.filter((d) => d !== day) : [...cur, day].sort((a, b) => a - b)
    set('availableDaysOfWeek', next)
  }

  function moveModifier(index: number, dir: -1 | 1) {
    const ids = [...value.modifierGroupIds]
    const j = index + dir
    if (j < 0 || j >= ids.length) return
    const t = ids[index]
    ids[index] = ids[j]!
    ids[j] = t!
    set('modifierGroupIds', ids)
  }

  function attachModifierGroup(id: string) {
    if (value.modifierGroupIds.includes(id)) return
    set('modifierGroupIds', [...value.modifierGroupIds, id])
  }

  function detachModifierGroup(id: string) {
    set(
      'modifierGroupIds',
      value.modifierGroupIds.filter((x) => x !== id),
    )
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
  const editingSingleExisting = selectedSingleGroupIds.length > 0
  const editingMultiExisting = selectedMultiGroupIds.length > 0
  const activeSingleExistingGroup = useMemo(
    () => singleGroups.find((group) => group.id === singleExistingGroupId) ?? null,
    [singleExistingGroupId, singleGroups],
  )
  const activeMultiExistingGroup = useMemo(
    () => multiGroups.find((group) => group.id === multiExistingGroupId) ?? null,
    [multiExistingGroupId, multiGroups],
  )

  function saveDraftAttributeGroup(selectionType: 'single' | 'multiple') {
    if (!onUpsertAttributeGroup) return
    const draftName = selectionType === 'single' ? singleDraftName : multiDraftName
    const options = (selectionType === 'single' ? singleDraftOptions : multiDraftOptions)
      .map((label) => label.trim())
      .filter((label) => label.length > 0)
    if (!draftName.trim() || options.length === 0) {
      return
    }
    const groupId = `ag-${Date.now()}`
    const optionIds = options.map((_, index) => `ao-${Date.now()}-${index}`)
    const maxSelect =
      selectionType === 'multiple'
        ? Math.max(1, Number.parseInt(multiDraftMaxSelect, 10) || 1)
        : undefined

    const group: AttributeGroup = {
      id: groupId,
      name: draftName.trim(),
      selectionType,
      maxSelect,
      isRequired: false,
      options: options.map((label, index) => ({
        id: optionIds[index],
        label,
        emoji: selectionType === 'single' ? '•' : '✓',
        color: selectionType === 'single' ? '#94a3b8' : '#60a5fa',
      })),
    }
    onUpsertAttributeGroup(group)
    set('attributeGroups', {
      ...value.attributeGroups,
      [groupId]: optionIds,
    })
    if (selectionType === 'single') {
      setSingleModalOpen(false)
      setSingleDraftName('')
      setSingleDraftOptions([''])
      return
    }
    setMultiModalOpen(false)
    setMultiDraftName('')
    setMultiDraftOptions([''])
    setMultiDraftMaxSelect('1')
  }

  function updateExistingGroupOptionLabel(groupId: string, optionId: string, label: string) {
    if (!onUpsertAttributeGroup) return
    const group = attributeGroups.find((entry) => entry.id === groupId)
    if (!group) return
    onUpsertAttributeGroup({
      ...group,
      options: group.options.map((option) =>
        option.id === optionId ? { ...option, label } : option,
      ),
    })
  }

  function addExistingGroupOption(groupId: string, selectionType: 'single' | 'multiple') {
    if (!onUpsertAttributeGroup) return
    const group = attributeGroups.find((entry) => entry.id === groupId)
    if (!group) return
    const optionId = `ao-${Date.now()}`
    onUpsertAttributeGroup({
      ...group,
      options: [
        ...group.options,
        {
          id: optionId,
          label: 'New option',
          emoji: selectionType === 'single' ? '•' : '✓',
          color: selectionType === 'single' ? '#94a3b8' : '#60a5fa',
        },
      ],
    })
    const current = value.attributeGroups[group.id] ?? []
    set('attributeGroups', {
      ...value.attributeGroups,
      [group.id]: current.includes(optionId) ? current : [...current, optionId],
    })
  }

  function removeExistingGroupOption(groupId: string, optionId: string) {
    if (!onUpsertAttributeGroup) return
    const group = attributeGroups.find((entry) => entry.id === groupId)
    if (!group) return
    onUpsertAttributeGroup({
      ...group,
      options: group.options.filter((option) => option.id !== optionId),
    })
    const current = value.attributeGroups[groupId] ?? []
    const nextSelected = current.filter((id) => id !== optionId)
    const nextMap = { ...value.attributeGroups }
    if (nextSelected.length === 0) {
      delete nextMap[groupId]
    } else {
      nextMap[groupId] = nextSelected
    }
    set('attributeGroups', nextMap)
  }

  function closeSingleModal() {
    const hasDraftData =
      singleDraftName.trim().length > 0 ||
      singleDraftOptions.some((option) => option.trim().length > 0)
    if (hasDraftData) {
      saveDraftAttributeGroup('single')
      return
    }
    setSingleModalOpen(false)
  }

  function closeMultiModal() {
    const hasDraftData =
      multiDraftName.trim().length > 0 ||
      multiDraftOptions.some((option) => option.trim().length > 0)
    if (hasDraftData) {
      saveDraftAttributeGroup('multiple')
      return
    }
    setMultiModalOpen(false)
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
        <div>
          <h3 className="text-base font-semibold text-foreground">Modifier groups</h3>
          <p className="text-sm text-muted-foreground">
            Order matches consumer customiser order.
          </p>
        </div>
        <div className="space-y-4">
          {/* <Link
            href="/admin/cafe/modifiers"
            className="inline-flex text-sm font-medium text-primary underline underline-offset-4"
          >
            + Create / manage Modifier Groups →
          </Link> */}

          <div className="space-y-2">
            {attachedModifiers.map((g, index) => (
              <div
                key={g.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{g.name}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className={g.isRequired ? 'text-amber-600' : ''}>
                      {g.isRequired ? '(required)' : '(optional)'}
                    </span>{' '}
                    ·{' '}
                    {g.maxSelect === 1 ? '(radio — pick one)' : `(checkboxes — up to ${g.maxSelect})`}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => moveModifier(index, -1)}>
                  <ChevronUp className="h-4 w-4" aria-label="Move up" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => moveModifier(index, 1)}>
                  <ChevronDown className="h-4 w-4" aria-label="Move down" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => detachModifierGroup(g.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" aria-label="Remove" />
                </Button>
              </div>
            ))}
          </div>

          {availableToAttach.length > 0 ? (
            <div className="space-y-1">
              <Label>Add group</Label>
              <Select onValueChange={(id) => attachModifierGroup(id)}>
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Choose modifier group to attach…" />
                </SelectTrigger>
                <SelectContent>
                  {availableToAttach.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Attribute groups</h3>
            <p className="text-sm text-muted-foreground">
              Informational chips — single or multi-select per group rules.
            </p>
          </div>
          <Switch checked={showAttributeGroups} onCheckedChange={setShowAttributeGroups} />
        </div>
        {showAttributeGroups ? (
          <div className="space-y-6">
          {/* <Link
            href="/admin/cafe/attributes"
            className="inline-flex text-sm font-medium text-primary underline underline-offset-4"
          >
            + Create / manage Attribute Groups →
          </Link> */}
          <div className="space-y-2 rounded-lg border border-border p-4">
            <div className="space-y-1">
              <p className="font-medium text-foreground">Single select attributes</p>
              <p className="text-xs text-muted-foreground">
                Search existing values or type a new value and press Enter.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between"
              onClick={() => {
                setSingleDraftName('')
                setSingleDraftOptions([''])
                setSingleExistingGroupId(selectedSingleGroupIds[0] ?? '')
                setShowSingleNewGroupForm(!editingSingleExisting)
                setSingleModalOpen(true)
              }}
            >
              <span className="truncate text-left">
                {selectedSingleOptions.length > 0
                  ? `${selectedSingleOptions.length} selected`
                  : 'Select single attribute'}
              </span>
              <span className="text-xs text-muted-foreground">Open</span>
            </Button>
            {selectedSingleOptions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedSingleOptions.map((entry) => (
                  <Badge key={`${entry.groupId}-${entry.optionId}`} variant="secondary">
                    {entry.display}
                  </Badge>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const next = { ...value.attributeGroups }
                    for (const group of singleGroups) {
                      delete next[group.id]
                    }
                    set('attributeGroups', next)
                  }}
                >
                  Clear
                </Button>
              </div>
            ) : null}
            {singleGroups.map((group) =>
              attributeErrors?.[group.id] ? (
                <p key={group.id} className="text-sm text-destructive">
                  {attributeErrors[group.id]}
                </p>
              ) : null,
            )}
          </div>

          <div className="space-y-2 rounded-lg border border-border p-4">
            <div className="space-y-1">
              <p className="font-medium text-foreground">Multiple select attributes</p>
              <p className="text-xs text-muted-foreground">
                Search existing values or type a new value and press Enter.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between"
              onClick={() => {
                setMultiDraftName('')
                setMultiDraftOptions([''])
                setMultiDraftMaxSelect('1')
                setMultiExistingGroupId(selectedMultiGroupIds[0] ?? '')
                setShowMultiNewGroupForm(!editingMultiExisting)
                setMultiModalOpen(true)
              }}
            >
              <span className="truncate text-left">
                {selectedMultiOptions.length > 0
                  ? `${selectedMultiOptions.length} selected`
                  : 'Select multiple attributes'}
              </span>
              <span className="text-xs text-muted-foreground">Open</span>
            </Button>
            {selectedMultiOptions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedMultiOptions.map((entry) => (
                  <Badge key={`${entry.groupId}-${entry.optionId}`} variant="secondary">
                    {entry.display}
                  </Badge>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const next = { ...value.attributeGroups }
                    for (const group of multiGroups) {
                      delete next[group.id]
                    }
                    set('attributeGroups', next)
                  }}
                >
                  Clear
                </Button>
              </div>
            ) : null}
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

      <Dialog open={singleModalOpen} onOpenChange={setSingleModalOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Single select attributes</DialogTitle>
            <DialogDescription>
              {editingSingleExisting
                ? 'Select an existing group and add new options.'
                : 'Add a new single-select group and its options.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 overflow-y-auto pr-1">
            {editingSingleExisting && !showSingleNewGroupForm ? (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <p className="text-sm font-semibold text-foreground">Existing group</p>
                <div className="space-y-2">
                  <Label>Group</Label>
                  <Select value={singleExistingGroupId} onValueChange={setSingleExistingGroupId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedSingleGroupIds.map((groupId) => {
                        const group = singleGroups.find((entry) => entry.id === groupId)
                        if (!group) return null
                        return (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {activeSingleExistingGroup ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Options</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addExistingGroupOption(activeSingleExistingGroup.id, 'single')}
                      >
                        Add option
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {activeSingleExistingGroup.options.map((option) => (
                        <div key={option.id} className="rounded-lg border p-3">
                          <div className="flex items-center gap-2">
                            <Input
                              value={option.label}
                              onChange={(event) =>
                                updateExistingGroupOptionLabel(
                                  activeSingleExistingGroup.id,
                                  option.id,
                                  event.target.value,
                                )
                              }
                              placeholder="Option name"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                removeExistingGroupOption(activeSingleExistingGroup.id, option.id)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            {!editingSingleExisting ? (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <p className="text-sm font-semibold text-foreground">New group</p>
                <div className="space-y-2">
                  <Label htmlFor="single-group-name">Group name</Label>
                  <Input
                    id="single-group-name"
                    value={singleDraftName}
                    onChange={(event) => setSingleDraftName(event.target.value)}
                    placeholder="e.g. Availability Label"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Options</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSingleDraftOptions((prev) => [...prev, ''])}
                    >
                      Add option
                    </Button>
                  </div>
                </div>
                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {singleDraftOptions.map((entry, index) => (
                    <div key={`single-opt-${index}`} className="rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <Input
                          value={entry}
                          onChange={(event) =>
                            setSingleDraftOptions((prev) =>
                              prev.map((value, idx) => (idx === index ? event.target.value : value)),
                            )
                          }
                          placeholder="Option name"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={singleDraftOptions.length <= 1}
                          onClick={() =>
                            setSingleDraftOptions((prev) => prev.filter((_, idx) => idx !== index))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : showSingleNewGroupForm ? (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <p className="text-sm font-semibold text-foreground">New group</p>
                <div className="space-y-2">
                  <Label htmlFor="single-group-name">Group name</Label>
                  <Input
                    id="single-group-name"
                    value={singleDraftName}
                    onChange={(event) => setSingleDraftName(event.target.value)}
                    placeholder="e.g. Availability Label"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Options</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSingleDraftOptions((prev) => [...prev, ''])}
                    >
                      Add option
                    </Button>
                  </div>
                </div>
                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {singleDraftOptions.map((entry, index) => (
                    <div key={`single-opt-${index}`} className="rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <Input
                          value={entry}
                          onChange={(event) =>
                            setSingleDraftOptions((prev) =>
                              prev.map((value, idx) => (idx === index ? event.target.value : value)),
                            )
                          }
                          placeholder="Option name"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={singleDraftOptions.length <= 1}
                          onClick={() =>
                            setSingleDraftOptions((prev) => prev.filter((_, idx) => idx !== index))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSingleDraftName('')
                  setSingleDraftOptions([''])
                  setShowSingleNewGroupForm(true)
                }}
              >
                Add new group
              </Button>
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

      <Dialog open={multiModalOpen} onOpenChange={setMultiModalOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Multiple select attributes</DialogTitle>
            <DialogDescription>
              {editingMultiExisting
                ? 'Select an existing group and add new options.'
                : 'Add a new multi-select group, options, and max selections.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 overflow-y-auto pr-1">
            {editingMultiExisting && !showMultiNewGroupForm ? (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <p className="text-sm font-semibold text-foreground">Existing group</p>
                <div className="space-y-2">
                  <Label>Group</Label>
                  <Select value={multiExistingGroupId} onValueChange={setMultiExistingGroupId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedMultiGroupIds.map((groupId) => {
                        const group = multiGroups.find((entry) => entry.id === groupId)
                        if (!group) return null
                        return (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {activeMultiExistingGroup ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="multi-existing-max">Max selections</Label>
                      <Input
                        id="multi-existing-max"
                        type="number"
                        min={1}
                        step={1}
                        value={activeMultiExistingGroup.maxSelect ?? 1}
                        onChange={(event) =>
                          onUpsertAttributeGroup?.({
                            ...activeMultiExistingGroup,
                            maxSelect: Math.max(1, Number.parseInt(event.target.value, 10) || 1),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Options</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addExistingGroupOption(activeMultiExistingGroup.id, 'multiple')}
                        >
                          Add option
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {activeMultiExistingGroup.options.map((option) => (
                          <div key={option.id} className="rounded-lg border p-3">
                            <div className="flex items-center gap-2">
                              <Input
                                value={option.label}
                                onChange={(event) =>
                                  updateExistingGroupOptionLabel(
                                    activeMultiExistingGroup.id,
                                    option.id,
                                    event.target.value,
                                  )
                                }
                                placeholder="Option name"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  removeExistingGroupOption(activeMultiExistingGroup.id, option.id)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
            {!editingMultiExisting ? (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <p className="text-sm font-semibold text-foreground">New group</p>
                <div className="space-y-2">
                  <Label htmlFor="multi-group-name">Group name</Label>
                  <Input
                    id="multi-group-name"
                    value={multiDraftName}
                    onChange={(event) => setMultiDraftName(event.target.value)}
                    placeholder="e.g. Dietary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="multi-max-select">Max selections</Label>
                  <Input
                    id="multi-max-select"
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
                      onClick={() => setMultiDraftOptions((prev) => [...prev, ''])}
                    >
                      Add option
                    </Button>
                  </div>
                </div>
                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {multiDraftOptions.map((entry, index) => (
                    <div key={`multi-opt-${index}`} className="rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <Input
                          value={entry}
                          onChange={(event) =>
                            setMultiDraftOptions((prev) =>
                              prev.map((value, idx) => (idx === index ? event.target.value : value)),
                            )
                          }
                          placeholder="Option name"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={multiDraftOptions.length <= 1}
                          onClick={() =>
                            setMultiDraftOptions((prev) => prev.filter((_, idx) => idx !== index))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : showMultiNewGroupForm ? (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <p className="text-sm font-semibold text-foreground">New group</p>
                <div className="space-y-2">
                  <Label htmlFor="multi-group-name">Group name</Label>
                  <Input
                    id="multi-group-name"
                    value={multiDraftName}
                    onChange={(event) => setMultiDraftName(event.target.value)}
                    placeholder="e.g. Dietary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="multi-max-select">Max selections</Label>
                  <Input
                    id="multi-max-select"
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
                      onClick={() => setMultiDraftOptions((prev) => [...prev, ''])}
                    >
                      Add option
                    </Button>
                  </div>
                </div>
                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {multiDraftOptions.map((entry, index) => (
                    <div key={`multi-opt-${index}`} className="rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <Input
                          value={entry}
                          onChange={(event) =>
                            setMultiDraftOptions((prev) =>
                              prev.map((value, idx) => (idx === index ? event.target.value : value)),
                            )
                          }
                          placeholder="Option name"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={multiDraftOptions.length <= 1}
                          onClick={() =>
                            setMultiDraftOptions((prev) => prev.filter((_, idx) => idx !== index))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMultiDraftName('')
                  setMultiDraftOptions([''])
                  setMultiDraftMaxSelect('1')
                  setShowMultiNewGroupForm(true)
                }}
              >
                Add new group
              </Button>
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
