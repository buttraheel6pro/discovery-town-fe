/** Events sub-category URL helpers — one route per scheduling category. */

export function getEventsCategoryHref(categoryId: string): string {
  return `/events/${encodeURIComponent(categoryId)}`
}

export function decodeEventsCategoryParam(param: string): string {
  return decodeURIComponent(param)
}

export function isEventsCategoryRouteParam(param: string): boolean {
  return param.startsWith('cat-')
}
