/** Public membership marketing page with SEO metadata. */
import type { Metadata } from 'next'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { MembershipMarketingClient } from '@/components/customer/membership-marketing-client'

export const metadata: Metadata = {
  title: 'Membership',
  description:
    'Discovery Town memberships — monthly, annual, and seasonal unlimited play plans for families.',
  openGraph: {
    title: 'Membership | Discovery Town',
    description:
      'Choose a family plan: 1-child, 2-children, or seasonal household passes with member perks.',
  },
}

export default function MembershipMarketingPage() {
  return (
    <>
      <CustomerNavbar />
      <main>
        <MembershipMarketingClient />
      </main>
      <CustomerFooter />
    </>
  )
}
