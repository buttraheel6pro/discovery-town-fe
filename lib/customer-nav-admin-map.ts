/** Map admin catalog sidebar groups to customer navbar setting keys. */
import { productTypeToNavLabelKey, type CustomerNavLabelKey } from '@/lib/customer-nav-labels'
import type { SchedulingTopLevelId } from '@/lib/scheduling-consumer-categories'

export function schedulingTopLevelToNavKey(
  topLevelId: SchedulingTopLevelId,
): CustomerNavLabelKey {
  switch (topLevelId) {
    case 'GYM':
      return 'gym'
    case 'PLAY':
      return 'play'
    case 'EVENT':
      return 'events'
    default:
      return 'events'
  }
}

export function productTypeToCustomerNavKey(productType: string): CustomerNavLabelKey | null {
  return productTypeToNavLabelKey(productType)
}
