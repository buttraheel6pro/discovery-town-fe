/** Admin product category CRUD — two-panel top-level and sub-category lists (inventory store). */
'use client'

import { useMemo, useState } from 'react'

import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useInventory } from '@/lib/inventory-store'
import { cn } from '@/lib/utils'
import type { ProductCategory } from '@/lib/types'

const PRODUCT_TYPE_SUGGESTIONS = ['shop', 'cafe&food', 'gifts', 'rentals'] as const

function slugifyLocal(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function countProductsInCategoryTree(
  rootId: string,
  allCategories: ProductCategory[],
  productCategoryIds: readonly string[],
): number {
  const reachable = new Set<string>()
  function walk(id: string) {
    reachable.add(id)
    for (const c of allCategories) {
      if ((c.parentId ?? null) === id) {
        walk(c.id)
      }
    }
  }
  walk(rootId)
  return productCategoryIds.filter((cid) => reachable.has(cid)).length
}

interface CategoryRowActionsProps {
  readonly moveUpLabel: string
  readonly moveDownLabel: string
  readonly editLabel: string
  readonly deleteLabel: string
  readonly onMoveUp: () => void
  readonly onMoveDown: () => void
  readonly onEdit: () => void
  readonly onDelete: () => void
  readonly disableMoveUp?: boolean
  readonly disableMoveDown?: boolean
  readonly disableDelete?: boolean
}

export function CategoryRowActions({
  moveUpLabel,
  moveDownLabel,
  editLabel,
  deleteLabel,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  disableMoveUp = false,
  disableMoveDown = false,
  disableDelete = false,
}: Readonly<CategoryRowActionsProps>) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label={moveUpLabel}
        disabled={disableMoveUp}
        onClick={onMoveUp}
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label={moveDownLabel}
        disabled={disableMoveDown}
        onClick={onMoveDown}
      >
        <ArrowDown className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label={editLabel}
        onClick={onEdit}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive"
        aria-label={deleteLabel}
        disabled={disableDelete}
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function ProductCategoryManager() {
  const { toast } = useToast()
  const {
    products,
    productCategories,
    addProductCategory,
    updateProductCategory,
    deleteProductCategory,
    reorderProductCategory,
  } = useInventory()

  const productCategoryIds = useMemo(
    () => products.map((p) => p.categoryId),
    [products],
  )

  const topLevel = useMemo(() => {
    return productCategories
      .filter((c) => c.parentId == null || c.parentId === '')
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
  }, [productCategories])

  const [selectedTopId, setSelectedTopId] = useState<string | null>(null)

  const effectiveTopId = selectedTopId ?? topLevel[0]?.id ?? null

  const subCategories = useMemo(() => {
    if (!effectiveTopId) return []
    return productCategories
      .filter((c) => (c.parentId ?? null) === effectiveTopId)
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
  }, [effectiveTopId, productCategories])

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ProductCategory | null>(null)
  const [formName, setFormName] = useState('')
  const [formProductType, setFormProductType] = useState('shop')
  const [formParentId, setFormParentId] = useState<string>('__top__')
  const [deleteTarget, setDeleteTarget] = useState<ProductCategory | null>(null)
  const formParentCategory = useMemo(
    () => productCategories.find((c) => c.id === formParentId) ?? null,
    [formParentId, productCategories],
  )
  const formIsSubCategory = formParentId !== '__top__'
  const formEffectiveProductType = formIsSubCategory
    ? formParentCategory?.productType ?? 'shop'
    : formProductType.trim().toLowerCase()
  const productTypeOptions = useMemo(() => {
    const out = new Set<string>(PRODUCT_TYPE_SUGGESTIONS)
    for (const c of productCategories) {
      if (c.productType?.trim()) {
        out.add(c.productType.trim().toLowerCase())
      }
    }
    return Array.from(out.values()).sort()
  }, [productCategories])

  function openCreate(parentIsSub: boolean) {
    setEditing(null)
    setFormName('')
    setFormProductType('shop')
    setFormParentId(parentIsSub && effectiveTopId ? effectiveTopId : '__top__')
    setFormOpen(true)
  }

  function openEdit(c: ProductCategory) {
    setEditing(c)
    setFormName(c.name)
    setFormProductType(c.productType ?? 'shop')
    const parent = c.parentId ?? null
    setFormParentId(parent ? parent : '__top__')
    setFormOpen(true)
  }

  function persistForm() {
    const trimmed = formName.trim()
    const normalizedType = formEffectiveProductType.trim().toLowerCase()
    if (!trimmed) {
      toast({ title: 'Name required', variant: 'destructive' })
      return
    }
    if (!normalizedType) {
      toast({ title: 'Product type required', variant: 'destructive' })
      return
    }
    const parentVal = formParentId === '__top__' ? null : formParentId
    if (editing) {
      const slug = slugifyLocal(trimmed) || editing.id
      updateProductCategory(editing.id, {
        name: trimmed,
        parentId: parentVal,
        productType: normalizedType,
        slug,
      })
    } else {
      addProductCategory({ name: trimmed, productType: normalizedType, parentId: parentVal })
    }
    setFormOpen(false)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    const result = deleteProductCategory(deleteTarget.id)
    if (!result.ok) {
      toast({ title: 'Cannot delete', description: result.message, variant: 'destructive' })
    }
    setDeleteTarget(null)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <Card className="lg:col-span-4">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="text-base">Top-level categories</CardTitle>
            <CardDescription>Shop departments (parent groups).</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {topLevel.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories yet.</p>
          ) : (
            topLevel.map((c) => {
              const count = countProductsInCategoryTree(c.id, productCategories, productCategoryIds)
              const active = c.id === effectiveTopId
              return (
                <div
                  key={c.id}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-2 py-2',
                    active ? 'border-accent bg-accent/5' : 'border-border bg-card',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedTopId(c.id)}
                    className="min-w-0 flex-1 text-left text-sm font-semibold text-foreground"
                  >
                    {c.name}
                    <Badge variant="secondary" className="ml-2 align-middle text-xs">
                      {count}
                    </Badge>
                    <Badge variant="outline" className="ml-2 align-middle text-[10px] uppercase">
                      {c.productType ?? 'shop'}
                    </Badge>
                  </button>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-8">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="text-base">Sub-categories</CardTitle>
            <CardDescription>
              {effectiveTopId
                ? `Under “${topLevel.find((t) => t.id === effectiveTopId)?.name ?? '—'}”.`
                : 'Select a top-level category.'}
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            className="gap-1"
            disabled={!effectiveTopId}
            onClick={() => openCreate(true)}
          >
            <Plus className="h-4 w-4" />
            New sub-category
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {!effectiveTopId ? (
            <p className="text-sm text-muted-foreground">Create a top-level category first.</p>
          ) : subCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sub-categories yet.</p>
          ) : (
            subCategories.map((c) => {
              const count = products.filter((p) => p.categoryId === c.id).length
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-2"
                >
                  <div className="min-w-0 flex-1 text-sm font-semibold text-foreground">
                    {c.name}
                    <Badge variant="secondary" className="ml-2 align-middle text-xs">
                      {count}
                    </Badge>
                    <Badge variant="outline" className="ml-2 align-middle text-[10px] uppercase">
                      {c.productType ?? 'shop'}
                    </Badge>
                  </div>
                  <CategoryRowActions
                    moveUpLabel="Move up"
                    moveDownLabel="Move down"
                    editLabel={`Edit ${c.name}`}
                    deleteLabel={`Delete ${c.name}`}
                    onMoveUp={() => reorderProductCategory(c.id, 'up')}
                    onMoveDown={() => reorderProductCategory(c.id, 'down')}
                    onEdit={() => openEdit(c)}
                    onDelete={() => setDeleteTarget(c)}
                  />
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <CrudModal
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? 'Edit category' : 'New category'}
        description={
          editing
            ? 'Update name or move under another top-level category.'
            : 'Add a top-level department or a sub-category.'
        }
        size="md"
        variant={editing ? 'edit' : 'create'}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={persistForm}>
              {editing ? 'Save' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pcat-name">Name</Label>
            <Input
              id="pcat-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Category name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pcat-product-type">Product type</Label>
            {formIsSubCategory ? (
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                <span className="font-medium text-foreground">
                  {formEffectiveProductType.toUpperCase()}
                </span>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sub-categories inherit product type from their parent category.
                </p>
              </div>
            ) : (
              <>
                <Input
                  id="pcat-product-type"
                  list="pcat-product-types"
                  value={formProductType}
                  onChange={(e) => setFormProductType(e.target.value)}
                  placeholder="shop"
                />
                <datalist id="pcat-product-types">
                  {productTypeOptions.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
                <p className="text-xs text-muted-foreground">
                  Select an existing type or type a new one to create it.
                </p>
              </>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pcat-parent">Category (optional parent)</Label>
            <Select value={formParentId} onValueChange={setFormParentId}>
              <SelectTrigger id="pcat-parent">
                <SelectValue placeholder="Top-level (no parent)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__top__">Top-level (no parent)</SelectItem>
                {topLevel
                  .filter((t) => (t.productType ?? 'shop') === formProductType.trim().toLowerCase())
                  .map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CrudModal>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will permanently remove “${deleteTarget.name}”. This cannot be undone.`
                : null}
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
