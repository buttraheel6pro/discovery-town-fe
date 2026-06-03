import { CustomerNavRouteGuard } from '@/components/customer/customer-nav-route-guard'

export default function ClassesLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <CustomerNavRouteGuard navKey="gym">{children}</CustomerNavRouteGuard>
}
