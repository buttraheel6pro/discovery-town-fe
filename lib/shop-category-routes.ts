/** Shop sub-category URL helpers — category pages live under /shop/category/[slug]. */

export function getShopCategoryHref(categorySlug: string): string {
  return `/shop/category/${encodeURIComponent(categorySlug)}`
}

export function decodeShopCategoryParam(param: string): string {
  return decodeURIComponent(param)
}

export function resolveShopCategorySlug(param: string): string {
  return decodeShopCategoryParam(param)
}
