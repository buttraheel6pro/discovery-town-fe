/** Play sub-category URL helpers — one route per scheduling category. */

export function getPlayCategoryHref(categoryId: string): string {
  return `/play/${encodeURIComponent(categoryId)}`
}

export function decodePlayCategoryParam(param: string): string {
  return decodeURIComponent(param)
}
