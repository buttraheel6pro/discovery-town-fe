/** Shared consumer menu landing page — navbar, image hero, overlapping grid, footer. */
'use client'

import type { ReactNode } from 'react'

import { CustomerFooter } from '@/components/customer/footer'
import { MenuLandingHero } from '@/components/customer/menu-landing-hero'
import { CustomerNavbar } from '@/components/customer/navbar'
import {
  MENU_LANDING_HERO_CONFIG,
  type MenuLandingHeroKey,
} from '@/lib/menu-landing-hero-config'

export interface MenuLandingPageProps {
  readonly menuKey: MenuLandingHeroKey
  readonly children: ReactNode
  readonly heroExtra?: ReactNode
}

export function MenuLandingPage({
  menuKey,
  children,
  heroExtra,
}: Readonly<MenuLandingPageProps>) {
  const hero = MENU_LANDING_HERO_CONFIG[menuKey]

  return (
    <>
      <CustomerNavbar />
      <main>
        <MenuLandingHero menuKey={menuKey} {...hero} heroExtra={heroExtra}>
          {children}
        </MenuLandingHero>
      </main>
      <CustomerFooter />
    </>
  )
}
