/** Product detail URLs, cart-added toast, and navigation back to catalog listings. */

const CART_ADDED_TOAST_STORAGE_KEY = 'discovery-town:cart-added-toast'

export const CART_ADDED_TOAST_DURATION_MS = 3500

export function buildProductDetailHref(
  productId: string,
  listingBackHref: string,
): string {
  return `/shop/${productId}?from=${encodeURIComponent(listingBackHref)}`
}

export function resolveListingBackHrefFromSearch(
  fromParam: string | null,
  fallbackHref: string,
): string {
  if (fromParam && fromParam.startsWith('/') && !fromParam.startsWith('//')) {
    return fromParam
  }
  return fallbackHref
}

export function getAddedToCartToastContent(itemName?: string | null): {
  title: string
  description: string
} {
  const trimmedName = itemName?.trim()
  if (trimmedName) {
    return {
      title: 'Added to cart',
      description: `${trimmedName} was added to your cart.`,
    }
  }
  return {
    title: 'Added to cart',
    description: 'Your item was added to your cart.',
  }
}

function queueCartAddedToast(itemName?: string | null): void {
  if (typeof window === 'undefined') {
    return
  }
  sessionStorage.setItem(
    CART_ADDED_TOAST_STORAGE_KEY,
    JSON.stringify({ itemName: itemName?.trim() || null }),
  )
}

export function consumeQueuedCartAddedToast(): { itemName: string | null } | null {
  if (typeof window === 'undefined') {
    return null
  }
  const raw = sessionStorage.getItem(CART_ADDED_TOAST_STORAGE_KEY)
  if (!raw) {
    return null
  }
  sessionStorage.removeItem(CART_ADDED_TOAST_STORAGE_KEY)
  try {
    const parsed = JSON.parse(raw) as { itemName?: string | null }
    return { itemName: parsed.itemName?.trim() || null }
  } catch {
    return { itemName: null }
  }
}

export interface NavigateToListingAfterCartAddOptions {
  readonly itemName?: string | null
}

export function navigateToListingAfterCartAdd(
  router: { replace: (href: string) => void },
  href: string,
  options?: NavigateToListingAfterCartAddOptions,
): void {
  queueCartAddedToast(options?.itemName)
  router.replace(href)
}
