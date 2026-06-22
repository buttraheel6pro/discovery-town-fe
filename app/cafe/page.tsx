/** Cafe & Food landing — home-style category cards linking to per-category menu pages. */
import type { Metadata } from 'next'

import { CafeLandingPage } from '@/components/customer/cafe-landing-page'

export const metadata: Metadata = {
  title: 'Cafe & Food',
  description: 'Order drinks, pastries, and cafe bites for pickup or delivery.',
}

export default function CafePage() {
  return <CafeLandingPage />
}
