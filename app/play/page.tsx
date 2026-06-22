/** Play landing — image hero with overlapping category cards. */
'use client'

import { MenuLandingPage } from '@/components/customer/menu-landing-page'
import { PlayCategoriesGrid } from '@/components/customer/play-categories-grid'

export default function PlayPage() {
  return (
    <MenuLandingPage menuKey="play">
      <PlayCategoriesGrid />
    </MenuLandingPage>
  )
}
