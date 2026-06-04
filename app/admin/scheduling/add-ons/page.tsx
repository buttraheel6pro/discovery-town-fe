/** Admin operations add-ons page with CRUD and product de-link controls. */
'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'

import { AddOnTypePickerModal } from '@/components/admin/add-on-type-picker-modal'
import { ComplexAddOnEditorModal } from '@/components/admin/complex-add-on-editor-modal'
import { CrudModal } from '@/components/admin/crud-modal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { isComplexAddOn, resolveAddOnStructureType } from '@/lib/add-on-structure'
import { useInventory } from '@/lib/inventory-store'
import { formatPrice } from '@/lib/utils'
import type { AddOn } from '@/lib/types'

interface AddOnDraft {
  readonly name: string
  readonly description: string
  readonly pricingType: AddOn['pricingType']
  readonly price: string
  readonly memberPrice: string
  readonly isActive: boolean
  readonly inventoryProductId: string
}

const EMPTY_DRAFT: AddOnDraft = {
  name: '',
  description: '',
  pricingType: 'FLAT',
  price: '',
  memberPrice: '',
  isActive: true,
  inventoryProductId: 'none',
}

function addOnToDraft(addOn: AddOn): AddOnDraft {
  return {
    name: addOn.name,
    description: addOn.description ?? '',
    pricingType: addOn.pricingType,
    price: String(addOn.price),
    memberPrice: addOn.memberPrice != null ? String(addOn.memberPrice) : '',
    isActive: addOn.isActive,
    inventoryProductId: addOn.inventoryProductId ?? 'none',
  }
}

export default function AdminSchedulingAddOnsPage() {
  const {
    bookingAddOns,
    products,
    updateProduct,
    createBookingAddOn,
    updateBookingAddOn,
    deleteBookingAddOn,
    delinkBookingAddOnFromProduct,
  } = useInventory()

  const [typePickerOpen, setTypePickerOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [complexModalOpen, setComplexModalOpen] = useState(false)
  const [complexModalMode, setComplexModalMode] = useState<'create' | 'edit'>('create')
  const [complexEditTarget, setComplexEditTarget] = useState<AddOn | null>(null)
  const [editTarget, setEditTarget] = useState<AddOn | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AddOn | null>(null)
  const [draft, setDraft] = useState<AddOnDraft>(EMPTY_DRAFT)
  const [search, setSearch] = useState('')
  const [showOnlyActive, setShowOnlyActive] = useState(true)
  const [showOnlyLinkedToProducts, setShowOnlyLinkedToProducts] = useState(false)

  const productById = useMemo(() => {
    const map = new Map<string, (typeof products)[number]>()
    for (const product of products) {
      map.set(product.id, product)
    }
    return map
  }, [products])

  const linkableProducts = useMemo(() => {
    return products
      .filter((product) => !product.linkedAddOnId)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [products])

  const sortedAddOns = useMemo(() => {
    return bookingAddOns.slice().sort((a, b) => a.name.localeCompare(b.name))
  }, [bookingAddOns])
  const filteredAddOns = useMemo(() => {
    const query = search.trim().toLowerCase()
    return sortedAddOns.filter((addOn) => {
      const linkedProduct = addOn.inventoryProductId
        ? (productById.get(addOn.inventoryProductId) ?? null)
        : null
      if (showOnlyActive && !addOn.isActive) {
        return false
      }
      if (showOnlyLinkedToProducts && !linkedProduct) {
        return false
      }
      if (!query) {
        return true
      }
      const haystack = `${addOn.name} ${addOn.description ?? ''}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [productById, search, showOnlyActive, showOnlyLinkedToProducts, sortedAddOns])

  function openCreateModal(): void {
    setTypePickerOpen(true)
  }

  function openSimpleCreateModal(): void {
    setDraft(EMPTY_DRAFT)
    setTypePickerOpen(false)
    setCreateOpen(true)
  }

  function openComplexCreateModal(): void {
    setTypePickerOpen(false)
    setComplexEditTarget(null)
    setComplexModalMode('create')
    setComplexModalOpen(true)
  }

  function openEditModal(addOn: AddOn): void {
    if (isComplexAddOn(addOn)) {
      setComplexEditTarget(addOn)
      setComplexModalMode('edit')
      setComplexModalOpen(true)
      return
    }
    setEditTarget(addOn)
    setDraft(addOnToDraft(addOn))
  }

  function persistCreate(): void {
    const parsedPrice = Number.parseFloat(draft.price)
    const parsedMemberPrice = draft.memberPrice.trim()
      ? Number.parseFloat(draft.memberPrice.trim())
      : null
    if (!draft.name.trim() || !Number.isFinite(parsedPrice)) {
      return
    }
    const created = createBookingAddOn({
      name: draft.name.trim(),
      description: draft.description.trim() || undefined,
      pricingType: draft.pricingType,
      price: parsedPrice,
      memberPrice: Number.isFinite(parsedMemberPrice ?? Number.NaN) ? parsedMemberPrice : null,
      isActive: draft.isActive,
      referenceType: draft.inventoryProductId === 'none' ? 'ALL' : 'PRODUCT',
      inventoryProductId: draft.inventoryProductId === 'none' ? null : draft.inventoryProductId,
      structureType: 'SIMPLE',
    })
    if (draft.inventoryProductId !== 'none') {
      updateProduct(draft.inventoryProductId, {
        linkedAddOnId: created.id,
        canBeAddOn: true,
      })
    }
    setCreateOpen(false)
  }

  function persistEdit(): void {
    if (!editTarget) {
      return
    }
    const parsedPrice = Number.parseFloat(draft.price)
    const parsedMemberPrice = draft.memberPrice.trim()
      ? Number.parseFloat(draft.memberPrice.trim())
      : null
    if (!draft.name.trim() || !Number.isFinite(parsedPrice)) {
      return
    }
    updateBookingAddOn(editTarget.id, {
      name: draft.name.trim(),
      description: draft.description.trim() || undefined,
      pricingType: draft.pricingType,
      price: parsedPrice,
      memberPrice: Number.isFinite(parsedMemberPrice ?? Number.NaN) ? parsedMemberPrice : null,
      isActive: draft.isActive,
    })
    setEditTarget(null)
  }

  function confirmDelete(): void {
    if (!deleteTarget) {
      return
    }
    deleteBookingAddOn(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Add-ons</h1>
          <p className="mt-2 text-muted-foreground">
            Manage add-on catalog entries used by scheduling and linked inventory products.
          </p>
        </div>
        <Button onClick={openCreateModal}>New add-on</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operations add-ons</CardTitle>
          <CardDescription>{`${filteredAddOns.length} add-ons`}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or SKU..."
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Active only</span>
                <Switch checked={showOnlyActive} onCheckedChange={setShowOnlyActive} />
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <span className="text-sm font-semibold text-foreground">Linked add-ons only</span>
                <Switch
                  checked={showOnlyLinkedToProducts}
                  onCheckedChange={setShowOnlyLinkedToProducts}
                />
              </div>
            </div>
          </div>

          {filteredAddOns.map((addOn) => {
            const linkedProduct = addOn.inventoryProductId
              ? productById.get(addOn.inventoryProductId) ?? null
              : null
            const imageUrl = linkedProduct?.imageUrl?.trim() || '/placeholder.svg'
            return (
              <div
                key={addOn.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {linkedProduct ? (
                    <div className="relative h-11 w-11 overflow-hidden rounded-lg border border-border bg-muted/20">
                      <Image
                        src={imageUrl}
                        alt={linkedProduct.name}
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                    </div>
                  ) : null}
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{addOn.name}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatPrice(addOn.memberPrice ?? addOn.price)}</span>
                      <Badge variant="outline">{addOn.pricingType}</Badge>
                      <Badge variant="outline">
                        {resolveAddOnStructureType(addOn) === 'COMPLEX' ? 'Complex' : 'Simple'}
                      </Badge>
                      <Badge variant={addOn.isActive ? 'secondary' : 'outline'}>
                        {addOn.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {linkedProduct ? (
                        <Badge variant="outline">{`Linked product: ${linkedProduct.name}`}</Badge>
                      ) : (
                        <Badge variant="outline">Not linked to product</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {linkedProduct ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => delinkBookingAddOnFromProduct(addOn.id)}
                    >
                      De-link product
                    </Button>
                  ) : null}
                  <Button type="button" size="sm" variant="outline" onClick={() => openEditModal(addOn)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    onClick={() => setDeleteTarget(addOn)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )
          })}
          {filteredAddOns.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
              No add-ons match the current filters.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <AddOnTypePickerModal
        open={typePickerOpen}
        onOpenChange={setTypePickerOpen}
        onSelectSimple={openSimpleCreateModal}
        onSelectComplex={openComplexCreateModal}
      />

      <ComplexAddOnEditorModal
        open={complexModalOpen}
        onOpenChange={setComplexModalOpen}
        mode={complexModalMode}
        editAddOn={complexModalMode === 'edit' ? complexEditTarget : null}
      />

      <CrudModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New simple add-on"
        description="Create an add-on that can be used by booking and operations flows."
        size="sm"
        variant="create"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={persistCreate}>
              Create
            </Button>
          </>
        }
      >
        <AddOnForm draft={draft} onChange={setDraft} linkableProducts={linkableProducts} />
      </CrudModal>

      <CrudModal
        open={editTarget != null}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null)
          }
        }}
        title="Edit simple add-on"
        description={editTarget?.name ?? ''}
        size="sm"
        variant="edit"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={persistEdit}>
              Save
            </Button>
          </>
        }
      >
        <AddOnForm draft={draft} onChange={setDraft} linkableProducts={[]} disableProductLink />
      </CrudModal>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete add-on?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting an add-on also de-links it from any inventory product currently linked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface AddOnFormProps {
  readonly draft: AddOnDraft
  readonly onChange: (next: AddOnDraft) => void
  readonly linkableProducts: Array<{ id: string; name: string }>
  readonly disableProductLink?: boolean
}

function AddOnForm({ draft, onChange, linkableProducts, disableProductLink = false }: Readonly<AddOnFormProps>) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="add-on-name">Name</Label>
        <Input
          id="add-on-name"
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="add-on-description">Description</Label>
        <Textarea
          id="add-on-description"
          rows={2}
          value={draft.description}
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Pricing type</Label>
          <Select
            value={draft.pricingType}
            onValueChange={(value) => onChange({ ...draft, pricingType: value as AddOn['pricingType'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FLAT">Flat</SelectItem>
              <SelectItem value="PER_PERSON">Per person</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="add-on-price">Price</Label>
          <Input
            id="add-on-price"
            type="number"
            min={0}
            step="0.01"
            value={draft.price}
            onChange={(event) => onChange({ ...draft, price: event.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="add-on-member-price">Member price (optional)</Label>
        <Input
          id="add-on-member-price"
          type="number"
          min={0}
          step="0.01"
          value={draft.memberPrice}
          onChange={(event) => onChange({ ...draft, memberPrice: event.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Linked inventory product (optional)</Label>
        <Select
          value={draft.inventoryProductId}
          onValueChange={(value) => onChange({ ...draft, inventoryProductId: value })}
          disabled={disableProductLink}
        >
          <SelectTrigger>
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {linkableProducts.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
        <Label htmlFor="add-on-active">Active</Label>
        <Switch
          id="add-on-active"
          checked={draft.isActive}
          onCheckedChange={(value) => onChange({ ...draft, isActive: value })}
        />
      </div>
    </div>
  )
}
