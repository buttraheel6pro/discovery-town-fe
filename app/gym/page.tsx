/** Gym landing — image hero with overlapping category cards. */
'use client'

import { GymCategoriesGrid } from '@/components/customer/gym-categories-grid'
import { MenuLandingPage } from '@/components/customer/menu-landing-page'

export default function GymPage() {
  return (
    <MenuLandingPage menuKey="gym">
      <GymCategoriesGrid />
    </MenuLandingPage>
  )
}
