/** Shared cafe product editor — powers both create and edit flows with mode-based behavior. */
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'

import { CafeProductForm } from '@/components/admin/cafe-product-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { createEmptyCafeProduct, useCafe } from '@/lib/cafe-store'
import { useInventory } from '@/lib/inventory-store'
import type { AttributeGroup, CafeCategory, CafeProduct, Product } from '@/lib/types'

const CAFE_CATEGORIES: CafeCategory[] = [
  'Coffee',
  'Cold Drinks',
  'Specialty',
  'Pizza',
  'Sandwiches',
  'Kids Corner',
  'Salads & Snacks',
  'Sweets',
  'Pastries',
]

function toCafeCategory(categoryName: string | null | undefined): CafeCategory {
  if (!categoryName) return 'Coffee'
  const normalized = categoryName.trim().toLowerCase()
  const match = CAFE_CATEGORIES.find((entry) => entry.toLowerCase() === normalized)
  return match ?? 'Coffee'
}

function inventoryProductToCafeProduct(product: Product, categoryName?: string): CafeProduct {
  return createEmptyCafeProduct({
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: toCafeCategory(categoryName),
    basePrice: product.memberPrice ?? product.price,
    stockCount: product.stockCount,
    description: product.description,
    imageUrl: product.imageUrl,
    isActive: product.isActive,
    isAvailable: true,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  })
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export interface CafeProductEditorProps {
  readonly mode: 'create' | 'edit'
  readonly productId?: string
}

export function CafeProductEditor({ mode, productId = '' }: Readonly<CafeProductEditorProps>) {
  const router = useRouter()
  const { toast } = useToast()
  const { products, productCategories, addProduct, updateProduct } = useInventory()
  const {
    cafeProducts,
    upsertCafeProduct,
    modifierGroups,
    attributeGroups,
    rotationGroups,
  } = useCafe()

  const existing = useMemo(
    () => cafeProducts.find((product) => product.id === productId) ?? null,
    [cafeProducts, productId],
  )
  const inventoryProduct = useMemo(
    () => products.find((product) => product.id === productId) ?? null,
    [productId, products],
  )
  const inventoryCategoryName = useMemo(() => {
    if (!inventoryProduct) return undefined
    return productCategories.find((entry) => entry.id === inventoryProduct.categoryId)?.name
  }, [inventoryProduct, productCategories])

  const [draft, setDraft] = useState<CafeProduct>(() => createEmptyCafeProduct())
  const [attrErrors, setAttrErrors] = useState<Record<string, string>>({})
  const [returnTo, setReturnTo] = useState('/admin/scheduling/services')
  const [preferredCategoryId, setPreferredCategoryId] = useState('')
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('')

  useEffect(() => {
    if (mode !== 'edit') return
    if (existing) {
      setDraft({ ...existing })
      return
    }
    if (!inventoryProduct) return
    setDraft(inventoryProductToCafeProduct(inventoryProduct, inventoryCategoryName))
  }, [existing, inventoryCategoryName, inventoryProduct, mode])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const search = new URLSearchParams(window.location.search)
    const target = search.get('returnTo')?.trim()
    const directCategoryId = search.get('categoryId')?.trim()
    if (!target || !target.startsWith('/admin/')) return
    setReturnTo(target)
    if (directCategoryId) {
      setPreferredCategoryId(directCategoryId)
      return
    }
    const returnToUrl = new URL(target, window.location.origin)
    const categoryFromReturn = returnToUrl.searchParams.get('productCategoryId')?.trim()
    if (categoryFromReturn) {
      setPreferredCategoryId(categoryFromReturn)
    }
  }, [])

  const resolvedCategoryId = useMemo(() => {
    if (inventoryProduct) return inventoryProduct.categoryId
    const preferred = preferredCategoryId.trim()
    if (
      preferred &&
      productCategories.some(
        (category) =>
          category.id === preferred && (category.productType ?? '').toLowerCase() === 'cafe&food',
      )
    ) {
      return preferred
    }
    const fallback = productCategories.find(
      (category) =>
        (category.productType ?? '').toLowerCase() === 'cafe&food' && category.parentId !== null,
    )
    return fallback?.id ?? ''
  }, [inventoryProduct, preferredCategoryId, productCategories])
  const cafeSubCategoryOptions = useMemo(
    () =>
      productCategories
        .filter(
          (category) =>
            (category.productType ?? '').toLowerCase() === 'cafe&food' && category.parentId !== null,
        )
        .map((category) => ({ id: category.id, name: category.name })),
    [productCategories],
  )

  useEffect(() => {
    if (!resolvedCategoryId) return
    setSelectedSubCategoryId((prev) => prev || resolvedCategoryId)
  }, [resolvedCategoryId])

  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {}
    if ((draft.availableDaysOfWeek?.length ?? 0) === 0) {
      errors.days = 'Pick at least one day.'
    }
    return errors
  }, [draft.availableDaysOfWeek])

  function handleSave() {
    setAttrErrors({})
    if ((draft.availableDaysOfWeek?.length ?? 0) === 0) {
      toast({
        title: 'Check availability',
        description: 'Select at least one day of week.',
        variant: 'destructive',
      })
      return
    }
    if (!selectedSubCategoryId) {
      toast({
        title: 'Category required',
        description: 'Select a Cafe & Food sub-category before saving this product.',
        variant: 'destructive',
      })
      return
    }

    upsertCafeProduct(draft)

    if (inventoryProduct) {
      updateProduct(inventoryProduct.id, {
        categoryId: selectedSubCategoryId,
        name: draft.name.trim() || inventoryProduct.name,
        slug: slugify(draft.name) || inventoryProduct.slug,
        description: draft.description?.trim() || undefined,
        sku: draft.sku?.trim() || undefined,
        price: draft.basePrice,
        memberPrice: draft.basePrice,
        stockCount: draft.stockCount ?? inventoryProduct.stockCount,
        imageUrl: draft.imageUrl,
        isActive: inventoryProduct.isActive,
      })
    } else {
      const nowIso = new Date().toISOString()
      const tenantId = products[0]?.tenantId ?? 'tenant-1'
      addProduct({
        id: draft.id,
        tenantId,
        categoryId: selectedSubCategoryId,
        name: draft.name.trim() || 'New cafe product',
        slug: slugify(draft.name) || draft.id,
        description: draft.description?.trim() || undefined,
        sku: draft.sku?.trim() || undefined,
        price: draft.basePrice,
        memberPrice: draft.basePrice,
        stockCount: draft.stockCount ?? 0,
        lowStockThreshold: 10,
        allowBackorders: false,
        isActive: true,
        isFeatured: false,
        imageUrl: draft.imageUrl,
        createdAt: draft.createdAt ?? nowIso,
        updatedAt: nowIso,
      })
    }

    toast({ title: mode === 'edit' ? 'Product updated' : 'Product saved' })
    router.push(returnTo)
  }

  if (mode === 'edit' && (!productId || (!existing && !inventoryProduct))) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product not found</CardTitle>
          <CardDescription>The product may have been deleted.</CardDescription>
          <div className="pt-2">
            <Link href={returnTo}>
              <Button type="button" variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link href={returnTo}>
          <Button type="button" variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {mode === 'edit' ? 'Edit cafe product' : 'New cafe product'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {mode === 'edit'
              ? 'Update cafe product settings using the same admin edit layout as gifts and rentals.'
              : 'Create a cafe product using the same admin create layout as gifts and rentals.'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product details</CardTitle>
          <CardDescription>
            {mode === 'edit'
              ? 'Review and save cafe product configuration changes.'
              : 'Configure cafe product details, availability, and customisation rules.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {validationErrors.days ? (
            <p className="text-sm text-destructive">{validationErrors.days}</p>
          ) : null}
          <CafeProductForm
            value={draft}
            onChange={setDraft}
            selectedSubCategoryId={selectedSubCategoryId}
            subCategoryOptions={cafeSubCategoryOptions}
            onSubCategoryChange={setSelectedSubCategoryId}
            modifierGroups={modifierGroups}
            attributeGroups={attributeGroups}
            rotationGroups={rotationGroups}
            attributeErrors={attrErrors as Partial<Record<AttributeGroup['id'], string>>}
          />
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href={returnTo}>Cancel</Link>
            </Button>
            <Button type="button" onClick={handleSave}>
              {mode === 'edit' ? 'Save' : 'Create'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
