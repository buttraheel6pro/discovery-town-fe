/** Admin inventory products — list, filter, create/edit, and stock adjustments. */
'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Search, SlidersHorizontal } from 'lucide-react'

import { CrudModal } from '@/components/admin/crud-modal'
import { CSVImportModal } from '@/components/admin/csv-import-modal'
import { ProductForm, type ProductDraft, draftToProductPatch } from '@/components/admin/product-form'
import { StockAdjustmentModal } from '@/components/admin/stock-adjustment-modal'
import { StockStatusBadge } from '@/components/admin/stock-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatPrice } from '@/lib/utils'
import { useInventory } from '@/lib/inventory-store'
import type { Product, ProductCategory } from '@/lib/types'

function productToDraft(product: Product, categories: ProductCategory[]): ProductDraft {
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

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function AdminInventoryProductsPage() {
  const { products, productCategories, addProduct, updateProduct } = useInventory()

  const categories = useMemo(() => productCategories.slice().sort((a, b) => a.displayOrder - b.displayOrder), [productCategories])
  const [categoryId, setCategoryId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [showOnlyActive, setShowOnlyActive] = useState(true)

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
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      if (showOnlyActive && !p.isActive) return false
      if (categoryId && p.categoryId !== categoryId) return false
      if (!q) return true
      const hay = `${p.name} ${(p.sku ?? '')}`.toLowerCase()
      return hay.includes(q)
    })
  }, [categoryId, products, search, showOnlyActive])

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
    setCreateOpen(false)
  }

  function openEdit(p: Product) {
    setEditProduct(p)
    setDraft(productToDraft(p, categories))
  }

  function persistEdit() {
    if (!editProduct) return
    updateProduct(editProduct.id, draftToProductPatch(draft))
    setEditProduct(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-2">Manage catalog, inventory, and visibility.</p>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Categories</CardTitle>
            <CardDescription>Filter products by category.</CardDescription>
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
            {categories.map((c) => {
              const count = products.filter((p) => p.categoryId === c.id).length
              const active = c.id === categoryId
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                    active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'bg-card hover:bg-secondary'
                  }`}
                >
                  {c.name}
                  <span className="float-right text-xs text-muted-foreground">{count}</span>
                </button>
              )
            })}
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
              </div>
            </div>

            <Separator />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
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
                      {categories.find((c) => c.id === p.categoryId)?.name ?? '—'}
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

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
        <ProductForm value={draft} onChange={setDraft} categories={categories} />
      </CrudModal>

      {adjustProduct ? (
        <StockAdjustmentModal product={adjustProduct} open={true} onClose={() => setAdjustProduct(null)} />
      ) : null}

      <CSVImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}

