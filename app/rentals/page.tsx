/** Rentals landing — image hero with overlapping category cards. */
'use client'

import { MenuLandingPage } from '@/components/customer/menu-landing-page'
import { RentalHowItWorks } from '@/components/customer/rental-how-it-works'
import { RentalsCategoriesGrid } from '@/components/customer/rentals-categories-grid'

export default function RentalsPage() {
  return (
    <MenuLandingPage menuKey="rentals" heroExtra={<RentalHowItWorks compact />}>
      <RentalsCategoriesGrid />
    </MenuLandingPage>
  )
}
