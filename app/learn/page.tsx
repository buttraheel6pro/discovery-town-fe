/** Learn landing — image hero with overlapping category cards. */
'use client'

import { LearnCategoriesGrid } from '@/components/customer/learn-categories-grid'
import { MenuLandingPage } from '@/components/customer/menu-landing-page'

export default function LearnPage() {
  return (
    <MenuLandingPage menuKey="learn">
      <LearnCategoriesGrid />
    </MenuLandingPage>
  )
}
