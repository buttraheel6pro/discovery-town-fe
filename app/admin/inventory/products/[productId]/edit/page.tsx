/** Admin inventory edit product page using full-form editing. */
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { GiftProductForm, type GiftProductDraft } from '@/components/admin/gift-product-form'
import {
  ProductForm,
  type ProductDraft,
  draftToProductPatch,
  productToDraft,
} from '@/components/admin/product-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useInventory } from '@/lib/inventory-store'
import { useScheduling } from '@/lib/scheduling-store'
import type { Product } from '@/lib/types'

export default function AdminInventoryProductEditPage() {
  const params = useParams<{ productId: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const {
    products,
    productCategories,
    bookingAddOns,
    coupons,
    updateProduct,
    promoteProductToAddOn,
  } = useInventory()
  const { occasions } = useScheduling()
  const productId = params.productId
  const [returnTo, setReturnTo] = useState('/admin/inventory/products')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const target = new URLSearchParams(window.location.search).get('returnTo')?.trim()
    if (!target || !target.startsWith('/')) return
    setReturnTo(target)
  }, [])

  const categories = useMemo(() => {
    return productCategories.slice().sort((a, b) => a.displayOrder - b.displayOrder)
  }, [productCategories])

  const product = useMemo(() => {
    return products.find((entry) => entry.id === productId) ?? null
  }, [productId, products])

  const [draft, setDraft] = useState<ProductDraft>(() =>
    product && categories.length
      ? productToDraft(product, categories)
      : productToDraft(
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
  const [giftDraft, setGiftDraft] = useState<GiftProductDraft>({
    name: '',
    sku: '',
    description: '',
    categoryId: '',
    imageUrl: '',
    price: '0',
    memberPrice: '',
    compareAtPrice: '',
    costPrice: '',
    taxable: true,
    taxRate: '20',
    productIds: [],
    addOnProductIds: [],
    couponIds: [],
    couponsWithPackage: false,
    isPerishable: false,
    basketCapacity: '',
    occasionId: '',
    giftPriceUpperLimit: '0',
  })

  useEffect(() => {
    if (!product) return
    setDraft(productToDraft(product, categories))
  }, [product, categories])

  const categoryById = useMemo(() => {
    return new Map(productCategories.map((entry) => [entry.id, entry]))
  }, [productCategories])
  const isGiftProduct = useMemo(() => {
    if (!product) return false
    const category = categoryById.get(product.categoryId) ?? null
    return (category?.productType ?? '').toLowerCase() === 'gifts'
  }, [categoryById, product])
  const giftsRootCategory = useMemo(() => {
    return categories.find(
      (category) =>
        (category.productType ?? '').toLowerCase() === 'gifts' &&
        (category.parentId == null || category.parentId === ''),
    )
  }, [categories])
  const giftsSubCategories = useMemo(() => {
    if (!giftsRootCategory) return []
    return categories.filter((category) => category.parentId === giftsRootCategory.id)
  }, [categories, giftsRootCategory])

  useEffect(() => {
    if (!product || !isGiftProduct) return
    setGiftDraft({
      name: product.name ?? '',
      sku: product.sku ?? '',
      description: product.description ?? '',
      categoryId: product.categoryId ?? giftsSubCategories[0]?.id ?? '',
      imageUrl: product.imageUrl ?? '',
      price: String(product.price ?? 0),
      memberPrice: product.memberPrice != null ? String(product.memberPrice) : '',
      compareAtPrice: product.compareAtPrice != null ? String(product.compareAtPrice) : '',
      costPrice: product.costPrice != null ? String(product.costPrice) : '',
      taxable: product.taxable ?? true,
      taxRate: String(product.taxRate ?? 20),
      productIds: product.giftProductIds ?? [],
      addOnProductIds: product.giftAddOnProductIds ?? [],
      couponIds: product.giftVoucherCouponIds ?? [],
      couponsWithPackage: product.giftCouponsWithPackage ?? false,
      isPerishable: product.isPerishable ?? false,
      basketCapacity: product.basketCapacity != null ? String(product.basketCapacity) : '',
      occasionId: product.giftOccasionId ?? '',
      giftPriceUpperLimit:
        product.giftPriceUpperLimit != null ? String(product.giftPriceUpperLimit) : '0',
    })
  }, [giftsSubCategories, isGiftProduct, product])

  const lockedPromotedAddOn = useMemo(() => {
    if (!product?.linkedAddOnId) return null
    const name = bookingAddOns.find((a) => a.id === product.linkedAddOnId)?.name ?? product.name
    return { id: product.linkedAddOnId, name }
  }, [bookingAddOns, product])

  function persistEdit() {
    if (!product) return
    if (isGiftProduct) {
      const parsedBasketCapacity = toIntOrUndefined(giftDraft.basketCapacity)
      if (parsedBasketCapacity == null || parsedBasketCapacity < 0) {
        toast({
          title: 'Invalid basket capacity',
          description: 'Enter a valid basket capacity before saving a gift product.',
          variant: 'destructive',
        })
        return
      }
      if (giftDraft.productIds.length !== parsedBasketCapacity) {
        toast({
          title: 'Basket capacity mismatch',
          description: `Select exactly ${parsedBasketCapacity} items in Products to match basket capacity.`,
          variant: 'destructive',
        })
        return
      }

      updateProduct(product.id, {
        name: giftDraft.name.trim() || product.name,
        description: giftDraft.description.trim() || undefined,
        sku: giftDraft.sku.trim() || undefined,
        categoryId: giftDraft.categoryId || product.categoryId,
        imageUrl: giftDraft.imageUrl.trim() || undefined,
        price: toNumberOrUndefined(giftDraft.price) ?? 0,
        memberPrice: toNumberOrUndefined(giftDraft.memberPrice),
        compareAtPrice: toNumberOrUndefined(giftDraft.compareAtPrice) ?? null,
        costPrice: toNumberOrUndefined(giftDraft.costPrice),
        taxable: giftDraft.taxable,
        taxRate: toNumberOrUndefined(giftDraft.taxRate) ?? 20,
        giftProductIds: giftDraft.productIds,
        giftAddOnProductIds: giftDraft.addOnProductIds,
        giftVoucherCouponIds: giftDraft.couponIds,
        giftCouponsWithPackage: giftDraft.couponsWithPackage,
        isPerishable: giftDraft.isPerishable,
        basketCapacity: parsedBasketCapacity,
        giftPriceUpperLimit: toNumberOrUndefined(giftDraft.giftPriceUpperLimit) ?? null,
        giftOccasionId: giftDraft.occasionId || null,
      })
      router.push(returnTo)
      return
    }

    const wantsPromote = draft.canBeAddOn && !product.linkedAddOnId
    const patch = draftToProductPatch(draft)
    updateProduct(product.id, patch)
    if (wantsPromote) {
      const merged = { ...product, ...patch } as Product
      const result = promoteProductToAddOn(product.id, merged)
      if (!result.ok) {
        toast({ title: 'Add-on link failed', description: result.message, variant: 'destructive' })
      }
    }
    router.push(returnTo)
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

  if (!product) {
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
            {isGiftProduct ? 'Edit gift product' : 'Edit product'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isGiftProduct
              ? 'Update gift-specific details and linked selections.'
              : 'Update product details, pricing, and inventory.'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product details</CardTitle>
          <CardDescription>
            {isGiftProduct
              ? 'Use the gifts form fields and save changes.'
              : 'Update all fields and save changes.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isGiftProduct ? (
            <GiftProductForm
              value={giftDraft}
              onChange={setGiftDraft}
              giftsCategoryName={giftsRootCategory?.name ?? 'Gifts'}
              subCategories={giftsSubCategories}
              productOptions={products
                .filter((entry) => entry.isActive)
                .map((entry) => ({
                  id: entry.id,
                  name: entry.name,
                  sku: entry.sku,
                  imageUrl: entry.imageUrl,
                  price: entry.memberPrice ?? entry.price,
                }))}
              addOnOptions={products
                .filter((entry) => entry.isActive)
                .map((entry) => ({
                  id: entry.id,
                  name: entry.name,
                  sku: entry.sku,
                  imageUrl: entry.imageUrl,
                  description: entry.description,
                  price: entry.memberPrice ?? entry.price,
                }))}
              couponOptions={coupons.filter((coupon) => coupon.isActive)}
              occasions={occasions}
            />
          ) : (
            <ProductForm
              value={draft}
              onChange={setDraft}
              categories={categories}
              lockedPromotedAddOn={lockedPromotedAddOn}
            />
          )}
          <div className="flex items-center justify-end gap-2">
            <Link href={returnTo}>
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="button" onClick={persistEdit}>Save</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
