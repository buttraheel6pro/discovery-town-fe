/** Legacy cafe product detail route — forwards to the unified /shop detail page. */
import { redirect } from 'next/navigation'

interface CafeProductPageProps {
  readonly params: Promise<{ productId: string }>
}

export default async function CafeProductPage({ params }: Readonly<CafeProductPageProps>) {
  const { productId } = await params
  redirect(`/shop/${productId}`)
}
