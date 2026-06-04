/** Shop module helpers — sub-category attribute templates and product detection. */

import type {
  AttributeGroup,
  AttributeOption,
  Product,
  ProductCategory,
  ShopProductVariant,
} from '@/lib/types'

import { newAdminEntityId } from '@/lib/scheduling-admin-builders'

function opt(label: string): AttributeOption {
  return {
    id: newAdminEntityId('opt'),
    label,
    emoji: '',
    color: 'muted',
  }
}

function group(
  name: string,
  selectionType: 'single' | 'multiple',
  options: string[],
  overrides?: Partial<AttributeGroup>,
): AttributeGroup {
  return {
    id: newAdminEntityId('sag'),
    name,
    selectionType,
    maxSelect: selectionType === 'multiple' ? options.length : undefined,
    isRequired: true,
    options: options.map((label) => opt(label)),
    ...overrides,
  }
}

/** Pre-seeded attribute groups when admin picks a shop sub-category (ids regenerated per load). */
export function shopAttributeTemplateForSubCategoryId(subCategoryId: string): AttributeGroup[] {
  const templates: Record<string, () => AttributeGroup[]> = {
    'pcat-shop-toys': () => [
      group('Color', 'single', ['Red', 'Blue', 'Green', 'Yellow', 'Multi'], {
        isVariantDimension: true,
      }),
      group('Size', 'single', ['Small', 'Medium', 'Large'], { isVariantDimension: true }),
    ],
    'pcat-shop-clothes': () => [
      group('Size', 'single', ['XS', 'S', 'M', 'L', 'XL', 'XXL'], { isVariantDimension: true }),
      group('Color', 'single', ['Black', 'White', 'Navy', 'Grey', 'Beige', 'Olive'], {
        isVariantDimension: true,
      }),
    ],
    'pcat-shop-furniture': () => [
      group('Dimensions', 'single', ['Compact', 'Standard', 'Large'], { isVariantDimension: true }),
      group('Material', 'single', ['Wood', 'Metal', 'Glass', 'Plastic', 'Mixed']),
      group('Color / Finish', 'single', ['Oak', 'Walnut', 'Matte black', 'White', 'Grey'], {
        isVariantDimension: true,
      }),
      group('Weight capacity', 'single', ['Up to 50 kg', 'Up to 100 kg', 'Up to 150 kg', 'Heavy duty']),
      group('Assembly required', 'single', ['Yes', 'No']),
    ],
  }

  const builder = templates[subCategoryId]
  return builder ? builder() : []
}

export function isShopProduct(product: Product, categories: ProductCategory[]): boolean {
  const cat = categories.find((c) => c.id === product.categoryId)
  return cat?.productType === 'shop'
}

export function resolveShopAttributeGroups(product: Product): AttributeGroup[] {
  const groups = product.shopAttributeGroups
  return Array.isArray(groups) && groups.length > 0 ? groups : []
}

export function resolveVariantDimensionGroups(groups: AttributeGroup[]): AttributeGroup[] {
  return groups.filter(
    (group) =>
      group.selectionType === 'single' &&
      group.isVariantDimension === true &&
      group.options.length > 0,
  )
}

function shopVariantKey(optionValueIdsByGroupId: Record<string, string>): string {
  return Object.keys(optionValueIdsByGroupId)
    .sort()
    .map((groupId) => `${groupId}:${optionValueIdsByGroupId[groupId]}`)
    .join('|')
}

export function generateShopVariants(
  productName: string,
  baseSku: string,
  groups: AttributeGroup[],
  existing: ShopProductVariant[],
  defaults?: { stockCount?: number; lowStockThreshold?: number },
): ShopProductVariant[] {
  const variantGroups = resolveVariantDimensionGroups(groups)
  if (variantGroups.length === 0) return []

  const combos: Array<Record<string, { id: string; label: string }>> = [{}]
  for (const group of variantGroups) {
    const next: Array<Record<string, { id: string; label: string }>> = []
    for (const combo of combos) {
      for (const option of group.options) {
        next.push({
          ...combo,
          [group.id]: { id: option.id, label: option.label },
        })
      }
    }
    combos.splice(0, combos.length, ...next)
  }

  const existingByKey = new Map(existing.map((variant) => [shopVariantKey(variant.optionValueIdsByGroupId), variant]))
  const defaultStock = defaults?.stockCount ?? 0
  const defaultLow = defaults?.lowStockThreshold ?? 2
  const skuBase =
    baseSku.trim().length > 0
      ? baseSku.trim()
      : productName.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  return combos.map((combo, index) => {
    const optionValueIdsByGroupId = Object.fromEntries(
      Object.entries(combo).map(([groupId, row]) => [groupId, row.id]),
    )
    const optionLabelsByGroupId = Object.fromEntries(
      Object.entries(combo).map(([groupId, row]) => [groupId, row.label]),
    )
    const key = shopVariantKey(optionValueIdsByGroupId)
    const prev = existingByKey.get(key)
    const suffix = Object.values(optionLabelsByGroupId)
      .map((label) => label.slice(0, 3).toUpperCase())
      .join('-')

    return {
      id: prev?.id ?? newAdminEntityId('sv'),
      sku: prev?.sku ?? `${skuBase}-${suffix || index + 1}`,
      optionValueIdsByGroupId,
      optionLabelsByGroupId,
      stockCount: prev?.stockCount ?? defaultStock,
      lowStockThreshold: prev?.lowStockThreshold ?? defaultLow,
      isActive: prev?.isActive ?? true,
      priceOverride: prev?.priceOverride,
      imageUrl: prev?.imageUrl,
      allowBackorders: prev?.allowBackorders,
      weightKg: prev?.weightKg,
      dimensionsCm: prev?.dimensionsCm
        ? {
            length: prev.dimensionsCm.length,
            width: prev.dimensionsCm.width,
            height: prev.dimensionsCm.height,
          }
        : undefined,
      description: prev?.description,
    }
  })
}
