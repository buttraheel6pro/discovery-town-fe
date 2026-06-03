import { CustomerNavRouteGuard } from '@/components/customer/customer-nav-route-guard'

export default function RentalsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <CustomerNavRouteGuard navKey="rentals">{children}</CustomerNavRouteGuard>
}
