import { CustomerNavRouteGuard } from '@/components/customer/customer-nav-route-guard'

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <CustomerNavRouteGuard navKey="shop">{children}</CustomerNavRouteGuard>
}
