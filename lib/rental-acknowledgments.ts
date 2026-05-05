/** Build rental checkout acknowledgment options from cart lines and category config. */

import { isRentalProduct } from '@/lib/rental-product'
import type {
  CartItem,
  Product,
  ProductCategory,
  RentalAcknowledgmentCheckoutOption,
  RentalCategoryAcknowledgment,
} from '@/lib/types'

const ACK_ID_SEP = '\u001f'

/**
 * Stable cart / order value for a rental acknowledgment (matches legacy plain-text ids
 * when there is no detail URL).
 */
export function rentalAcknowledgmentCartId(
  text: string,
  detailUrl?: string | null,
): string {
  const trimmedUrl = detailUrl?.trim() ?? ''
  if (trimmedUrl.length > 0) {
    return `${text}${ACK_ID_SEP}${trimmedUrl}`
  }
  return text
}

/** Accept legacy `string` entries and current `{ text, detailUrl? }` objects. */
export function parseCategoryAcknowledgment(
  entry: unknown,
): RentalCategoryAcknowledgment | null {
  if (typeof entry === 'string') {
    const text = entry.trim()
    return text.length > 0 ? { text } : null
  }
  if (!entry || typeof entry !== 'object') return null
  const rec = entry as Record<string, unknown>
  const textRaw = rec.text
  if (typeof textRaw !== 'string') return null
  const text = textRaw.trim()
  if (text.length === 0) return null
  const urlRaw = rec.detailUrl
  if (typeof urlRaw === 'string') {
    const u = urlRaw.trim()
    if (u.length > 0) {
      return { text, detailUrl: u }
    }
  }
  return { text }
}

/** Form row state for admin sub-category modal. */
export function rentalAcknowledgmentsToFormRows(
  list: readonly unknown[] | undefined,
): { text: string; detailUrl: string }[] {
  if (!list || list.length === 0) {
    return [{ text: '', detailUrl: '' }]
  }
  const rows: { text: string; detailUrl: string }[] = []
  for (const entry of list) {
    const parsed = parseCategoryAcknowledgment(entry)
    if (!parsed) continue
    rows.push({
      text: parsed.text,
      detailUrl: typeof parsed.detailUrl === 'string' ? parsed.detailUrl : '',
    })
  }
  return rows.length > 0 ? rows : [{ text: '', detailUrl: '' }]
}

/**
 * Unique checkout options from rental cart lines, in stable order.
 */
export function collectRentalAcknowledgmentOptions(
  items: readonly CartItem[],
  products: readonly Product[],
  productCategories: readonly ProductCategory[],
): RentalAcknowledgmentCheckoutOption[] {
  const categoryById = new Map(productCategories.map((c) => [c.id, c]))
  const seen = new Set<string>()
  const out: RentalAcknowledgmentCheckoutOption[] = []

  for (const item of items) {
    if (item.type !== 'product') continue
    const productId = item.metadata?.productId
    if (typeof productId !== 'string') continue
    const product = products.find((p) => p.id === productId) ?? null
    if (!product || !isRentalProduct(product)) continue
    const cat = categoryById.get(product.categoryId) ?? null
    const acks = cat?.rentalAcknowledgments ?? []
    for (const raw of acks) {
      const parsed = parseCategoryAcknowledgment(raw)
      if (!parsed) continue
      const id = rentalAcknowledgmentCartId(parsed.text, parsed.detailUrl)
      if (seen.has(id)) continue
      seen.add(id)
      const detailUrl = parsed.detailUrl?.trim()
      out.push({
        id,
        label: parsed.text,
        ...(detailUrl && detailUrl.length > 0 ? { detailUrl } : {}),
      })
    }
  }

  return out
}

/** Admin form rows → persisted category acknowledgments (trim, dedupe). */
export function normalizeRentalAcknowledgmentFormRows(
  rows: readonly { text: string; detailUrl: string }[],
): RentalCategoryAcknowledgment[] {
  const seen = new Set<string>()
  const out: RentalCategoryAcknowledgment[] = []
  for (const row of rows) {
    const t = row.text.trim()
    if (t.length === 0) continue
    const u = row.detailUrl.trim()
    const detailUrl = u.length > 0 ? u : undefined
    const dedupeKey = rentalAcknowledgmentCartId(t, detailUrl ?? null)
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    out.push(detailUrl ? { text: t, detailUrl } : { text: t })
  }
  return out
}
