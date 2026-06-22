/** Copy for consumer menu landing pages — heroes use unified SVG art via menuKey. */

export type MenuLandingHeroKey =
  | 'play'
  | 'gym'
  | 'events'
  | 'learn'
  | 'shop'
  | 'cafe'
  | 'rentals'
  | 'gifts'

export interface MenuLandingHeroConfig {
  readonly overline: string
  readonly title: string
  readonly description: string
}

/** Homepage explore-card imagery (category grids use their own meta images). */
export const MENU_LANDING_HERO_IMAGES: Record<MenuLandingHeroKey, string> = {
  play: '/play.png',
  gym: '/gym-hero.jpg',
  events: '/Events.png',
  learn: '/learn-hero.jpg',
  shop: '/shop.png',
  cafe: '/cafe.png',
  rentals: '/rentals-hero.jpg',
  gifts: '/gifts-hero.jpg',
}

export const MENU_LANDING_HERO_CONFIG: Record<MenuLandingHeroKey, MenuLandingHeroConfig> = {
  play: {
    overline: 'Discover',
    title: 'Play',
    description:
      'Explore every way to play at Discovery Town, from open sessions to private experiences.',
  },
  gym: {
    overline: 'Discover',
    title: 'Gym & Classes',
    description:
      'Age-based classes designed around real daily schedules — from infants to seniors.',
  },
  events: {
    overline: 'Compete & Celebrate',
    title: 'Sports Events',
    description:
      'Tournaments, galas, private parties, and more. Register today and be part of the action.',
  },
  learn: {
    overline: 'Discover',
    title: 'Learn',
    description:
      'Expert-led tutoring, test prep, and enrichment for every age — from K–12 core academics to adult graduate exams.',
  },
  shop: {
    overline: 'Store',
    title: 'Shop',
    description:
      'Official Discovery Town merchandise, equipment, and essentials.',
  },
  cafe: {
    overline: 'Store',
    title: 'Cafe & Food',
    description: 'Great coffee, tasty treats, and comfy vibes for the whole family.',
  },
  rentals: {
    overline: 'Rentals',
    title: 'Plan your event rentals',
    description: 'Deliver to your door. Pick up at the venue. We handle the details.',
  },
  gifts: {
    overline: 'Store',
    title: 'Gifts',
    description:
      'Curated gift bundles, experience vouchers, and treats for every occasion.',
  },
}
