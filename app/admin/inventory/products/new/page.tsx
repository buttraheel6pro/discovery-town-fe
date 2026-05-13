/** Admin inventory new product page using the same fields as the previous create modal. */
'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { CafeProductEditor } from '@/components/admin/cafe-product-editor'
import { ShopProductEditor } from '@/components/admin/shop-product-editor'
import { GiftProductForm, type GiftProductDraft } from '@/components/admin/gift-product-form'
import { ProductForm, type ProductDraft, draftToProductPatch, productToDraft } from '@/components/admin/product-form'
import { RentalProductForm } from '@/components/admin/rental-product-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useInventory } from '@/lib/inventory-store'
import { useScheduling } from '@/lib/scheduling-store'
import type { Product } from '@/lib/types'

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function AdminInventoryProductsNewPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { productCategories, products, coupons, addProduct, promoteProductToAddOn } = useInventory()
  const { occasions } = useScheduling()
  const [returnTo, setReturnTo] = useState('/admin/inventory/products')
  const isCafeAndFoodMode = searchParams.get('productType') === 'cafe&food'
  const isShopMode = searchParams.get('productType') === 'shop'
  const isGiftsMode = searchParams.get('productType') === 'gifts'
  const isRentalsMode = searchParams.get('productType') === 'rentals'
  const requestedCategoryId = searchParams.get('categoryId')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const target = new URLSearchParams(window.location.search).get('returnTo')?.trim()
    if (!target || !target.startsWith('/')) return
    setReturnTo(target)
  }, [])

  const categories = useMemo(() => {
    return productCategories.slice().sort((a, b) => a.displayOrder - b.displayOrder)
  }, [productCategories])

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

  const rentalsRootCategory = useMemo(() => {
    return categories.find(
      (category) =>
        (category.productType ?? '').toLowerCase() === 'rentals' &&
        (category.parentId == null || category.parentId === ''),
    )
  }, [categories])

  const rentalsSubCategories = useMemo(() => {
    if (!rentalsRootCategory) return []
    return categories.filter((category) => category.parentId === rentalsRootCategory.id)
  }, [categories, rentalsRootCategory])

  const initialGiftCategoryId = useMemo(() => {
    const requested = requestedCategoryId?.trim()
    if (requested && giftsSubCategories.some((category) => category.id === requested)) {
      return requested
    }
    return giftsSubCategories[0]?.id ?? giftsRootCategory?.id ?? ''
  }, [giftsRootCategory?.id, giftsSubCategories, requestedCategoryId])

  const initialRentalCategoryId = useMemo(() => {
    const requested = requestedCategoryId?.trim()
    if (requested && rentalsSubCategories.some((category) => category.id === requested)) {
      return requested
    }
    return rentalsSubCategories[0]?.id ?? rentalsRootCategory?.id ?? ''
  }, [rentalsRootCategory?.id, rentalsSubCategories, requestedCategoryId])

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
  const [giftDraft, setGiftDraft] = useState<GiftProductDraft>({
    name: '',
    sku: '',
    description: '',
    categoryId: initialGiftCategoryId,
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
    isActive: true,
  })
  const parsedGiftBasketCapacity = useMemo(
    () => toIntOrUndefined(giftDraft.basketCapacity),
    [giftDraft.basketCapacity],
  )

  useEffect(() => {
    if (!isGiftsMode || !initialGiftCategoryId) return
    setGiftDraft((prev) => {
      if (prev.categoryId && giftsSubCategories.some((category) => category.id === prev.categoryId)) {
        return prev
      }
      return { ...prev, categoryId: initialGiftCategoryId }
    })
  }, [giftsSubCategories, initialGiftCategoryId, isGiftsMode])

  useEffect(() => {
    if (!isRentalsMode || !initialRentalCategoryId) return
    setDraft((prev) => {
      if (prev.categoryId && rentalsSubCategories.some((category) => category.id === prev.categoryId)) {
        return { ...prev, isRental: true }
      }
      return {
        ...prev,
        categoryId: initialRentalCategoryId,
        isRental: true,
      }
    })
  }, [initialRentalCategoryId, isRentalsMode, rentalsSubCategories])

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

  function persistCreate() {
    if (isGiftsMode) {
      const parsedBasketCapacity = toIntOrUndefined(giftDraft.basketCapacity)
      if (parsedBasketCapacity == null || parsedBasketCapacity < 0) {
        toast({
          title: 'Invalid basket capacity',
          description: 'Enter a valid basket capacity before creating a gift product.',
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

      const nowIso = new Date().toISOString()
      const id = `prod-admin-${Date.now()}`
      const resolvedCategoryId = giftDraft.categoryId || initialGiftCategoryId
      const created: Product = {
        id,
        tenantId: 'tenant-1',
        categoryId: resolvedCategoryId,
        name: giftDraft.name.trim() || 'New gift product',
        slug: slugify(giftDraft.name) || id,
        description: giftDraft.description.trim() || undefined,
        sku: giftDraft.sku.trim() || undefined,
        price: toNumberOrUndefined(giftDraft.price) ?? 0,
        memberPrice: toNumberOrUndefined(giftDraft.memberPrice),
        costPrice: toNumberOrUndefined(giftDraft.costPrice),
        compareAtPrice: toNumberOrUndefined(giftDraft.compareAtPrice) ?? null,
        taxable: giftDraft.taxable,
        taxRate: toNumberOrUndefined(giftDraft.taxRate) ?? 20,
        trackInventory: false,
        stockCount: 0,
        lowStockThreshold: 0,
        allowBackorders: false,
        availableOnline: giftDraft.isActive,
        availablePOS: true,
        isActive: true,
        isFeatured: false,
        imageUrl: giftDraft.imageUrl.trim() || undefined,
        galleryImages: [],
        createdAt: nowIso,
        updatedAt: nowIso,
        giftProductIds: giftDraft.productIds,
        giftAddOnProductIds: giftDraft.addOnProductIds,
        giftVoucherCouponIds: giftDraft.couponIds,
        giftCouponsWithPackage: giftDraft.couponsWithPackage,
        isPerishable: giftDraft.isPerishable,
        basketCapacity: parsedBasketCapacity,
        giftPriceUpperLimit: toNumberOrUndefined(giftDraft.giftPriceUpperLimit) ?? null,
        giftOccasionId: giftDraft.occasionId || null,
      }
      addProduct(created)
      router.push(returnTo)
      return
    }

    if (isRentalsMode) {
      if (!draft.rentalBillingType) {
        toast({
          title: 'Rental billing required',
          description: 'Select a rental billing type before creating a rental product.',
          variant: 'destructive',
        })
        return
      }
      const patch = draftToProductPatch({ ...draft, isRental: true })
      const resolvedRentalPrice =
        draft.rentalBillingType === 'PER_DAY'
          ? toNumberOrUndefined(draft.rentalPricePerDay)
          : draft.rentalBillingType === 'PER_HALF_DAY'
            ? toNumberOrUndefined(draft.rentalPricePerHalfDay)
            : draft.rentalBillingType === 'PER_HOUR'
              ? toNumberOrUndefined(draft.rentalPriceFirstHourPremium) ??
                toNumberOrUndefined(draft.rentalPricePerHour)
              : draft.rentalBillingType === 'PER_EVENT'
                ? toNumberOrUndefined(draft.rentalPricePerEvent)
                : undefined
      const nowIso = new Date().toISOString()
      const id = `prod-admin-${Date.now()}`
      const created: Product = {
        id,
        tenantId: 'tenant-1',
        categoryId: patch.categoryId ?? initialRentalCategoryId,
        name: patch.name ?? 'New rental product',
        slug: slugify(patch.name ?? '') || id,
        description: patch.description,
        sku: patch.sku,
        price: resolvedRentalPrice ?? 0,
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
        isRental: true,
        rentalBillingType: patch.rentalBillingType,
        rentalPricePerDay: patch.rentalPricePerDay,
        rentalPricePerHalfDay: patch.rentalPricePerHalfDay,
        pricePerHour: patch.pricePerHour,
        pricePerEvent: patch.pricePerEvent,
        priceFirstHourPremium: patch.priceFirstHourPremium,
        minHours: patch.minHours,
        rentalHourlyTierPrices: patch.rentalHourlyTierPrices,
        rentalDailyTierPrices: patch.rentalDailyTierPrices,
        requiresDelivery: patch.requiresDelivery ?? false,
        requiresStaff: patch.requiresStaff ?? false,
        setupMinutes: patch.setupMinutes,
        maxRentalDays: patch.maxRentalDays,
        rentalSlotIncrementMinutes: patch.rentalSlotIncrementMinutes,
        depositAmount: patch.depositAmount,
      }
      addProduct(created)
      router.push(returnTo)
      return
    }

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
    router.push(returnTo)
  }

  if (isCafeAndFoodMode) {
    return <CafeProductEditor mode="create" />
  }

  if (isShopMode) {
    return <ShopProductEditor mode="create" />
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
            {isGiftsMode ? 'New gift product' : isRentalsMode ? 'New rental product' : 'New product'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isGiftsMode
              ? 'Create a gift product with gifts-only fields.'
              : isRentalsMode
                ? 'Create a rental product with complete rental settings.'
              : 'Create a new shop product.'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product details</CardTitle>
          <CardDescription>
            {isGiftsMode
              ? 'Category is fixed to Gifts; choose a sub-category and product links.'
              : isRentalsMode
                ? 'Category is fixed to Rentals; choose a sub-category and configure rental settings.'
              : 'Use the same fields as the previous create modal.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isGiftsMode ? (
            <GiftProductForm
              value={giftDraft}
              onChange={setGiftDraft}
              giftsCategoryName={giftsRootCategory?.name ?? 'Gifts'}
              subCategories={giftsSubCategories}
              productOptions={products
                .filter((product) => product.isActive)
                .map((product) => ({
                  id: product.id,
                  name: product.name,
                  sku: product.sku,
                  imageUrl: product.imageUrl,
                  description: product.description,
                  price: product.memberPrice ?? product.price,
                }))}
              addOnOptions={products
                .filter((product) => product.isActive)
                .map((product) => ({
                  id: product.id,
                  name: product.name,
                  sku: product.sku,
                  imageUrl: product.imageUrl,
                  description: product.description,
                  price: product.memberPrice ?? product.price,
                }))}
              couponOptions={coupons.filter((coupon) => coupon.isActive)}
              occasions={occasions}
            />
          ) : isRentalsMode ? (
            <RentalProductForm
              value={{ ...draft, isRental: true }}
              onChange={setDraft}
              rentalsCategoryName={rentalsRootCategory?.name ?? 'Rentals'}
              subCategories={rentalsSubCategories}
            />
          ) : (
            <ProductForm value={draft} onChange={setDraft} categories={categories} />
          )}
          <div className="flex items-center justify-end gap-2">
            <Link href={returnTo}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button
              onClick={persistCreate}
              disabled={
                (isGiftsMode &&
                  (
                    giftDraft.categoryId.trim().length === 0 ||
                    parsedGiftBasketCapacity == null ||
                    parsedGiftBasketCapacity < 0 ||
                    giftDraft.productIds.length !== parsedGiftBasketCapacity
                  )) ||
                (isRentalsMode &&
                  (
                    draft.categoryId.trim().length === 0 ||
                    !draft.rentalBillingType
                  ))
              }
            >
              Create
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminInventoryProductsNewPage() {
  return (
    <Suspense>
      <AdminInventoryProductsNewPageInner />
    </Suspense>
  )
}
