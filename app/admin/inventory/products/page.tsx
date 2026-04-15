/** Admin inventory products — list, filter, create/edit, and stock adjustments. */
'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, Plus, Search, SlidersHorizontal } from 'lucide-react'

import { CrudModal } from '@/components/admin/crud-modal'
import { CSVImportModal } from '@/components/admin/csv-import-modal'
import { ProductCategoryManager } from '@/components/admin/product-category-manager'
import {
  ProductForm,
  type ProductDraft,
  draftToProductPatch,
  productToDraft,
} from '@/components/admin/product-form'
import { StockAdjustmentModal } from '@/components/admin/stock-adjustment-modal'
import { StockStatusBadge } from '@/components/admin/stock-status-badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'
import { useInventory } from '@/lib/inventory-store'
import type { Product } from '@/lib/types'

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

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
  const { products, productCategories, bookingAddOns, addProduct, updateProduct, promoteProductToAddOn } =
    useInventory()

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

  const [search, setSearch] = useState('')
  const [showOnlyActive, setShowOnlyActive] = useState(true)
  const [showOnlyAddOns, setShowOnlyAddOns] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const [draft, setDraft] = useState<ProductDraft>(() =>
    productToDraft(
      {
        id: 'new',
        tenantId: 'tenant-1',
        categoryId: categories[0]?.id ?? '',
        name: '',
        slug: '',
        description: '',
        sku: undefined,
        price: 0,
        memberPrice: undefined,
        stockCount: 0,
        lowStockThreshold: 10,
        allowBackorders: false,
        isActive: true,
        isFeatured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      categories,
    ),
  )

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
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      if (showOnlyActive && !p.isActive) return false
      if (showOnlyAddOns && !p.linkedAddOnId) return false
      if (categoryId && !allowedCategoryIds.has(p.categoryId)) return false
      if (!q) return true
      const hay = `${p.name} ${(p.sku ?? '')}`.toLowerCase()
      return hay.includes(q)
    })
  }, [categories, categoryId, products, search, showOnlyActive, showOnlyAddOns])

  function openCreate() {
    setDraft(
      productToDraft(
        {
          id: 'new',
          tenantId: 'tenant-1',
          categoryId: categoryId ?? categories[0]?.id ?? '',
          name: '',
          slug: '',
          description: '',
          sku: undefined,
          price: 0,
          memberPrice: undefined,
          stockCount: 0,
          lowStockThreshold: 10,
          allowBackorders: false,
          isActive: true,
          isFeatured: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        categories,
      ),
    )
    setCreateOpen(true)
  }

  function persistCreate() {
    const wantsPromote = draft.canBeAddOn
    const patch = draftToProductPatch(draft)
    const nowIso = new Date().toISOString()
    const id = `prod-admin-${Date.now()}`
    const created: Product = {
      id,
      tenantId: 'tenant-1',
      categoryId: patch.categoryId ?? categories[0]?.id ?? '',
      name: patch.name ?? 'New product',
      slug: slugify(patch.name ?? '') || id,
      description: patch.description,
      sku: patch.sku,
      price: patch.price ?? 0,
      memberPrice: patch.memberPrice,
      costPrice: patch.costPrice,
      compareAtPrice: patch.compareAtPrice ?? null,
      taxable: patch.taxable ?? true,
      taxRate: patch.taxRate ?? 20,
      trackInventory: patch.trackInventory ?? true,
      stockCount: patch.stockCount ?? 0,
      lowStockThreshold: patch.lowStockThreshold ?? 10,
      allowBackorders: patch.allowBackorders ?? false,
      availableOnline: patch.availableOnline ?? true,
      availablePOS: patch.availablePOS ?? true,
      isActive: patch.isActive ?? true,
      isFeatured: false,
      imageUrl: patch.imageUrl,
      galleryImages: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    }
    addProduct(created)
    if (wantsPromote) {
      const result = promoteProductToAddOn(id, created)
      if (!result.ok) {
        toast({ title: 'Add-on link failed', description: result.message, variant: 'destructive' })
      }
    }
    setCreateOpen(false)
  }

  function openEdit(p: Product) {
    setEditProduct(p)
    setDraft(productToDraft(p, categories))
  }

  function persistEdit() {
    if (!editProduct) return
    const wantsPromote = draft.canBeAddOn && !editProduct.linkedAddOnId
    const patch = draftToProductPatch(draft)
    updateProduct(editProduct.id, patch)
    if (wantsPromote) {
      const merged = { ...editProduct, ...patch } as Product
      const result = promoteProductToAddOn(editProduct.id, merged)
      if (!result.ok) {
        toast({ title: 'Add-on link failed', description: result.message, variant: 'destructive' })
      }
    }
    setEditProduct(null)
  }

  function categoryLabelForProduct(product: Product): string {
    const selected = categoryById.get(product.categoryId)
    if (!selected) return '—'
    const parent = selected.parentId ? categoryById.get(selected.parentId) : null
    return parent ? `${parent.name} › ${selected.name}` : selected.name
  }

  function promoteFromRow(product: Product) {
    if (product.linkedAddOnId) return
    const result = promoteProductToAddOn(product.id, product)
    if (!result.ok) {
      toast({ title: 'Add-on link failed', description: result.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Linked as add-on', description: `${product.name} is now available as add-on.` })
  }

  const editLockedPromoted = useMemo(() => {
    if (!editProduct?.linkedAddOnId) return null
    const name =
      bookingAddOns.find((a) => a.id === editProduct.linkedAddOnId)?.name ?? editProduct.name
    return { id: editProduct.linkedAddOnId, name }
  }, [bookingAddOns, editProduct])

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
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New product
          </Button>
        </div>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-0">
          <ProductCategoryManager />
        </TabsContent>

        <TabsContent value="products" className="mt-0 space-y-6">
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
              <span className="float-right text-xs text-muted-foreground">{products.length}</span>
            </button>
            <Accordion type="multiple" className="w-full space-y-2">
              {productTypeTree.map((group) => {
                const groupItems = showOnlyAddOns
                  ? group.categories.filter((top) =>
                      products.some((p) => {
                        if (!p.linkedAddOnId) return false
                        if (p.categoryId === top.id) return true
                        return categories.some(
                          (c) => (c.parentId ?? null) === top.id && c.id === p.categoryId,
                        )
                      }),
                    )
                  : group.categories
                if (groupItems.length === 0) return null
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
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 pb-3">
                      {groupItems.map((top) => {
                        const topActive = categoryId === top.id
                        const directCount = filtered.filter((p) => p.categoryId === top.id).length
                        const subRows = categories
                          .filter((c) => (c.parentId ?? null) === top.id)
                          .slice()
                          .sort((a, b) => a.displayOrder - b.displayOrder)
                        return (
                          <div key={top.id} className="rounded-md border border-border bg-card p-2 shadow-sm">
                            <button
                              type="button"
                              onClick={() => setCategoryId(top.id)}
                              className={`w-full rounded-md px-2 py-1.5 text-left text-sm font-semibold transition-colors ${
                                topActive
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                  : 'text-foreground hover:bg-secondary'
                              }`}
                            >
                              <span>{top.name}</span>
                              <Badge variant="outline" className="float-right text-[10px]">
                                {directCount}
                              </Badge>
                            </button>
                            <div className="mt-2 space-y-1 pl-2">
                              {subRows.map((sub) => {
                                const subCount = filtered.filter((p) => p.categoryId === sub.id).length
                                if (showOnlyAddOns && subCount === 0) return null
                                const active = categoryId === sub.id
                                return (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => setCategoryId(sub.id)}
                                    className={`w-full rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors ${
                                      active
                                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                    }`}
                                  >
                                    <span>{sub.name}</span>
                                    <Badge variant="outline" className="float-right h-5 text-[10px]">
                                      {subCount}
                                    </Badge>
                                  </button>
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
            <CardTitle className="text-base">Catalog</CardTitle>
            <CardDescription>{filtered.length} products</CardDescription>
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
                {filtered.map((p) => (
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
                        <Button variant="outline" size="sm" onClick={() => setAdjustProduct(p)}>
                          Stock
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={Boolean(p.linkedAddOnId)}
                          onClick={() => promoteFromRow(p)}
                        >
                          {p.linkedAddOnId ? 'Linked' : 'Link add-on'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
        </TabsContent>
      </Tabs>

      <CrudModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New product"
        description="Create a new shop product."
        size="lg"
        variant="create"
        scrollMode="dialog"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={persistCreate}>Create</Button>
          </>
        }
      >
        <ProductForm value={draft} onChange={setDraft} categories={categories} />
      </CrudModal>

      <CrudModal
        open={editProduct !== null}
        onOpenChange={(open) => {
          if (!open) setEditProduct(null)
        }}
        title="Edit product"
        description="Update product details, pricing, and inventory."
        size="lg"
        variant="edit"
        scrollMode="dialog"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditProduct(null)}>
              Cancel
            </Button>
            <Button onClick={persistEdit}>Save</Button>
          </>
        }
      >
        <ProductForm
          value={draft}
          onChange={setDraft}
          categories={categories}
          lockedPromotedAddOn={editLockedPromoted}
        />
      </CrudModal>

      {adjustProduct ? (
        <StockAdjustmentModal product={adjustProduct} open={true} onClose={() => setAdjustProduct(null)} />
      ) : null}

      <CSVImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}

