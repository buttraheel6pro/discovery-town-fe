/** Gifts landing page — image hero with overlapping category cards. */
'use client'

import { GiftsCategoriesGrid } from '@/components/customer/gifts-categories-grid'
import { MenuLandingPage } from '@/components/customer/menu-landing-page'

export function GiftsLandingPage() {
  return (
    <MenuLandingPage menuKey="gifts">
      <GiftsCategoriesGrid />
    </MenuLandingPage>
  )
}
