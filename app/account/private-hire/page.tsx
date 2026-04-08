import type { Metadata } from 'next'

import { AccountPrivateHireClient } from '@/app/account/private-hire/account-private-hire-client'

export const metadata: Metadata = {
  title: 'Private Hire Enquiries',
  robots: { index: false, follow: false },
}

export default function AccountPrivateHirePage() {
  return <AccountPrivateHireClient />
}
