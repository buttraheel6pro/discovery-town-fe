/** Shop landing page — image hero with overlapping category cards. */
'use client'

import { MenuLandingPage } from '@/components/customer/menu-landing-page'
import { ShopCategoriesGrid } from '@/components/customer/shop-categories-grid'

export function ShopLandingPage() {
  return (
    <MenuLandingPage menuKey="shop">
      <ShopCategoriesGrid />
    </MenuLandingPage>
  )
}
