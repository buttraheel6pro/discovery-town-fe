/** Admin product detail — fields and stock movement history. */
'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'

import { CrudModal } from '@/components/admin/crud-modal'
import { ProductForm, type ProductDraft, draftToProductPatch } from '@/components/admin/product-form'
import { StockAdjustmentModal } from '@/components/admin/stock-adjustment-modal'
import { StockMovementTimeline } from '@/components/admin/stock-movement-timeline'
import { StockStatusBadge } from '@/components/admin/stock-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

export default function AdminInventoryProductDetailPage() {
  const params = useParams<{ productId: string }>()
  const productId = params.productId

  const { products, productCategories, stockMovements, updateProduct } = useInventory()
  const categories = useMemo(
    () => productCategories.slice().sort((a, b) => a.displayOrder - b.displayOrder),
    [productCategories],
  )

  const product = products.find((p) => p.id === productId) ?? null
  const category = product ? categories.find((c) => c.id === product.categoryId) ?? null : null

  const movements = useMemo(() => {
    return stockMovements
      .filter((m) => m.productId === productId)
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [productId, stockMovements])

  const [editOpen, setEditOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [draft, setDraft] = useState<ProductDraft>(() =>
    product && categories.length ? productToDraft(product, categories) : productToDraft(
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

  if (!product) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product not found</CardTitle>
          <CardDescription>The product may have been deleted.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const activeProduct = product

  function persistEdit() {
    updateProduct(activeProduct.id, draftToProductPatch(draft))
    setEditOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-border bg-muted/30">
            <Image src={product.imageUrl ?? '/placeholder.svg'} alt={product.name} fill className="object-cover" sizes="64px" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              {product.sku ? <span className="font-mono text-xs text-muted-foreground">{product.sku}</span> : null}
              <StockStatusBadge product={product} />
              {category ? <span className="text-xs text-muted-foreground">{category.name}</span> : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
            <span className="text-sm font-semibold text-foreground">Active</span>
            <Switch
              checked={product.isActive}
              onCheckedChange={(v) => updateProduct(product.id, { isActive: v })}
            />
          </div>
          <Button variant="outline" onClick={() => setAdjustOpen(true)}>
            Adjust stock
          </Button>
          <Button onClick={() => {
            setDraft(productToDraft(product, categories))
            setEditOpen(true)
          }}>
            Edit
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history">Stock history</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Product details</CardTitle>
              <CardDescription>Key fields and current status.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-semibold text-foreground">{formatPrice(product.price)}</span>
                </div>
                {product.memberPrice != null ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Member price</span>
                    <span className="font-semibold text-foreground">{formatPrice(product.memberPrice)}</span>
                  </div>
                ) : null}
                {product.compareAtPrice != null ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Compare at</span>
                    <span className="font-semibold text-foreground">{formatPrice(product.compareAtPrice)}</span>
                  </div>
                ) : null}
                {product.costPrice != null ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cost price</span>
                    <span className="font-semibold text-foreground">{formatPrice(product.costPrice)}</span>
                  </div>
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Stock</span>
                  <span className="font-semibold text-foreground">{product.stockCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Low stock threshold</span>
                  <span className="font-semibold text-foreground">{product.lowStockThreshold}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available online</span>
                  <span className="font-semibold text-foreground">{product.availableOnline === false ? 'No' : 'Yes'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available POS</span>
                  <span className="font-semibold text-foreground">{product.availablePOS === false ? 'No' : 'Yes'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <StockMovementTimeline movements={movements} />
        </TabsContent>
      </Tabs>

      <CrudModal
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit product"
        description="Update product details, pricing, and inventory."
        size="lg"
        variant="edit"
        scrollMode="dialog"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={persistEdit}>Save</Button>
          </>
        }
      >
        <ProductForm value={draft} onChange={setDraft} categories={categories} />
      </CrudModal>

      <StockAdjustmentModal product={product} open={adjustOpen} onClose={() => setAdjustOpen(false)} />
    </div>
  )
}

