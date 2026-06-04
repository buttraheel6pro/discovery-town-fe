/** Helpers for simple vs complex booking add-on structure. */
import type { AddOn, AddOnStructureType } from '@/lib/types'

export function resolveAddOnStructureType(
  addOn: Pick<AddOn, 'structureType' | 'inventoryProductId'>,
): AddOnStructureType {
  if (addOn.structureType === 'SIMPLE' || addOn.structureType === 'COMPLEX') {
    return addOn.structureType
  }
  return addOn.inventoryProductId ? 'COMPLEX' : 'SIMPLE'
}

export function isComplexAddOn(
  addOn: Pick<AddOn, 'structureType' | 'inventoryProductId'>,
): boolean {
  return resolveAddOnStructureType(addOn) === 'COMPLEX'
}
