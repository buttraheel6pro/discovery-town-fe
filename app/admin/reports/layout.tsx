import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reports',
  robots: { index: false, follow: false },
}

export default function AdminReportsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="space-y-8">{children}</div>
}
