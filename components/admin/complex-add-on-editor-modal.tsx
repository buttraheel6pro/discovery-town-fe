/** Complex add-on create/edit — cafe product editor inside a large admin modal. */
'use client'

import { useEffect, useMemo, useState } from 'react'

import { CrudModal } from '@/components/admin/crud-modal'
import { CafeProductForm } from '@/components/admin/cafe-product-form'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { createEmptyCafeProduct, useCafe } from '@/lib/cafe-store'
import { cafeCategoryFromInventoryCategoryId } from '@/lib/cafe-utils'
import { cafeProductSchema } from '@/lib/schemas/cafe'
import { useInventory } from '@/lib/inventory-store'
import type { AddOn, AttributeGroup, CafeProduct, Product } from '@/lib/types'

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function inventoryProductToCafeProduct(
  product: Product,
  categoryId: string,
  productCategories: readonly { id: string; productType?: string; parentId?: string | null }[],
  existingCafe: CafeProduct | null,
): CafeProduct {
  if (existingCafe) {
    return { ...existingCafe }
  }
  return createEmptyCafeProduct({
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: cafeCategoryFromInventoryCategoryId(categoryId, productCategories),
    basePrice: product.memberPrice ?? product.price,
    stockCount: product.stockCount,
    description: product.description,
    imageUrl: product.imageUrl,
    isActive: product.isActive,
    isAvailable: true,
  })
}

export interface ComplexAddOnEditorModalProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly mode: 'create' | 'edit'
  readonly editAddOn?: AddOn | null
  readonly onSaved?: () => void
}

export function ComplexAddOnEditorModal({
  open,
  onOpenChange,
  mode,
  editAddOn = null,
  onSaved,
}: Readonly<ComplexAddOnEditorModalProps>) {
  const { toast } = useToast()
  const {
    products,
    productCategories,
    addProduct,
    updateProduct,
    updateBookingAddOn,
    promoteProductToAddOn,
  } = useInventory()
  const {
    cafeProducts,
    upsertCafeProduct,
    modifierGroups,
    attributeGroups,
    rotationGroups,
  } = useCafe()

  const [draft, setDraft] = useState<CafeProduct>(() => createEmptyCafeProduct())
  const [attrErrors, setAttrErrors] = useState<Record<string, string>>({})
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('')

  const inventoryProduct = useMemo(() => {
    if (mode !== 'edit' || !editAddOn?.inventoryProductId) {
      return null
    }
    return products.find((product) => product.id === editAddOn.inventoryProductId) ?? null
  }, [editAddOn?.inventoryProductId, mode, products])

  const existingCafeProduct = useMemo(() => {
    if (!inventoryProduct) {
      return null
    }
    return cafeProducts.find((product) => product.id === inventoryProduct.id) ?? null
  }, [cafeProducts, inventoryProduct])

  const cafeSubCategoryOptions = useMemo(
    () =>
      productCategories
        .filter(
          (category) =>
            (category.productType ?? '').toLowerCase() === 'cafe&food' &&
            category.parentId !== null,
        )
        .map((category) => ({ id: category.id, name: category.name })),
    [productCategories],
  )

  const defaultSubCategoryId = useMemo(
    () => cafeSubCategoryOptions[0]?.id ?? '',
    [cafeSubCategoryOptions],
  )

  useEffect(() => {
    if (!open) {
      return
    }
    if (mode === 'create') {
      setDraft(createEmptyCafeProduct())
      setAttrErrors({})
      setSelectedSubCategoryId(defaultSubCategoryId)
      return
    }
    if (!inventoryProduct) {
      setDraft(createEmptyCafeProduct())
      setSelectedSubCategoryId(defaultSubCategoryId)
      return
    }
    setSelectedSubCategoryId(inventoryProduct.categoryId)
    setDraft(
      inventoryProductToCafeProduct(
        inventoryProduct,
        inventoryProduct.categoryId,
        productCategories,
        existingCafeProduct,
      ),
    )
    setAttrErrors({})
  }, [
    defaultSubCategoryId,
    existingCafeProduct,
    inventoryProduct,
    mode,
    open,
    productCategories,
  ])

  useEffect(() => {
    if (!selectedSubCategoryId) {
      return
    }
    const cafeCategory = cafeCategoryFromInventoryCategoryId(
      selectedSubCategoryId,
      productCategories,
    )
    setDraft((current) =>
      current.category === cafeCategory ? current : { ...current, category: cafeCategory },
    )
  }, [productCategories, selectedSubCategoryId])

  function handleSubCategoryChange(nextCategoryId: string): void {
    setSelectedSubCategoryId(nextCategoryId)
    const cafeCategory = cafeCategoryFromInventoryCategoryId(
      nextCategoryId,
      productCategories,
    )
    setDraft((current) => ({ ...current, category: cafeCategory }))
  }

  function handleSave(): void {
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
        description: 'Select a Cafe & Food sub-category before saving this add-on.',
        variant: 'destructive',
      })
      return
    }

    const cafeCategory = cafeCategoryFromInventoryCategoryId(
      selectedSubCategoryId,
      productCategories,
    )
    const nowIso = new Date().toISOString()
    const productToSave = cafeProductSchema.parse({
      ...draft,
      category: cafeCategory,
      updatedAt: nowIso,
    })
    upsertCafeProduct(productToSave)

    const tenantId = products[0]?.tenantId ?? 'tenant-1'
    const inventoryPatch: Product = {
      id: productToSave.id,
      tenantId,
      categoryId: selectedSubCategoryId,
      name: productToSave.name.trim() || 'Complex add-on',
      slug: slugify(productToSave.name) || productToSave.id,
      description: productToSave.description?.trim() || undefined,
      sku: productToSave.sku?.trim() || undefined,
      price: productToSave.basePrice,
      memberPrice: productToSave.basePrice,
      stockCount: productToSave.stockCount ?? 0,
      lowStockThreshold: 10,
      allowBackorders: false,
      isActive: inventoryProduct?.isActive ?? true,
      availableOnline: true,
      isFeatured: false,
      canBeAddOn: true,
      linkedAddOnId: editAddOn?.id ?? inventoryProduct?.linkedAddOnId ?? undefined,
      imageUrl: productToSave.imageUrl,
      createdAt: inventoryProduct?.createdAt ?? productToSave.createdAt ?? nowIso,
      updatedAt: nowIso,
    }

    if (mode === 'edit' && inventoryProduct) {
      updateProduct(inventoryProduct.id, inventoryPatch)
      if (editAddOn) {
        updateBookingAddOn(editAddOn.id, {
          name: productToSave.name.trim(),
          description: productToSave.description?.trim() || undefined,
          price: productToSave.basePrice,
          memberPrice: productToSave.basePrice,
          structureType: 'COMPLEX',
          referenceType: 'PRODUCT',
          inventoryProductId: inventoryProduct.id,
        })
      }
      toast({ title: 'Complex add-on updated' })
      onOpenChange(false)
      onSaved?.()
      return
    }

    addProduct(inventoryPatch)
    const promoted = promoteProductToAddOn(productToSave.id, inventoryPatch)
    if (!promoted.ok) {
      toast({
        title: 'Add-on not linked',
        description: promoted.message ?? 'Could not link the product to the add-on catalog.',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Complex add-on created',
      description: `${productToSave.name} is linked to the add-on catalog.`,
    })
    onOpenChange(false)
    onSaved?.()
  }

  const title = mode === 'edit' ? 'Edit complex add-on' : 'New complex add-on'
  const saveLabel = mode === 'edit' ? 'Save changes' : 'Create add-on'

  return (
    <CrudModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Configure a cafe-style product with modifiers, attributes, and availability."
      size="lg"
      variant={mode === 'edit' ? 'edit' : 'create'}
      className="sm:max-w-5xl"
      bodyClassName="px-4 py-4 sm:px-6"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={mode === 'edit' && !inventoryProduct}
          >
            {saveLabel}
          </Button>
        </>
      }
    >
      {mode === 'edit' && !inventoryProduct ? (
        <p className="text-sm text-muted-foreground">
          This complex add-on has no linked inventory product to edit.
        </p>
      ) : null}
      {mode === 'edit' && inventoryProduct && cafeSubCategoryOptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add a Cafe &amp; Food sub-category under Inventory to edit complex add-ons.
        </p>
      ) : null}
      {cafeSubCategoryOptions.length > 0 &&
      (mode === 'create' || inventoryProduct != null) ? (
        <CafeProductForm
          value={draft}
          onChange={setDraft}
          selectedSubCategoryId={selectedSubCategoryId}
          subCategoryOptions={cafeSubCategoryOptions}
          onSubCategoryChange={handleSubCategoryChange}
          modifierGroups={modifierGroups}
          attributeGroups={attributeGroups}
          rotationGroups={rotationGroups}
          attributeErrors={attrErrors as Partial<Record<AttributeGroup['id'], string>>}
        />
      ) : null}
      {mode === 'create' && cafeSubCategoryOptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add a Cafe &amp; Food sub-category under Inventory before creating complex add-ons.
        </p>
      ) : null}
    </CrudModal>
  )
}
