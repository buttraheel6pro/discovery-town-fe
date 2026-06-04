/** Blocks customer routes when the matching navbar section is hidden in admin settings. */
'use client'

import { notFound } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { type ReactNode } from 'react'

import { useCustomerNavLabels } from '@/hooks/use-customer-nav-labels'
import {
  isCustomerNavItemVisible,
  type CustomerNavLabelKey,
} from '@/lib/customer-nav-labels'
import {
  resolveCustomerNavKeyFromPathname,
  resolveProductNavLabelKey,
} from '@/lib/customer-nav-route-access'

interface CustomerNavRouteGuardProps {
  readonly children: ReactNode
  readonly navKey?: CustomerNavLabelKey
}

export function CustomerNavRouteGuard({
  children,
  navKey,
}: CustomerNavRouteGuardProps) {
  const pathname = usePathname()
  const { hidden, settingsLoaded } = useCustomerNavLabels()
  const resolvedKey = navKey ?? resolveCustomerNavKeyFromPathname(pathname)

  if (resolvedKey == null) {
    return children
  }

  if (!settingsLoaded) {
    return null
  }

  if (!isCustomerNavItemVisible(resolvedKey, hidden)) {
    notFound()
  }

  return children
}

interface CustomerNavProductRouteGuardProps {
  readonly children: ReactNode
  readonly productType: string | null | undefined
}

export function CustomerNavProductRouteGuard({
  children,
  productType,
}: CustomerNavProductRouteGuardProps) {
  const { hidden, settingsLoaded } = useCustomerNavLabels()
  const navKey = resolveProductNavLabelKey(productType)

  if (navKey == null) {
    return children
  }

  if (!settingsLoaded) {
    return null
  }

  if (!isCustomerNavItemVisible(navKey, hidden)) {
    notFound()
  }

  return children
}
