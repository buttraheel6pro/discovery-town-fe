/** Events placed product sub-category URL helpers — e.g. Take Out Party on Events. */

export function getEventsProductCategoryHref(categorySlug: string): string {
  return `/events/${encodeURIComponent(categorySlug)}`
}

export function decodeEventsProductCategoryParam(param: string): string {
  return decodeURIComponent(param)
}
