import { CustomerNavRouteGuard } from '@/components/customer/customer-nav-route-guard'

export default function CafeLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <CustomerNavRouteGuard navKey="cafeFood">{children}</CustomerNavRouteGuard>
}
