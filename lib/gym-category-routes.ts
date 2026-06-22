/** Gym sub-category URL helpers — one route per scheduling category. */

export function getGymCategoryHref(categoryId: string): string {
  return `/gym/${encodeURIComponent(categoryId)}`
}

export function decodeGymCategoryParam(param: string): string {
  return decodeURIComponent(param)
}
