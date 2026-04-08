import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Invoices | Reports',
  robots: { index: false, follow: false },
}

export default function InvoicesReportLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
