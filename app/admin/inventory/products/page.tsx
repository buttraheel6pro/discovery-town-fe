/** Admin inventory products — list, filter, create/edit, and stock adjustments. */
'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, GripVertical, MoreHorizontal, Plus, Search, SlidersHorizontal } from 'lucide-react'

import { CrudModal } from '@/components/admin/crud-modal'
import { CSVImportModal } from '@/components/admin/csv-import-modal'
import { StockAdjustmentModal } from '@/components/admin/stock-adjustment-modal'
import { StockStatusBadge } from '@/components/admin/stock-status-badge'
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'
import { useInventory } from '@/lib/inventory-store'
import { isAdminApiReady } from '@/lib/api/client'
import {
  createProductCategory as createProductCategoryApi,
  updateProductCategory as updateProductCategoryApi,
  deleteProductCategory as deleteProductCategoryApi,
} from '@/lib/services/inventory'
import type { Product, ProductCategory } from '@/lib/types'

function toDisplayType(value: string): string {
  return value
    .split('&')
    .map((part) =>
      part
        .split(' ')
        .map((word) =>
          word.length > 0 ? `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}` : word,
        )
        .join(' '),
    )
    .join(' & ')
}

export default function AdminInventoryProductsPage() {
  const { toast } = useToast()
  const {
    products,
    productCategories,
    updateProduct,
    promoteProductToAddOn,
    delinkBookingAddOnFromProduct,
    addProductCategory,
    updateProductCategory,
    deleteProductCategory,
  } = useInventory()

  const categories = useMemo(
    () => productCategories.slice().sort((a, b) => a.displayOrder - b.displayOrder),
    [productCategories],
  )

  const categoryById = useMemo(() => {
    const m = new Map<string, (typeof categories)[number]>()
    for (const c of categories) {
      m.set(c.id, c)
    }
    return m
  }, [categories])

  const productTypeTree = useMemo(() => {
    const top = categories
      .filter((c) => c.parentId == null || c.parentId === '')
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
    const grouped = new Map<
      string,
      {
        productType: string
        categories: Array<(typeof categories)[number]>
      }
    >()
    for (const t of top) {
      const key = (t.productType ?? 'shop').toLowerCase()
      const group = grouped.get(key) ?? { productType: key, categories: [] }
      group.categories.push(t)
      grouped.set(key, group)
    }
    return Array.from(grouped.values()).sort((a, b) => a.productType.localeCompare(b.productType))
  }, [categories])
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [categoryFormOpen, setCategoryFormOpen] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [categoryIsActive, setCategoryIsActive] = useState(true)
  const [categoryParentId, setCategoryParentId] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null)
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<ProductCategory | null>(null)
  const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(null)
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [showOnlyActive, setShowOnlyActive] = useState(true)
  const [showOnlyAddOns, setShowOnlyAddOns] = useState(false)

  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const countableProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      if (showOnlyActive && !p.isActive) return false
      if (showOnlyAddOns && !p.linkedAddOnId) return false
      if (!q) return true
      const hay = `${p.name} ${(p.sku ?? '')}`.toLowerCase()
      return hay.includes(q)
    })
  }, [products, search, showOnlyActive, showOnlyAddOns])

  const filtered = useMemo(() => {
    const allowedCategoryIds = new Set<string>()
    if (categoryId) {
      const stack = [categoryId]
      while (stack.length > 0) {
        const id = stack.pop()!
        if (allowedCategoryIds.has(id)) continue
        allowedCategoryIds.add(id)
        for (const c of categories) {
          if ((c.parentId ?? null) === id) {
            stack.push(c.id)
          }
        }
      }
    }
    return countableProducts.filter((p) => {
      if (categoryId && !allowedCategoryIds.has(p.categoryId)) return false
      return true
    })
  }, [categories, categoryId, countableProducts])

  function categoryLabelForProduct(product: Product): string {
    const selected = categoryById.get(product.categoryId)
    if (!selected) return '—'
    const parent = selected.parentId ? categoryById.get(selected.parentId) : null
    return parent ? `${parent.name} › ${selected.name}` : selected.name
  }

  const catalogTitle = useMemo(() => {
    if (!categoryId) {
      return 'Catalog'
    }
    return categoryById.get(categoryId)?.name ?? 'Catalog'
  }, [categoryId, categoryById])

  const topLevelCategoryCount = useMemo(() => {
    return categories.filter((category) => category.parentId == null || category.parentId === '').length
  }, [categories])

  const catalogCountLabel = useMemo(() => {
    if (categoryId) {
      return `${filtered.length} products`
    }
    return `${topLevelCategoryCount}/${countableProducts.length} products`
  }, [categoryId, filtered.length, topLevelCategoryCount, countableProducts.length])

  const allCountLabel = useMemo(() => {
    return `${topLevelCategoryCount}/${countableProducts.length}`
  }, [topLevelCategoryCount, countableProducts.length])

  function promoteFromRow(product: Product) {
    if (product.linkedAddOnId) return
    const result = promoteProductToAddOn(product.id, product)
    if (!result.ok) {
      toast({ title: 'Add-on link failed', description: result.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Linked as add-on', description: `${product.name} is now available as add-on.` })
  }

  function delinkFromRow(product: Product) {
    if (!product.linkedAddOnId) return
    delinkBookingAddOnFromProduct(product.linkedAddOnId)
    toast({ title: 'Add-on de-linked', description: `${product.name} is no longer linked as add-on.` })
  }

  function openSubCategoryCreate(parentId: string) {
    const parent = categories.find((entry) => entry.id === parentId)
    if (!parent) return
    setEditingCategory(null)
    setCategoryName('')
    setCategoryIsActive(true)
    setCategoryParentId(parent.id)
    setCategoryFormOpen(true)
  }

  function openSubCategoryEdit(category: ProductCategory) {
    setEditingCategory(category)
    setCategoryName(category.name)
    setCategoryIsActive(category.isActive)
    setCategoryParentId(category.parentId ?? null)
    setCategoryFormOpen(true)
  }

  async function persistCategory() {
    const trimmedName = categoryName.trim()
    if (!trimmedName || !categoryParentId) {
      return
    }
    const parent = categories.find((entry) => entry.id === categoryParentId)
    if (!parent) {
      return
    }

    if (editingCategory) {
      updateProductCategory(editingCategory.id, {
        name: trimmedName,
        isActive: categoryIsActive,
      })
      if (isAdminApiReady()) {
        updateProductCategoryApi(editingCategory.id, { name: trimmedName, isActive: categoryIsActive }).catch(() => {
          toast({ title: 'Sync error', description: 'Category update failed to save.', variant: 'destructive' })
        })
      }
    } else {
      let catId: string | undefined
      if (isAdminApiReady()) {
        try {
          const saved = await createProductCategoryApi({
            name: trimmedName,
            parentId: categoryParentId,
            isActive: categoryIsActive,
            productType: parent.productType ?? 'shop',
          })
          catId = saved.id
        } catch {
          toast({ title: 'Save failed', description: 'Could not create category.', variant: 'destructive' })
          return
        }
      }
      addProductCategory({
        ...(catId ? { id: catId } : {}),
        name: trimmedName,
        productType: parent.productType ?? 'shop',
        parentId: categoryParentId,
        isActive: categoryIsActive,
      })
    }
    setCategoryFormOpen(false)
    setEditingCategory(null)
  }

  async function confirmDeleteCategory() {
    if (!deleteCategoryTarget) return
    if (isAdminApiReady()) {
      try {
        await deleteProductCategoryApi(deleteCategoryTarget.id)
      } catch {
        toast({ title: 'Delete failed', description: 'Could not delete category.', variant: 'destructive' })
        setDeleteCategoryTarget(null)
        return
      }
    }
    const result = deleteProductCategory(deleteCategoryTarget.id)
    if (!result.ok) {
      toast({ title: 'Cannot delete', description: result.message, variant: 'destructive' })
    }
    setDeleteCategoryTarget(null)
  }

  function reorderSubCategoriesByDrag(parentId: string, sourceId: string, targetId: string) {
    if (sourceId === targetId) return
    const siblings = categories
      .filter((entry) => (entry.parentId ?? null) === parentId)
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
    const sourceIndex = siblings.findIndex((entry) => entry.id === sourceId)
    const targetIndex = siblings.findIndex((entry) => entry.id === targetId)
    if (sourceIndex < 0 || targetIndex < 0) return

    const reordered = siblings.slice()
    const [moved] = reordered.splice(sourceIndex, 1)
    if (!moved) return
    reordered.splice(targetIndex, 0, moved)

    const orderedDisplaySlots = siblings
      .map((entry) => entry.displayOrder)
      .slice()
      .sort((a, b) => a - b)

    reordered.forEach((entry, index) => {
      const nextDisplayOrder = orderedDisplaySlots[index] ?? index + 1
      if (entry.displayOrder !== nextDisplayOrder) {
        updateProductCategory(entry.id, { displayOrder: nextDisplayOrder })
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Catalog</h1>
          <p className="text-muted-foreground mt-2">Manage products, categories, and booking add-on links.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            Import CSV
          </Button>
          <Link href="/admin/inventory/products/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New product
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Categories</CardTitle>
            <CardDescription>
              Accordion by product type, category, and sub-category.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button
              type="button"
              onClick={() => setCategoryId(null)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                categoryId === null ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'bg-card hover:bg-secondary'
              }`}
            >
              All
              <span
                className={`float-right text-xs ${
                  categoryId === null
                    ? 'text-sidebar-accent-foreground/95'
                    : 'text-muted-foreground'
                }`}
              >
                {allCountLabel}
              </span>
            </button>
            <Accordion type="multiple" className="w-full space-y-2">
              {productTypeTree.map((group) => {
                const groupItems = showOnlyAddOns
                  ? group.categories.filter((top) =>
                      countableProducts.some((p) => {
                        if (p.categoryId === top.id) return true
                        return categories.some(
                          (c) => (c.parentId ?? null) === top.id && c.id === p.categoryId,
                        )
                      }),
                    )
                  : group.categories
                if (groupItems.length === 0) return null
                const groupCount = countableProducts.filter((product) =>
                  groupItems.some((top) => {
                    if (product.categoryId === top.id) return true
                    return categories.some(
                      (category) =>
                        (category.parentId ?? null) === top.id && category.id === product.categoryId,
                    )
                  }),
                ).length
                return (
                  <AccordionItem
                    key={group.productType}
                    value={group.productType}
                    className="overflow-hidden rounded-lg border border-border bg-muted/20 px-3"
                  >
                    <AccordionTrigger className="py-3 text-sm font-semibold text-foreground hover:no-underline">
                      <span className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                          Type
                        </Badge>
                        <span>{toDisplayType(group.productType)}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {groupCount}
                        </Badge>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 pb-3">
                      {groupItems.map((top) => {
                        const subRows = categories
                          .filter((c) => (c.parentId ?? null) === top.id)
                          .slice()
                          .sort((a, b) => a.displayOrder - b.displayOrder)
                        return (
                          <div key={top.id} className="rounded-md border border-border bg-card p-2 shadow-sm">
                            <div className="flex justify-end px-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1 text-xs"
                                onClick={() => openSubCategoryCreate(top.id)}
                              >
                                <Plus className="h-3.5 w-3.5" />
                                New sub-category
                              </Button>
                            </div>
                            <div className="mt-2 space-y-1 pl-2">
                              {subRows.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No sub-categories yet.</p>
                              ) : null}
                              {subRows.map((sub) => {
                                const subCount = countableProducts.filter(
                                  (p) => p.categoryId === sub.id,
                                ).length
                                if (showOnlyAddOns && subCount === 0) return null
                                const active = categoryId === sub.id
                                return (
                                  <div
                                    key={sub.id}
                                    draggable
                                    onDragStart={() => {
                                      setDraggingCategoryId(sub.id)
                                      setDragOverCategoryId(sub.id)
                                    }}
                                    onDragEnter={(event) => {
                                      event.preventDefault()
                                      setDragOverCategoryId(sub.id)
                                    }}
                                    onDragOver={(event) => {
                                      event.preventDefault()
                                      if (dragOverCategoryId !== sub.id) {
                                        setDragOverCategoryId(sub.id)
                                      }
                                    }}
                                    onDrop={(event) => {
                                      event.preventDefault()
                                      if (!draggingCategoryId) return
                                      if (
                                        (categories.find((entry) => entry.id === draggingCategoryId)?.parentId ??
                                          null) !== top.id
                                      ) {
                                        return
                                      }
                                      reorderSubCategoriesByDrag(top.id, draggingCategoryId, sub.id)
                                      setDraggingCategoryId(null)
                                      setDragOverCategoryId(null)
                                    }}
                                    onDragEnd={() => {
                                      setDraggingCategoryId(null)
                                      setDragOverCategoryId(null)
                                    }}
                                    className={`w-full rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors ${
                                      dragOverCategoryId === sub.id && draggingCategoryId !== sub.id
                                        ? 'bg-accent/10'
                                        : ''
                                    } ${
                                      active
                                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                    }`}
                                  >
                                    <div className="flex min-w-0 items-center gap-1.5">
                                      <span className="cursor-grab text-muted-foreground/90">
                                        <GripVertical className="h-3.5 w-3.5" />
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setCategoryId(sub.id)}
                                        className="min-w-0 flex-1 text-left"
                                      >
                                        <span className="block truncate">{sub.name}</span>
                                      </button>
                                      <Badge
                                        variant="outline"
                                        className={`h-5 shrink-0 text-[10px] ${
                                          active
                                            ? 'border-sidebar-accent-foreground/30 bg-sidebar-accent/40 text-sidebar-accent-foreground'
                                            : ''
                                        }`}
                                      >
                                        {subCount}
                                      </Badge>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 shrink-0"
                                            aria-label={`${sub.name} actions`}
                                          >
                                            <MoreHorizontal className="h-3.5 w-3.5" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onSelect={() => openSubCategoryEdit(sub)}>
                                            Edit
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            variant="destructive"
                                            disabled={subCount > 0}
                                            onSelect={() => setDeleteCategoryTarget(sub)}
                                          >
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </CardContent>
        </Card>

        <Card className="lg:col-span-9">
          <CardHeader>
            <CardTitle className="text-base">{catalogTitle}</CardTitle>
            <CardDescription>{catalogCountLabel}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or SKU…"
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
                  <span className="text-sm font-semibold text-foreground">Add-ons only</span>
                  <Switch checked={showOnlyAddOns} onCheckedChange={setShowOnlyAddOns} />
                </div>
              </div>
            </div>

            <Separator />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Add-on</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const selectedCategory = categoryById.get(p.categoryId) ?? null
                  const topLevelCategory = selectedCategory?.parentId
                    ? (categoryById.get(selectedCategory.parentId) ?? null)
                    : selectedCategory
                  const isGiftCardProduct =
                    (topLevelCategory?.productType ?? '').toLowerCase() === 'gifts'

                  return (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-normal">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-muted/30">
                          <Image
                            src={p.imageUrl ?? '/placeholder.svg'}
                            alt={p.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link href={`/admin/inventory/products/${p.id}`} className="font-semibold text-foreground hover:underline">
                            {p.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">Stock: {p.stockCount}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.sku ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {categoryLabelForProduct(p)}
                    </TableCell>
                    <TableCell>
                      {p.linkedAddOnId ? (
                        <Badge className="gap-1 bg-emerald-600/10 text-emerald-700 dark:text-emerald-200">
                          <Check className="h-3.5 w-3.5" />
                          Linked
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not linked</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatPrice(p.memberPrice ?? p.price)}</TableCell>
                    <TableCell>
                      <StockStatusBadge product={p} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!isGiftCardProduct ? (
                          <Button variant="outline" size="sm" onClick={() => setAdjustProduct(p)}>
                            Stock
                          </Button>
                        ) : null}
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/inventory/products/${p.id}/edit?returnTo=${encodeURIComponent('/admin/inventory/products')}`}>
                            Edit
                          </Link>
                        </Button>
                        {!isGiftCardProduct ? (
                          <>
                            {p.linkedAddOnId ? (
                              <Button variant="outline" size="sm" onClick={() => delinkFromRow(p)}>
                                De-link
                              </Button>
                            ) : null}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={Boolean(p.linkedAddOnId)}
                              onClick={() => promoteFromRow(p)}
                            >
                              {p.linkedAddOnId ? 'Linked' : 'Link add-on'}
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <CrudModal
        open={categoryFormOpen}
        onOpenChange={(open) => {
          setCategoryFormOpen(open)
          if (!open) {
            setEditingCategory(null)
          }
        }}
        title={editingCategory ? 'Edit sub-category' : 'New sub-category'}
        description={
          editingCategory
            ? 'Update sub-category name and customer visibility.'
            : 'Create a sub-category under the selected category.'
        }
        size="sm"
        variant={editingCategory ? 'edit' : 'create'}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setCategoryFormOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={persistCategory}
              disabled={!categoryParentId || categoryName.trim().length === 0}
            >
              {editingCategory ? 'Save' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Parent:{' '}
            <span className="font-semibold text-foreground">
              {categories.find((entry) => entry.id === categoryParentId)?.name ?? '—'}
            </span>
          </p>
          <Input
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            placeholder="Sub-category name"
          />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Active</span>
            <Switch
              checked={categoryIsActive}
              onCheckedChange={setCategoryIsActive}
              aria-label="Sub-category active"
            />
          </div>
        </div>
      </CrudModal>

      <AlertDialog
        open={deleteCategoryTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteCategoryTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete sub-category?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCategoryTarget
                ? `This will permanently remove “${deleteCategoryTarget.name}”.`
                : 'This will permanently remove the selected sub-category.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={confirmDeleteCategory}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {adjustProduct ? (
        <StockAdjustmentModal product={adjustProduct} open={true} onClose={() => setAdjustProduct(null)} />
      ) : null}

      <CSVImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}

