import { CustomerNavRouteGuard } from '@/components/customer/customer-nav-route-guard'

export default function EventsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <CustomerNavRouteGuard navKey="events">{children}</CustomerNavRouteGuard>
}
