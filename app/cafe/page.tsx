/** Cafe & Food landing — specials, categories, pickup/delivery CTAs. */
import type { Metadata } from 'next'

import { CustomerFooter } from '@/components/customer/footer'
import { CafeLandingClient } from '@/components/customer/cafe-landing-client'
import { CustomerNavbar } from '@/components/customer/navbar'

export const metadata: Metadata = {
  title: 'Cafe & Food',
  description: 'Order drinks, pastries, and cafe bites for pickup or delivery.',
}

export default function CafePage() {
  return (
    <>
      <CustomerNavbar />
      <main className="container mx-auto max-w-6xl px-4 py-8 md:px-6">
        <CafeLandingClient />
      </main>
      <CustomerFooter />
    </>
  )
}
