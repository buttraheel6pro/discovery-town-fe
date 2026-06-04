import { CustomerNavRouteGuard } from '@/components/customer/customer-nav-route-guard'

export default function ShopOrderConfirmationLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <CustomerNavRouteGuard>{children}</CustomerNavRouteGuard>
}
