import { CustomerNavRouteGuard } from '@/components/customer/customer-nav-route-guard'

export default function PlayLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <CustomerNavRouteGuard navKey="play">{children}</CustomerNavRouteGuard>
}
