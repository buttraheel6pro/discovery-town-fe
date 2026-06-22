/** Events landing — image hero with overlapping category cards. */
'use client'

import { EventsCategoriesGrid } from '@/components/customer/events-categories-grid'
import { MenuLandingPage } from '@/components/customer/menu-landing-page'

export default function EventsPage() {
  return (
    <MenuLandingPage menuKey="events">
      <EventsCategoriesGrid />
    </MenuLandingPage>
  )
}
