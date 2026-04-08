import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Revenue | Reports',
  robots: { index: false, follow: false },
}

export default function RevenueReportLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
