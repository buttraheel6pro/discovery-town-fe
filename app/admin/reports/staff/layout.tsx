import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Staff & Payroll | Reports',
  robots: { index: false, follow: false },
}

export default function StaffReportLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
