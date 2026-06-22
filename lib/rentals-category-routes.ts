/** Rentals sub-category URL helpers — one route per product category slug. */

export function getRentalsCategoryHref(categorySlug: string): string {
  return `/rentals/${encodeURIComponent(categorySlug)}`
}

export function decodeRentalsCategoryParam(param: string): string {
  return decodeURIComponent(param)
}
