/** Copy and hero imagery for consumer menu landing pages. */

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
  readonly imageAlt: string
}

/** Full-bleed hero backgrounds (homepage explore cards reuse these paths). */
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
    imageAlt: 'Children playing at Discovery Town',
  },
  gym: {
    overline: 'Discover',
    title: 'Gym & Classes',
    description:
      'Age-based classes designed around real daily schedules — from infants to seniors.',
    imageAlt: 'Kids fitness and gymnastics class at Discovery Town',
  },
  events: {
    overline: 'Compete & Celebrate',
    title: 'Sports Events',
    description:
      'Tournaments, galas, private parties, and more. Register today and be part of the action.',
    imageAlt: 'Sports events and celebrations at Discovery Town',
  },
  learn: {
    overline: 'Discover',
    title: 'Learn',
    description:
      'Expert-led tutoring, test prep, and enrichment for every age — from K–12 core academics to adult graduate exams.',
    imageAlt: 'Learning and tutoring at Discovery Town',
  },
  shop: {
    overline: 'Store',
    title: 'Shop',
    description:
      'Official Discovery Town merchandise, equipment, and essentials.',
    imageAlt: 'Discovery Town shop merchandise',
  },
  cafe: {
    overline: 'Store',
    title: 'Cafe & Food',
    description: 'Great coffee, tasty treats, and comfy vibes for the whole family.',
    imageAlt: 'Cafe and food at Discovery Town',
  },
  rentals: {
    overline: 'Rentals',
    title: 'Plan your event rentals',
    description: 'Deliver to your door. Pick up at the venue. We handle the details.',
    imageAlt: 'Party and event rentals at Discovery Town',
  },
  gifts: {
    overline: 'Store',
    title: 'Gifts',
    description:
      'Curated gift bundles, experience vouchers, and treats for every occasion.',
    imageAlt: 'Gift bundles and treats at Discovery Town',
  },
}
