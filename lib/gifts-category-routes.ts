/** Gifts sub-category URL helpers — category pages live under /gifts/category/[slug]. */

export function getGiftsCategoryHref(categorySlug: string): string {
  return `/gifts/category/${encodeURIComponent(categorySlug)}`
}

export function decodeGiftsCategoryParam(param: string): string {
  return decodeURIComponent(param)
}

export function resolveGiftsCategorySlug(param: string): string {
  return decodeGiftsCategoryParam(param)
}
