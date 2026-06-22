/** Learn sub-category URL helpers — one route per scheduling category. */

export function getLearnCategoryHref(categoryId: string): string {
  return `/learn/${encodeURIComponent(categoryId)}`
}

export function decodeLearnCategoryParam(param: string): string {
  return decodeURIComponent(param)
}

export function isLearnCategoryRouteParam(param: string): boolean {
  return param.startsWith('cat-')
}
