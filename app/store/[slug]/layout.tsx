'use client'

import { use } from 'react'

import { CustomerNavRouteGuard } from '@/components/customer/customer-nav-route-guard'
import { storeSlugToNavLabelKey } from '@/lib/customer-nav-route-access'

interface StoreSlugLayoutProps {
  readonly children: React.ReactNode
  readonly params: Promise<{
    slug: string
  }>
}

export default function StoreSlugLayout({
  children,
  params,
}: Readonly<StoreSlugLayoutProps>) {
  const { slug } = use(params)
  const navKey = storeSlugToNavLabelKey(slug)

  if (navKey == null) {
    return children
  }

  return <CustomerNavRouteGuard navKey={navKey}>{children}</CustomerNavRouteGuard>
}
