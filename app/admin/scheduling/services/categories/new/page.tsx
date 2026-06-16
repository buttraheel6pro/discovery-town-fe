/** Admin page for creating a scheduling sub-category outside a modal. */

'use client'

import Link from 'next/link'
import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CrudModal } from '@/components/admin/crud-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { LABELS } from '@/lib/constants/ui-labels'
import {
  patchSchedulingCategoryPlacement,
  resolveCatalogMenuTarget,
} from '@/lib/catalog-placement'
import {
  CATALOG_MENU_ORDER,
  catalogSlugFromProductType,
  catalogSlugToSchedulingTopLevel,
  isProductCatalogSlug,
  isSchedulingCatalogSlug,
  type CatalogSlug,
} from '@/lib/catalog-slugs'
import { samplePreschoolAddOns } from '@/lib/mock-data'
import { useInventory } from '@/lib/inventory-store'
import { newAdminEntityId } from '@/lib/scheduling-admin-builders'
import {
  getSchedulingTopLevelLabel,
  SCHEDULING_TOP_LEVEL_ORDER,
  type SchedulingTopLevelId,
} from '@/lib/scheduling-consumer-categories'
import { useScheduling } from '@/lib/scheduling-store'
import { bookingAddOnToSchedulingAddOn, formatPrice } from '@/lib/utils'
import {
  CATEGORY_ADD_ON_CHARGE_FREQUENCIES,
  type CategoryAddOnChargeFrequency,
  type SchedulingCategory,
} from '@/lib/types'

interface CategoryDraft {
  readonly parentTopLevelId: SchedulingTopLevelId
  readonly menuCatalogSlug: CatalogSlug
  readonly name: string
  readonly icon: string
  readonly displayOrder: string
  readonly isActive: boolean
  readonly description: string
  readonly requiresAttendee: boolean
  readonly membersOnly: boolean
  readonly freeInfantMonths: string
  readonly depositPercent: string
  readonly specialInstructionsEnabled: boolean
  readonly waitlistEnabled: boolean
  readonly allowFamilyMember: boolean
  readonly requireCheckInBeforeRebook: boolean
  readonly pendingAddOnLinks: {
    addOnId: string
    addOnName?: string
    isFree: boolean
    quantity: string
    unitPrice: string
    chargeFrequency: CategoryAddOnChargeFrequency
  }[]
}

function slugifyCategoryName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function schedulingSlugForTopLevel(topLevelId: SchedulingTopLevelId): CatalogSlug {
  switch (topLevelId) {
    case 'GYM':
      return 'gym'
    case 'PLAY':
      return 'play'
    case 'EVENT':
      return 'events'
    case 'LEARN':
      return 'learn'
    default:
      return 'events'
  }
}

function AdminSchedulingCategoryNewPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { bookingAddOns, productCategories } = useInventory()
  const { categories, addCategory } = useScheduling()

  const rawReturnTo = searchParams.get('returnTo')?.trim() ?? '/admin/scheduling/services'
  const returnTo = rawReturnTo.startsWith('/admin/') ? rawReturnTo : '/admin/scheduling/services'
  const requestedTopLevel = searchParams.get('topLevelId')
  const initialTopLevelId: SchedulingTopLevelId =
    requestedTopLevel === 'GYM' ||
    requestedTopLevel === 'PLAY' ||
    requestedTopLevel === 'EVENT' ||
    requestedTopLevel === 'LEARN'
      ? requestedTopLevel
      : 'GYM'

  const productRootBySlug = useMemo(() => {
    const out: Record<string, string | undefined> = {}
    for (const root of productCategories.filter((row) => (row.parentId ?? null) === null)) {
      const slug = catalogSlugFromProductType(root.productType ?? 'shop')
      out[slug] = root.id
    }
    return out
  }, [productCategories])

  const nextDisplayOrder = useMemo(() => {
    const prefixByTopLevel: Record<SchedulingTopLevelId, string> = {
      GYM: 'cat-gym-',
      PLAY: 'cat-play-',
      EVENT: 'cat-event-',
      LEARN: 'cat-learn-',
    }
    const matching = categories.filter((category) =>
      category.id.startsWith(prefixByTopLevel[initialTopLevelId]),
    )
    return (matching[matching.length - 1]?.displayOrder ?? categories[categories.length - 1]?.displayOrder ?? 0) + 1
  }, [categories, initialTopLevelId])

  const [draft, setDraft] = useState<CategoryDraft>({
    parentTopLevelId: initialTopLevelId,
    menuCatalogSlug: schedulingSlugForTopLevel(initialTopLevelId),
    name: '',
    icon: '',
    displayOrder: String(nextDisplayOrder),
    isActive: true,
    description: '',
    requiresAttendee: false,
    membersOnly: false,
    freeInfantMonths: '',
    depositPercent: '',
    specialInstructionsEnabled: false,
    waitlistEnabled: true,
    allowFamilyMember: false,
    requireCheckInBeforeRebook: false,
    pendingAddOnLinks: [],
  })
  const [newAddOnId, setNewAddOnId] = useState<string>('')
  const [addOnModalOpen, setAddOnModalOpen] = useState(false)
  const [pendingAddOnQuantity, setPendingAddOnQuantity] = useState('1')
  const [pendingAddOnIsFree, setPendingAddOnIsFree] = useState(false)
  const [pendingAddOnUnitPrice, setPendingAddOnUnitPrice] = useState('')
  const [pendingAddOnChargeFrequency, setPendingAddOnChargeFrequency] =
    useState<CategoryAddOnChargeFrequency>('ONE_TIME')

  const addOnCatalog = useMemo(() => {
    const map = new Map<string, ReturnType<typeof bookingAddOnToSchedulingAddOn>>()
    for (const addOn of bookingAddOns) {
      map.set(addOn.id, bookingAddOnToSchedulingAddOn(addOn))
    }
    for (const addOn of samplePreschoolAddOns) {
      map.set(addOn.id, addOn)
    }
    return Array.from(map.values())
  }, [bookingAddOns])

  const selectedAddOnForModal = useMemo(() => {
    if (!newAddOnId) {
      return null
    }
    return addOnCatalog.find((entry) => entry.id === newAddOnId) ?? null
  }, [addOnCatalog, newAddOnId])

  function openAddOnModal(): void {
    if (!newAddOnId) {
      return
    }
    const selectedAddOn = addOnCatalog.find((entry) => entry.id === newAddOnId)
    setPendingAddOnQuantity('1')
    setPendingAddOnIsFree(false)
    setPendingAddOnUnitPrice(
      selectedAddOn ? String(Number(selectedAddOn.price.toFixed(2))) : '',
    )
    setPendingAddOnChargeFrequency('ONE_TIME')
    setAddOnModalOpen(true)
  }

  function confirmAddOnLink(): void {
    if (!newAddOnId) {
      return
    }
    const parsedQuantity = Number.parseInt(pendingAddOnQuantity, 10)
    const parsedUnitPrice = pendingAddOnIsFree ? 0 : Number.parseFloat(pendingAddOnUnitPrice)
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1 || !Number.isFinite(parsedUnitPrice)) {
      return
    }
    setDraft((previous) => ({
      ...previous,
      pendingAddOnLinks: [
        ...previous.pendingAddOnLinks,
        {
          addOnId: newAddOnId,
          addOnName: selectedAddOnForModal?.name ?? undefined,
          isFree: pendingAddOnIsFree,
          quantity: String(parsedQuantity),
          unitPrice: Number(parsedUnitPrice).toFixed(2),
          chargeFrequency: pendingAddOnChargeFrequency,
        },
      ],
    }))
    setAddOnModalOpen(false)
    setNewAddOnId('')
  }

  function handleCreateCategory(): void {
    const displayOrder = Number.parseInt(draft.displayOrder, 10)
    if (!draft.name.trim() || !Number.isFinite(displayOrder)) {
      return
    }

    const freeInfantMonths =
      draft.freeInfantMonths.trim().length > 0
        ? Number.parseInt(draft.freeInfantMonths.trim(), 10)
        : undefined
    const depositPercent =
      draft.depositPercent.trim().length > 0 ? Number.parseFloat(draft.depositPercent.trim()) : undefined
    const categoryPrefixByTopLevel: Record<SchedulingTopLevelId, string> = {
      GYM: 'cat-gym-',
      PLAY: 'cat-play-',
      EVENT: 'cat-event-',
      LEARN: 'cat-learn-',
    }
    const menuSlug = draft.menuCatalogSlug
    const targetTopLevel = isSchedulingCatalogSlug(menuSlug)
      ? catalogSlugToSchedulingTopLevel(menuSlug)
      : draft.parentTopLevelId

    const categorySlug = slugifyCategoryName(draft.name) || newAdminEntityId('cat').slice(4)
    const idBase = `${categoryPrefixByTopLevel[targetTopLevel]}${categorySlug}`
    const categoryId = categories.some((category) => category.id === idBase)
      ? `${idBase}-${newAdminEntityId('cat').slice(4)}`
      : idBase
    const linkedAddOns = draft.pendingAddOnLinks.map((link) => ({
      id: newAdminEntityId('cao'),
      categoryId,
      addOnId: link.addOnId,
      addOnName: link.addOnName,
      isOptional: true,
      isFree: link.isFree,
      quantity: Number.parseInt(link.quantity, 10),
      unitPrice: Number.parseFloat(link.unitPrice),
      chargeFrequency: link.chargeFrequency,
    }))

    const productRootId = isProductCatalogSlug(menuSlug)
      ? (productRootBySlug[menuSlug] ?? null)
      : null
    const nativeSlug = schedulingSlugForTopLevel(draft.parentTopLevelId)
    const placementBase: SchedulingCategory = {
      id: categoryId,
      name: draft.name.trim(),
      icon: draft.icon.trim() || null,
      displayOrder,
      isActive: draft.isActive,
      description: draft.description.trim() || undefined,
      requiresAttendee: draft.requiresAttendee,
      membersOnly: draft.membersOnly,
      freeInfantMonths: Number.isFinite(freeInfantMonths ?? Number.NaN) ? freeInfantMonths : undefined,
      depositPercent: Number.isFinite(depositPercent ?? Number.NaN) ? depositPercent : undefined,
      specialInstructionsEnabled: draft.specialInstructionsEnabled,
      waitlistEnabled: draft.waitlistEnabled,
      allowFamilyMember: draft.allowFamilyMember,
      requireCheckInBeforeRebook: draft.requireCheckInBeforeRebook,
      catalogSlug: isSchedulingCatalogSlug(nativeSlug) ? nativeSlug : undefined,
      linkedAddOns,
    }
    const created: SchedulingCategory = {
      ...placementBase,
      ...patchSchedulingCategoryPlacement(
        placementBase,
        resolveCatalogMenuTarget({
          catalogSlug: menuSlug,
          productRootId,
        }),
      ),
    }

    addCategory(created)
    router.push(returnTo)
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">New sub-category</h1>
        <p className="mt-2 text-muted-foreground">
          Create a sub-category under Gym, Play, Events, or Learn and choose where it appears in
          customer menus.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create sub-category</CardTitle>
          <CardDescription>Configure sub-category details and booking behavior.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cat-parent-top">Category</Label>
              <Select
                value={draft.parentTopLevelId}
                onValueChange={(value) => {
                  const topLevelId = value as SchedulingTopLevelId
                  setDraft((previous) => ({
                    ...previous,
                    parentTopLevelId: topLevelId,
                    menuCatalogSlug: schedulingSlugForTopLevel(topLevelId),
                  }))
                }}
              >
                <SelectTrigger id="cat-parent-top">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULING_TOP_LEVEL_ORDER.map((topLevelId) => (
                    <SelectItem key={topLevelId} value={topLevelId}>
                      {getSchedulingTopLevelLabel(topLevelId)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Canonical catalog bucket for services in this sub-category.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-menu-placement">Menu placement</Label>
              <Select
                value={draft.menuCatalogSlug}
                onValueChange={(value) =>
                  setDraft((previous) => ({
                    ...previous,
                    menuCatalogSlug: value as CatalogSlug,
                  }))
                }
              >
                <SelectTrigger id="cat-menu-placement">
                  <SelectValue placeholder="Select menu" />
                </SelectTrigger>
                <SelectContent>
                  {CATALOG_MENU_ORDER.map((entry) => (
                    <SelectItem key={entry.slug} value={entry.slug}>
                      {entry.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Customer menu where this sub-category is listed. Product menus only change
                placement; scheduling ids stay the same.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={draft.name}
              onChange={(event) => setDraft((previous) => ({ ...previous, name: event.target.value }))}
              placeholder="Court Sports"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cat-order">Display order</Label>
              <Input
                id="cat-order"
                type="number"
                value={draft.displayOrder}
                onChange={(event) =>
                  setDraft((previous) => ({ ...previous, displayOrder: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-icon">Icon</Label>
              <Input
                id="cat-icon"
                value={draft.icon}
                onChange={(event) => setDraft((previous) => ({ ...previous, icon: event.target.value }))}
                placeholder="Activity"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="cat-active">Active</Label>
            <Switch
              id="cat-active"
              checked={draft.isActive}
              onCheckedChange={(value) => setDraft((previous) => ({ ...previous, isActive: value }))}
            />
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="advanced">
              <AccordionTrigger>Advanced settings</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pb-2">
                  <div className="space-y-2">
                    <Label htmlFor="cat-desc">Description (optional)</Label>
                    <Textarea
                      id="cat-desc"
                      value={draft.description}
                      onChange={(event) =>
                        setDraft((previous) => ({ ...previous, description: event.target.value }))
                      }
                      rows={3}
                      placeholder="Optional description shown to customers…"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="cat-requires">Child must attend with an adult</Label>
                        <p className="text-xs text-muted-foreground">
                          The child being booked must be accompanied by a responsible adult (you or
                          another adult on the booking).
                        </p>
                      </div>
                      <Switch
                        id="cat-requires"
                        checked={draft.requiresAttendee}
                        onCheckedChange={(value) =>
                          setDraft((previous) => ({ ...previous, requiresAttendee: value }))
                        }
                      />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="cat-members">Members only</Label>
                        <p className="text-xs text-muted-foreground">
                          Only customers with an active membership can book.
                        </p>
                      </div>
                      <Switch
                        id="cat-members"
                        checked={draft.membersOnly}
                        onCheckedChange={(value) =>
                          setDraft((previous) => ({ ...previous, membersOnly: value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cat-infant">Free infant age (months)</Label>
                      <Input
                        id="cat-infant"
                        type="number"
                        min={0}
                        max={24}
                        value={draft.freeInfantMonths}
                        onChange={(event) =>
                          setDraft((previous) => ({ ...previous, freeInfantMonths: event.target.value }))
                        }
                        placeholder="e.g. 6"
                      />
                      <p className="text-xs text-muted-foreground">Under X months is free.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cat-deposit">Deposit required (%)</Label>
                      <Input
                        id="cat-deposit"
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={draft.depositPercent}
                        onChange={(event) =>
                          setDraft((previous) => ({ ...previous, depositPercent: event.target.value }))
                        }
                        placeholder="e.g. 25"
                      />
                      <p className="text-xs text-muted-foreground">
                        {draft.depositPercent.trim()
                          ? `e.g. ${draft.depositPercent}% deposit on a $100 booking = $${Math.round((Number.parseFloat(draft.depositPercent) || 0))} upfront`
                          : 'Customers pay this percentage upfront to confirm the booking.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="cat-special">Allow special instructions</Label>
                        <p className="text-xs text-muted-foreground">
                          Customers can add notes during booking (e.g. dietary needs, preferences).
                        </p>
                      </div>
                      <Switch
                        id="cat-special"
                        checked={draft.specialInstructionsEnabled}
                        onCheckedChange={(value) =>
                          setDraft((previous) => ({
                            ...previous,
                            specialInstructionsEnabled: value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="cat-waitlist">Enable waitlist</Label>
                        <p className="text-xs text-muted-foreground">
                          When a session is full, customers can join the waitlist.
                        </p>
                      </div>
                      <Switch
                        id="cat-waitlist"
                        checked={draft.waitlistEnabled}
                        onCheckedChange={(value) =>
                          setDraft((previous) => ({ ...previous, waitlistEnabled: value }))
                        }
                      />
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="cat-family">Participating children: same household only</Label>
                        <p className="text-xs text-muted-foreground">
                          Every child on the play session must be from the same household or your
                          linked family list — outside children cannot be added.
                        </p>
                      </div>
                      <Switch
                        id="cat-family"
                        checked={draft.allowFamilyMember}
                        onCheckedChange={(value) =>
                          setDraft((previous) => ({ ...previous, allowFamilyMember: value }))
                        }
                      />
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="cat-checkin-gate">Require check-in before next booking</Label>
                        <p className="text-xs text-muted-foreground">
                          Contact must have checked in before making another booking in this category.
                        </p>
                      </div>
                      <Switch
                        id="cat-checkin-gate"
                        checked={draft.requireCheckInBeforeRebook}
                        onCheckedChange={(value) =>
                          setDraft((previous) => ({ ...previous, requireCheckInBeforeRebook: value }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="addons">
              <AccordionTrigger>Linked add-ons (optional)</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pb-2">
                  <p className="text-xs text-muted-foreground">
                    Add-ons customers can select when booking this category.
                  </p>
                  {draft.pendingAddOnLinks.map((row) => {
                    const addOn = addOnCatalog.find((entry) => entry.id === row.addOnId)
                    return (
                      <div
                        key={row.addOnId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
                      >
                        <span className="text-sm font-semibold text-foreground">
                          {addOn?.name ?? row.addOnName ?? row.addOnId}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Free</Label>
                            <Switch
                              checked={row.isFree}
                              onCheckedChange={(value) =>
                                setDraft((previous) => ({
                                  ...previous,
                                  pendingAddOnLinks: previous.pendingAddOnLinks.map((entry) =>
                                    entry.addOnId === row.addOnId
                                      ? { ...entry, isFree: value }
                                      : entry,
                                  ),
                                }))
                              }
                            />
                          </div>
                          {!row.isFree && addOn ? (
                            <Badge variant="secondary">{formatPrice(addOn.price)}</Badge>
                          ) : null}
                          <Badge variant="outline">{`Qty ${row.quantity}`}</Badge>
                          <Badge variant="outline">{`$${row.unitPrice}`}</Badge>
                          <Badge variant="outline">
                            {
                              CATEGORY_ADD_ON_CHARGE_FREQUENCIES.find(
                                (option) => option.value === row.chargeFrequency,
                              )?.label
                            }
                          </Badge>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() =>
                              setDraft((previous) => ({
                                ...previous,
                                pendingAddOnLinks: previous.pendingAddOnLinks.filter(
                                  (entry) => entry.addOnId !== row.addOnId,
                                ),
                              }))
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )
                  })}

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Select value={newAddOnId} onValueChange={setNewAddOnId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Link add-on" />
                      </SelectTrigger>
                      <SelectContent>
                        {addOnCatalog
                          .filter(
                            (addOn) =>
                              !draft.pendingAddOnLinks.some((entry) => entry.addOnId === addOn.id),
                          )
                          .map((addOn) => (
                            <SelectItem key={addOn.id} value={addOn.id}>
                              {addOn.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={openAddOnModal}
                      disabled={!newAddOnId}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex items-center justify-end gap-2">
            <Button asChild type="button" variant="outline">
              <Link href={returnTo}>Cancel</Link>
            </Button>
            <Button type="button" onClick={handleCreateCategory}>
              {`Create ${LABELS.serviceCategory.toLowerCase()}`}
            </Button>
          </div>
        </CardContent>
      </Card>

      <CrudModal
        open={addOnModalOpen}
        onOpenChange={setAddOnModalOpen}
        title="Link add-on"
        description={
          selectedAddOnForModal
            ? `Configure how "${selectedAddOnForModal.name}" is priced for this category.`
            : 'Configure how this add-on is priced for this category.'
        }
        size="sm"
        variant="create"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setAddOnModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmAddOnLink}>
              Add
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Add-on</Label>
            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm font-medium">
              {selectedAddOnForModal?.name ?? 'Select an add-on first'}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-addon-quantity">Quantity</Label>
            <Input
              id="link-addon-quantity"
              type="number"
              min={1}
              value={pendingAddOnQuantity}
              onChange={(event) => setPendingAddOnQuantity(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-addon-price">Price</Label>
            <Input
              id="link-addon-price"
              type="number"
              min={0}
              step="0.01"
              value={pendingAddOnUnitPrice}
              disabled={pendingAddOnIsFree}
              onChange={(event) => setPendingAddOnUnitPrice(event.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
            <span className="text-sm font-medium text-foreground">Free</span>
            <Switch
              checked={pendingAddOnIsFree}
              onCheckedChange={(value) => setPendingAddOnIsFree(value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Charge frequency</Label>
            <Select
              value={pendingAddOnChargeFrequency}
              onValueChange={(value) => setPendingAddOnChargeFrequency(value as CategoryAddOnChargeFrequency)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_ADD_ON_CHARGE_FREQUENCIES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CrudModal>
    </div>
  )
}

export default function AdminSchedulingCategoryNewPage() {
  return (
    <Suspense>
      <AdminSchedulingCategoryNewPageInner />
    </Suspense>
  )
}
