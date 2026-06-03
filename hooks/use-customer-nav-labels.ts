/** Hook for resolved customer navbar labels and admin save/reset actions. */
import { useCustomerNavLabelsContext } from '@/lib/customer-nav-labels-provider'

export function useCustomerNavLabels() {
  return useCustomerNavLabelsContext()
}
