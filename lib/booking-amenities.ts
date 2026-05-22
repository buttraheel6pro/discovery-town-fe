/** Merges facility amenities with free category-linked add-ons for display. */
import type { SchedulingServiceAddOn } from '@/lib/types'

export function buildBookingAmenityLabels(
  serviceAmenities: readonly string[] | undefined,
  freeCategoryAddOns: readonly SchedulingServiceAddOn[],
): string[] {
  const labels: string[] = []
  const seen = new Set<string>()

  for (const item of serviceAmenities ?? []) {
    const trimmed = item.trim()
    if (!trimmed || seen.has(trimmed)) {
      continue
    }
    seen.add(trimmed)
    labels.push(trimmed)
  }

  for (const addOn of freeCategoryAddOns) {
    const name = addOn.name.trim()
    if (!name || seen.has(name)) {
      continue
    }
    seen.add(name)
    labels.push(name)
  }

  return labels
}
