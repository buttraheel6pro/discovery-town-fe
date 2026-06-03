import { CustomerNavRouteGuard } from '@/components/customer/customer-nav-route-guard'

export default function GymLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <CustomerNavRouteGuard navKey="gym">{children}</CustomerNavRouteGuard>
}
