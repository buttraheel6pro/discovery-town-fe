import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Referrals | Reports',
  robots: { index: false, follow: false },
}

export default function ReferralsReportLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
