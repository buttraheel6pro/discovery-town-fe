import { CustomerNavRouteGuard } from '@/components/customer/customer-nav-route-guard'

export default function LearnLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <CustomerNavRouteGuard navKey="learn">{children}</CustomerNavRouteGuard>
}
