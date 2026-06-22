/** Shop landing — home-style category cards linking to per-category product pages. */
import type { Metadata } from 'next'

import { ShopLandingPage } from '@/components/customer/shop-landing-page'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Official Discovery Town merchandise, equipment, and essentials.',
}

export default function ShopPage() {
  return <ShopLandingPage />
}
