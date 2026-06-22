/** Cafe & Food landing page — image hero with overlapping category cards. */
'use client'

import { CafeCategoriesGrid } from '@/components/customer/cafe-categories-grid'
import { MenuLandingPage } from '@/components/customer/menu-landing-page'

export function CafeLandingPage() {
  return (
    <MenuLandingPage menuKey="cafe">
      <CafeCategoriesGrid />
    </MenuLandingPage>
  )
}
