/** Membership checkout route — wraps client in Suspense for `useSearchParams`. */
import { Suspense } from 'react'

import { MembershipCheckoutClient } from '@/components/customer/membership-checkout-client'

export default function MembershipCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Loading checkout…
        </div>
      }
    >
      <MembershipCheckoutClient />
    </Suspense>
  )
}
