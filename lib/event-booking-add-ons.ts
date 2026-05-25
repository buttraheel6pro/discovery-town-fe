/** Events party booking — evt-addon catalog helpers and configuration pricing. */
import {
  modifierGroupsForProduct,
  modifiersSatisfied,
  sumModifierDeltaForGroups,
  toCartModifierSelections,
} from '@/lib/cafe-utils'
import { isComplexAddOn } from '@/lib/add-on-structure'
import type { EventPackageOptionalAddOn } from '@/lib/mock-data'
import {
  EVT_ADDON_IMAGE_BY_PRODUCT_ID,
} from '@/lib/mock-event-booking-add-ons'
import type {
  AddOn,
  AttributeGroup,
  AttributeOption,
  CafeProduct,
  CartModifierSelection,
  EventPackage,
  ModifierGroup,
  Product,
} from '@/lib/types'

export const EVENT_ADDON_PLACEHOLDER_IMAGE = '/placeholder.svg'

export const EVENT_MODULE_ADDON_ID_PREFIX = 'evt-addon-' as const

export function isEventModuleBookingAddOnId(addOnId: string): boolean {
  return addOnId.startsWith(EVENT_MODULE_ADDON_ID_PREFIX)
}

export function getPackageIncludedAddOnIds(
  pkg: Pick<EventPackage, 'addOns'> | null,
): ReadonlySet<string> {
  if (!pkg) {
    return new Set()
  }
  return new Set(
    pkg.addOns.filter((link) => link.included).map((link) => link.addOnId),
  )
}

export interface EventBookingAddOnLine {
  readonly id: string
  readonly name: string
  readonly quantity: number
  readonly unitPrice: number
  readonly totalPrice: number
}

interface OptionalAddOnSelectionLike {
  readonly unitPrice: number
  readonly quantity: number
  readonly summary: string
}

/** Merges package-included add-ons (free) with customer optional selections. */
export function buildEventBookingAddOnLines(
  pkg: EventPackage,
  optionalSelections: Readonly<Record<string, OptionalAddOnSelectionLike>>,
  resolveName: (addOnId: string) => string,
): EventBookingAddOnLine[] {
  const lines: EventBookingAddOnLine[] = []
  const includedIds = getPackageIncludedAddOnIds(pkg)

  for (const link of pkg.addOns) {
    if (!link.included) {
      continue
    }
    lines.push({
      id: `bo-${pkg.id}-${link.addOnId}-inc`,
      name: resolveName(link.addOnId),
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    })
  }

  for (const [addOnId, selection] of Object.entries(optionalSelections)) {
    if (includedIds.has(addOnId) || selection.quantity <= 0) {
      continue
    }
    lines.push({
      id: `bo-${pkg.id}-${addOnId}-opt`,
      name: selection.summary,
      quantity: selection.quantity,
      unitPrice: selection.unitPrice,
      totalPrice: selection.unitPrice * selection.quantity,
    })
  }

  return lines
}

export interface EventOptionalAddOnListItem extends EventPackageOptionalAddOn {
  readonly bookingAddOn: AddOn
}

export function buildEventOptionalAddOnList(
  bookingAddOns: readonly AddOn[],
  catalog: readonly EventPackageOptionalAddOn[],
  excludedAddOnIds: ReadonlySet<string>,
): EventOptionalAddOnListItem[] {
  const catalogById = new Map(catalog.map((entry) => [entry.id, entry]))
  const items: EventOptionalAddOnListItem[] = []

  for (const bookingAddOn of bookingAddOns) {
    if (!isEventModuleBookingAddOnId(bookingAddOn.id)) {
      continue
    }
    if (!bookingAddOn.isActive || excludedAddOnIds.has(bookingAddOn.id)) {
      continue
    }
    const display = catalogById.get(bookingAddOn.id)
    if (!display) {
      continue
    }
    items.push({
      ...display,
      name: bookingAddOn.name,
      description: bookingAddOn.description.trim() || display.description,
      price: bookingAddOn.price,
      bookingAddOn,
    })
  }

  return items.sort((a, b) => a.name.localeCompare(b.name))
}

export function resolveEventAddOnCafeProduct(
  addOn: Pick<AddOn, 'inventoryProductId'>,
  cafeProducts: readonly CafeProduct[],
): CafeProduct | null {
  const productId = addOn.inventoryProductId?.trim()
  if (!productId) {
    return null
  }
  return cafeProducts.find((product) => product.id === productId) ?? null
}

/** Resolves display image for a complex event add-on (cafe → inventory → seed map). */
export function resolveEventAddOnImageUrl(
  addOn: Pick<AddOn, 'inventoryProductId'>,
  cafeProducts: readonly CafeProduct[],
  inventoryProducts: readonly Product[] = [],
): string {
  const productId = addOn.inventoryProductId?.trim()
  const fromCafe = resolveEventAddOnCafeProduct(addOn, cafeProducts)?.imageUrl?.trim()
  if (fromCafe && fromCafe.length > 0) {
    return fromCafe
  }
  if (productId) {
    const fromInventory = inventoryProducts
      .find((product) => product.id === productId)
      ?.imageUrl?.trim()
    if (fromInventory && fromInventory.length > 0) {
      return fromInventory
    }
    const fromSeed = EVT_ADDON_IMAGE_BY_PRODUCT_ID[productId]
    if (fromSeed) {
      return fromSeed
    }
  }
  return EVENT_ADDON_PLACEHOLDER_IMAGE
}

export interface EventAddOnAttributeSelection {
  readonly groupName: string
  readonly optionLabel: string
}

export interface EventAddOnConfigurationInput {
  readonly selectedByGroup: Record<string, string[]>
  readonly selectedAttributesByGroup: Record<string, string[]>
  readonly customerNote: string
}

export interface EventAddOnConfigurationResult {
  readonly unitPrice: number
  readonly summary: string
  readonly selectedModifiers: CartModifierSelection[]
  readonly selectedAttributes: EventAddOnAttributeSelection[]
  readonly selectedByGroup: Record<string, string[]>
  readonly selectedAttributesByGroup: Record<string, string[]>
  readonly customerNote: string | null
}

export function buildEventAddOnConfiguration(
  addOn: AddOn,
  cafeProduct: CafeProduct | null,
  modifierGroups: readonly ModifierGroup[],
  attributeGroups: readonly AttributeGroup[],
  input: EventAddOnConfigurationInput,
): EventAddOnConfigurationResult | null {
  const basePrice = cafeProduct?.basePrice ?? addOn.price
  const groups =
    cafeProduct !== null ? modifierGroupsForProduct(cafeProduct, [...modifierGroups]) : []

  if (groups.length > 0 && !modifiersSatisfied(groups, input.selectedByGroup)) {
    return null
  }

  const modifierDelta = sumModifierDeltaForGroups(groups, input.selectedByGroup)
  const selectedModifiers = toCartModifierSelections(groups, input.selectedByGroup)
  const selectedAttributes = flattenAttributeSelections(
    cafeProduct,
    attributeGroups,
    input.selectedAttributesByGroup,
  )

  const unitPrice = Math.round((basePrice + modifierDelta) * 100) / 100
  const summary = formatEventAddOnConfigurationSummary(
    addOn.name,
    selectedModifiers,
    selectedAttributes,
    input.customerNote,
  )

  return {
    unitPrice,
    summary,
    selectedModifiers,
    selectedAttributes,
    selectedByGroup: { ...input.selectedByGroup },
    selectedAttributesByGroup: { ...input.selectedAttributesByGroup },
    customerNote: input.customerNote.trim().length > 0 ? input.customerNote.trim() : null,
  }
}

function flattenAttributeSelections(
  cafeProduct: CafeProduct | null,
  attributeGroups: readonly AttributeGroup[],
  selectedByGroup: Record<string, string[]>,
): EventAddOnAttributeSelection[] {
  if (!cafeProduct) {
    return []
  }

  const out: EventAddOnAttributeSelection[] = []
  for (const group of attributeGroups) {
    const allowedIds = cafeProduct.attributeGroups[group.id] ?? []
    const selectedIds = selectedByGroup[group.id] ?? []
    for (const optionId of selectedIds) {
      if (!allowedIds.includes(optionId)) {
        continue
      }
      const option = group.options.find((row) => row.id === optionId)
      if (!option) {
        continue
      }
      out.push({
        groupName: group.name,
        optionLabel: formatAttributeOptionLabel(option),
      })
    }
  }
  return out
}

function formatAttributeOptionLabel(option: AttributeOption): string {
  const emoji = option.emoji?.trim() ?? ''
  return emoji.length > 0 ? `${emoji} ${option.label}` : option.label
}

export function formatEventAddOnConfigurationSummary(
  addOnName: string,
  modifiers: readonly CartModifierSelection[],
  attributes: readonly EventAddOnAttributeSelection[],
  customerNote: string,
): string {
  const parts: string[] = [addOnName]
  for (const row of modifiers) {
    parts.push(row.modifierName)
  }
  for (const row of attributes) {
    parts.push(`${row.groupName}: ${row.optionLabel}`)
  }
  const note = customerNote.trim()
  if (note.length > 0) {
    parts.push(`Note: ${note}`)
  }
  return parts.join(' · ')
}

export function isEventAddOnConfiguratorRequired(
  addOn: AddOn,
  cafeProduct: CafeProduct | null,
): boolean {
  return isComplexAddOn(addOn) && cafeProduct !== null
}
