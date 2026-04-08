/** Order confirmation page — success state for shop checkout. */

import { Suspense } from 'react'

import { ShopOrderConfirmationClient } from '@/components/customer/shop-order-confirmation-client'

export default function ShopOrderConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] bg-background" />}>
      <ShopOrderConfirmationClient />
    </Suspense>
  )
}

