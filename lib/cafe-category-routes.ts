/** Cafe & Food sub-category URL helpers — one route per product category slug. */

/** Legacy cafe URLs → current inventory slugs. */
const LEGACY_CAFE_CATEGORY_SLUG_ALIASES: Record<string, string> = {
  coffee: 'classic-coffee-hot',
  specialty: 'specialty-drinks',
  pastries: 'pasteries-baked-goods',
  sweets: 'sweets-treats',
  'cafe-pizza': 'pizza',
  'cafe-sandwiches': 'sandwiches',
}

export function getCafeCategoryHref(categorySlug: string): string {
  return `/cafe/${encodeURIComponent(categorySlug)}`
}

export function decodeCafeCategoryParam(param: string): string {
  return decodeURIComponent(param)
}

export function resolveCafeCategorySlug(param: string): string {
  const decoded = decodeCafeCategoryParam(param)
  return LEGACY_CAFE_CATEGORY_SLUG_ALIASES[decoded] ?? decoded
}
