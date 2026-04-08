import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Client Insights | Reports',
  robots: { index: false, follow: false },
}

export default function ClientsReportLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
