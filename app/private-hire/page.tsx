import type { Metadata } from 'next'

import { PrivateHirePageClient } from '@/app/private-hire/private-hire-page-client'

export const metadata: Metadata = {
  title: 'Private Hire & Venue Rental',
  description:
    'Book Discovery Town exclusively for your event. Perfect for birthday parties, corporate events and group sessions in Indianapolis.',
  openGraph: {
    title: 'Private Hire | Discovery Town',
    description:
      'Exclusive venue hire for parties, team days, and private sessions — enquire online.',
  },
}

export default function PrivateHirePage() {
  return <PrivateHirePageClient />
}
