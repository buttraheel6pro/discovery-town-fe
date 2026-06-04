/** Shared shop product editor — create/edit under inventory + event management flows. */
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'

import { ShopProductForm, type ShopProductDraft } from '@/components/admin/shop-product-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useCafe } from '@/lib/cafe-store'
import { useInventory } from '@/lib/inventory-store'
import type { AttributeGroup, Product } from '@/lib/types'

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function toNumberOrUndefined(value: string): number | undefined {
  const parsed = Number.parseFloat(value.trim())
  if (!Number.isFinite(parsed)) return undefined
  return parsed
}

function toIntOrUndefined(value: string): number | undefined {
  const parsed = Number.parseInt(value.trim(), 10)
  if (!Number.isFinite(parsed)) return undefined
  return parsed
}

function productToShopDraft(product: Product): ShopProductDraft {
  return {
    name: product.name,
    sku: product.sku ?? '',
    description: product.description ?? '',
    categoryId: product.categoryId,
    imageUrl: product.imageUrl ?? '',
    price: String(product.price ?? 0),
    memberPrice:
      product.memberPrice != null && Number.isFinite(product.memberPrice)
        ? String(product.memberPrice)
        : '',
    compareAtPrice:
      product.compareAtPrice != null && Number.isFinite(product.compareAtPrice)
        ? String(product.compareAtPrice)
        : '',
    costPrice:
      product.costPrice != null && Number.isFinite(product.costPrice)
        ? String(product.costPrice)
        : '',
    stockCount: String(product.stockCount ?? 0),
    lowStockThreshold: String(product.lowStockThreshold ?? 10),
    trackInventory: product.trackInventory !== false,
    allowBackorders: product.allowBackorders ?? false,
    taxable: product.taxable !== false,
    taxRate: String(product.taxRate ?? 20),
    targetGender: product.targetGender ?? 'unisex',
    isActive: product.availableOnline !== false,
    shopAttributeGroups: (product.shopAttributeGroups ?? []).map((group) => ({
      ...group,
      options: group.options.map((option) => ({ ...option })),
    })),
    shopVariants: (product.shopVariants ?? []).map((variant) => ({
      ...variant,
      optionValueIdsByGroupId: { ...variant.optionValueIdsByGroupId },
      optionLabelsByGroupId: { ...variant.optionLabelsByGroupId },
    })),
  }
}

function emptyDraft(categoryId: string): ShopProductDraft {
  return {
    name: '',
    sku: '',
    description: '',
    categoryId,
    imageUrl: '',
    price: '0',
    memberPrice: '',
    compareAtPrice: '',
    costPrice: '',
    stockCount: '0',
    lowStockThreshold: '10',
    trackInventory: true,
    allowBackorders: false,
    taxable: true,
    taxRate: '20',
    targetGender: 'unisex',
    isActive: true,
    shopAttributeGroups: [],
    shopVariants: [],
  }
}

export interface ShopProductEditorProps {
  readonly mode: 'create' | 'edit'
  readonly productId?: string
}

export function ShopProductEditor({ mode, productId = '' }: Readonly<ShopProductEditorProps>) {
  const router = useRouter()
  const { toast } = useToast()
  const { products, productCategories, addProduct, updateProduct } = useInventory()
  const { attributeGroups } = useCafe()

  const inventoryProduct = useMemo(
    () => products.find((product) => product.id === productId) ?? null,
    [productId, products],
  )

  const shopRootCategory = useMemo(() => {
    return productCategories.find(
      (category) =>
        (category.productType ?? '').toLowerCase() === 'shop' &&
        (category.parentId == null || category.parentId === ''),
    )
  }, [productCategories])

  const shopSubCategories = useMemo(() => {
    if (!shopRootCategory) return []
    return productCategories.filter((category) => category.parentId === shopRootCategory.id)
  }, [productCategories, shopRootCategory])

  const [draft, setDraft] = useState<ShopProductDraft>(() => {
    if (mode === 'edit' && inventoryProduct) {
      return productToShopDraft(inventoryProduct)
    }
    return emptyDraft(shopSubCategories[0]?.id ?? '')
  })
  const [returnTo, setReturnTo] = useState('/admin/scheduling/services')
  const [preferredCategoryId, setPreferredCategoryId] = useState('')

  useEffect(() => {
    if (mode !== 'edit' || !inventoryProduct) return
    setDraft(productToShopDraft(inventoryProduct))
  }, [inventoryProduct, mode])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const search = new URLSearchParams(window.location.search)
    const target = search.get('returnTo')?.trim()
    const directCategoryId = search.get('categoryId')?.trim()
    if (target && target.startsWith('/admin/')) {
      setReturnTo(target)
    }
    if (directCategoryId) {
      setPreferredCategoryId(directCategoryId)
      return
    }
    if (target) {
      try {
        const returnToUrl = new URL(target, window.location.origin)
        const categoryFromReturn = returnToUrl.searchParams.get('productCategoryId')?.trim()
        if (categoryFromReturn) {
          setPreferredCategoryId(categoryFromReturn)
        }
      } catch {
        // ignore invalid return URL
      }
    }
  }, [])

  const resolvedCategoryId = useMemo(() => {
    if (inventoryProduct) return inventoryProduct.categoryId
    const preferred = preferredCategoryId.trim()
    if (preferred && shopSubCategories.some((category) => category.id === preferred)) {
      return preferred
    }
    return shopSubCategories[0]?.id ?? ''
  }, [inventoryProduct, preferredCategoryId, shopSubCategories])

  useEffect(() => {
    if (mode !== 'create') return
    if (!resolvedCategoryId) return
    setDraft((prev) => {
      const preferred = preferredCategoryId.trim()
      if (preferred && prev.categoryId !== resolvedCategoryId) {
        return { ...prev, categoryId: resolvedCategoryId }
      }
      if (prev.categoryId && shopSubCategories.some((c) => c.id === prev.categoryId)) {
        return prev
      }
      return { ...prev, categoryId: resolvedCategoryId }
    })
  }, [mode, preferredCategoryId, resolvedCategoryId, shopSubCategories])

  function handleSave() {
    for (const group of draft.shopAttributeGroups) {
      if (!group.isRequired) continue
      if (group.options.length === 0) {
        toast({
          title: 'Attributes incomplete',
          description: `Add at least one option for ${group.name}.`,
          variant: 'destructive',
        })
        return
      }
    }

    if (!draft.categoryId) {
      toast({
        title: 'Category required',
        description: 'Select a Shop sub-category before saving.',
        variant: 'destructive',
      })
      return
    }

    const price = toNumberOrUndefined(draft.price) ?? 0
    const memberPrice = toNumberOrUndefined(draft.memberPrice)
    const compareAt = toNumberOrUndefined(draft.compareAtPrice)
    const costPrice = toNumberOrUndefined(draft.costPrice)
    const stock = toIntOrUndefined(draft.stockCount) ?? 0
    const lowStock = toIntOrUndefined(draft.lowStockThreshold) ?? 10
    const taxRate = toNumberOrUndefined(draft.taxRate) ?? 20

    const groupsPayload: AttributeGroup[] | undefined =
      draft.shopAttributeGroups.length > 0
        ? draft.shopAttributeGroups.map((group) => ({
            ...group,
            options: group.options.map((option) => ({ ...option })),
          }))
        : undefined
    const variantsPayload =
      draft.shopVariants.length > 0
        ? draft.shopVariants.map((variant) => ({
            ...variant,
            optionValueIdsByGroupId: { ...variant.optionValueIdsByGroupId },
            optionLabelsByGroupId: { ...variant.optionLabelsByGroupId },
          }))
        : undefined

    if (mode === 'edit' && inventoryProduct) {
      updateProduct(inventoryProduct.id, {
        categoryId: draft.categoryId,
        name: draft.name.trim() || inventoryProduct.name,
        slug: slugify(draft.name) || inventoryProduct.slug,
        description: draft.description.trim() || undefined,
        sku: draft.sku.trim() || undefined,
        price,
        memberPrice: memberPrice ?? price,
        compareAtPrice: compareAt ?? null,
        costPrice,
        stockCount: stock,
        lowStockThreshold: lowStock,
        trackInventory: draft.trackInventory,
        allowBackorders: draft.allowBackorders,
        taxable: draft.taxable,
        taxRate,
        targetGender: draft.targetGender,
        imageUrl: draft.imageUrl.trim() || undefined,
        availableOnline: draft.isActive,
        availablePOS: true,
        shopAttributeGroups: groupsPayload,
        shopVariants: variantsPayload,
      })
      toast({ title: 'Product updated' })
      router.push(returnTo)
      return
    }

    const nowIso = new Date().toISOString()
    const id = `prod-admin-${Date.now()}`
    const tenantId = products[0]?.tenantId ?? 'tenant-1'

    const created: Product = {
      id,
      tenantId,
      categoryId: draft.categoryId,
      name: draft.name.trim() || 'New shop product',
      slug: slugify(draft.name) || id,
      description: draft.description.trim() || undefined,
      sku: draft.sku.trim() || undefined,
      price,
      memberPrice: memberPrice ?? price,
      compareAtPrice: compareAt ?? null,
      costPrice,
      stockCount: stock,
      lowStockThreshold: lowStock,
      trackInventory: draft.trackInventory,
      allowBackorders: draft.allowBackorders,
      taxable: draft.taxable,
      taxRate,
      targetGender: draft.targetGender,
      imageUrl: draft.imageUrl.trim() || undefined,
      galleryImages: [],
      availableOnline: draft.isActive,
      availablePOS: true,
      isActive: true,
      isFeatured: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      shopAttributeGroups: groupsPayload,
      shopVariants: variantsPayload,
    }

    addProduct(created)
    toast({ title: 'Product saved' })
    router.push(returnTo)
  }

  if (mode === 'edit' && (!productId || !inventoryProduct)) {
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
            {mode === 'edit' ? 'Edit shop product' : 'New shop product'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Configure merchandising attributes and pricing like other inventory types.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product details</CardTitle>
          <CardDescription>
            {mode === 'edit'
              ? 'Update shop product configuration and variant groups.'
              : 'Create a shop product with optional variant attribute groups.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ShopProductForm
            value={draft}
            onChange={setDraft}
            shopCategoryName={shopRootCategory?.name ?? 'Shop'}
            subCategories={shopSubCategories}
            attributeGroupsLibrary={attributeGroups}
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
