/** Gifts landing — home-style category cards linking to per-category gift pages. */
import type { Metadata } from 'next'

import { GiftsLandingPage } from '@/components/customer/gifts-landing-page'

export const metadata: Metadata = {
  title: 'Gifts',
  description: 'Curated gift bundles, experience vouchers, and treats for every occasion.',
}

export default function GiftsPage() {
  return <GiftsLandingPage />
}
