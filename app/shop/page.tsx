/** Shop page — browse products and add to cart. */

import { Suspense } from 'react'

import { ShopPageClient } from '@/components/customer/shop-page-client'

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] bg-background" />}>
      <ShopPageClient />
    </Suspense>
  )
}
