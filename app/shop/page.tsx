/** Legacy shop route — redirects to the new Store experience. */
import { redirect } from 'next/navigation'

interface ShopPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}

function toQueryString(params: Record<string, string | string[] | undefined>): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        query.append(key, entry)
      }
      continue
    }
    if (typeof value === 'string') {
      query.set(key, value)
    }
  }
  return query.toString()
}

export default async function ShopPage({ searchParams }: Readonly<ShopPageProps>) {
  const resolvedSearchParams = await searchParams
  const queryString = toQueryString(resolvedSearchParams)
  redirect(queryString ? `/store/shop?${queryString}` : '/store/shop')
}
