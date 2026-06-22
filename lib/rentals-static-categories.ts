/** Static rentals sub-categories — mock/API fallback aligned with seed-rentals.sql & mock-data. */

interface StaticRentalsCategory {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly displayOrder: number
}

export const STATIC_RENTALS_CONSUMER_CATEGORIES: readonly StaticRentalsCategory[] = [
  { id: 'pcat-rentals-inflatables', name: 'Inflatables', slug: 'inflatables', displayOrder: 1 },
  {
    id: 'pcat-rentals-trains-mechanicals',
    name: 'Trains & Mechanicals',
    slug: 'trains-mechanicals',
    displayOrder: 2,
  },
  {
    id: 'pcat-rentals-interactive-play',
    name: 'Interactive Play',
    slug: 'interactive-play',
    displayOrder: 3,
  },
  { id: 'pcat-rentals-party-setup', name: 'Party Setup', slug: 'party-setup', displayOrder: 4 },
  { id: 'pcat-rentals-party-supply', name: 'Party Supply', slug: 'party-supply', displayOrder: 5 },
  { id: 'pcat-rentals-food-drinks', name: 'Food & Drinks', slug: 'food-drinks', displayOrder: 6 },
  { id: 'pcat-rentals-entertainers', name: 'Entertainers', slug: 'entertainers', displayOrder: 7 },
  { id: 'pcat-rentals-party-staff', name: 'Party Staff', slug: 'party-staff', displayOrder: 8 },
  { id: 'pcat-rentals-venue', name: 'Venue', slug: 'venue', displayOrder: 9 },
  {
    id: 'pcat-rentals-av-lighting-power',
    name: 'Audio-Visual, Lighting & Power',
    slug: 'audio-visual-lighting-power',
    displayOrder: 10,
  },
  { id: 'pcat-rentals-invitations', name: 'Invitations', slug: 'invitations', displayOrder: 11 },
  { id: 'pcat-rentals-photo-video', name: 'Photo-Video', slug: 'photo-video', displayOrder: 12 },
  { id: 'pcat-rentals-concessions', name: 'Concessions', slug: 'concessions', displayOrder: 13 },
]
