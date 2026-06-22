import { CustomerNavRouteGuard } from '@/components/customer/customer-nav-route-guard'

export default function GiftsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <CustomerNavRouteGuard navKey="gifts">{children}</CustomerNavRouteGuard>
}
