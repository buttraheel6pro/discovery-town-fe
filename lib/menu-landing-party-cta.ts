/** Party planning CTA below menu landing highlight cards — per-module copy can override defaults. */

import type { MenuLandingHeroKey } from '@/lib/menu-landing-hero-config'

export type MenuLandingPartyCtaModuleKey = MenuLandingHeroKey | 'default'

export interface MenuLandingPartyCtaConfig {
  readonly title: string
  readonly description: string
  readonly email: string
  readonly bookNowHref: string
  readonly calendarHref: string
  readonly bookNowLabel: string
  readonly calendarLabel: string
  readonly imageSrc: string
  readonly imageAlt: string
}

const DEFAULT_MENU_LANDING_PARTY_CTA: MenuLandingPartyCtaConfig = {
  title: 'Ready to plan your party?',
  description: 'Have questions before booking? Email us anytime.',
  email: 'hello@discoverytown.com',
  bookNowHref: '/events/party-booking',
  calendarHref: '/events',
  bookNowLabel: 'Book Now',
  calendarLabel: 'View Party Calendar',
  imageSrc:
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1600&q=80',
  imageAlt: 'Party room at Discovery Town',
}

const MODULE_MENU_LANDING_PARTY_CTA: Partial<
  Record<MenuLandingPartyCtaModuleKey, MenuLandingPartyCtaConfig>
> = {
  // Future: per-module overrides
}

/** Returns party CTA content for a menu landing page. */
export function getMenuLandingPartyCta(
  moduleKey: MenuLandingPartyCtaModuleKey = 'default',
): MenuLandingPartyCtaConfig {
  return MODULE_MENU_LANDING_PARTY_CTA[moduleKey] ?? DEFAULT_MENU_LANDING_PARTY_CTA
}
