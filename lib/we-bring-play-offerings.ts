/** Catalog for We Bring Play To You — play page cards and off-site request products. */

export const WE_BRING_PLAY_CATEGORY_ID = 'cat-we-bring-play' as const

/** Legacy rows removed from customer play — may still exist in persisted scheduling state. */
export const RETIRED_WE_BRING_PLAY_SERVICE_IDS = [
  'svc-we-bring-play-mobile',
  'svc-we-bring-play-garden',
] as const

export interface WeBringPlayOffering {
  readonly serviceId: string
  readonly productId: string
  readonly name: string
  readonly description: string
  readonly imageUrl: string
  readonly basePrice: number
  readonly tags: readonly string[]
}

export const WE_BRING_PLAY_OFFERINGS: readonly WeBringPlayOffering[] = [
  {
    serviceId: 'svc-we-bring-inflatables',
    productId: 'prod-we-bring-inflatables',
    name: 'Inflatables',
    description:
      'Bouncy castles, slides, and inflatable play structures delivered and set up at your venue.',
    imageUrl:
      'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=1200&q=80',
    basePrice: 320,
    tags: ['inflatables', 'offsite'],
  },
  {
    serviceId: 'svc-we-bring-train',
    productId: 'prod-we-bring-train',
    name: 'Train',
    description:
      'Trackless train hire for birthdays, school fairs, and community events.',
    imageUrl:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&q=80',
    basePrice: 450,
    tags: ['train', 'offsite'],
  },
  {
    serviceId: 'svc-we-bring-interactive-games',
    productId: 'prod-we-bring-interactive-games',
    name: 'Interactive games',
    description:
      'Carnival-style games, relays, and hosted activities led by our play team.',
    imageUrl:
      'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=1200&q=80',
    basePrice: 240,
    tags: ['interactive-games', 'offsite'],
  },
  {
    serviceId: 'svc-we-bring-interactive-games-dance-floor',
    productId: 'prod-we-bring-interactive-games-dance-floor',
    name: 'Interactive games/dance floor',
    description:
      'Combined game stations with a portable dance floor, lighting, and music.',
    imageUrl:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80',
    basePrice: 380,
    tags: ['dance-floor', 'interactive-games', 'offsite'],
  },
  {
    serviceId: 'svc-we-bring-inflatable-screen-av',
    productId: 'prod-we-bring-inflatable-screen-av',
    name: 'Inflatable screen and AV',
    description:
      'Outdoor inflatable cinema screen with projector, sound, and technician support.',
    imageUrl:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80',
    basePrice: 420,
    tags: ['av', 'inflatable-screen', 'offsite'],
  },
  {
    serviceId: 'svc-we-bring-entertainers-characters',
    productId: 'prod-we-bring-entertainers-characters',
    name: 'Entertainers and characters',
    description:
      'Costumed characters, magicians, and hosts to energise your event programme.',
    imageUrl:
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200&q=80',
    basePrice: 295,
    tags: ['entertainers', 'characters', 'offsite'],
  },
  {
    serviceId: 'svc-we-bring-balloons',
    productId: 'prod-we-bring-balloons',
    name: 'Balloons',
    description:
      'Balloon arches, columns, drops, and custom colour styling for your theme.',
    imageUrl:
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&q=80',
    basePrice: 180,
    tags: ['balloons', 'offsite'],
  },
  {
    serviceId: 'svc-we-bring-party-setup-catering',
    productId: 'prod-we-bring-party-setup-catering',
    name: 'Party setup and catering',
    description:
      'Tables, tents, staging, and catering coordination for a turnkey celebration.',
    imageUrl:
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=80',
    basePrice: 520,
    tags: ['party-setup', 'catering', 'offsite'],
  },
] as const

export const WE_BRING_PLAY_PRODUCT_IDS: readonly string[] = WE_BRING_PLAY_OFFERINGS.map(
  (entry) => entry.productId,
)

export const WE_BRING_PLAY_SERVICE_IDS: readonly string[] = WE_BRING_PLAY_OFFERINGS.map(
  (entry) => entry.serviceId,
)

export function findWeBringPlayOfferingByServiceId(
  serviceId: string,
): WeBringPlayOffering | undefined {
  return WE_BRING_PLAY_OFFERINGS.find((entry) => entry.serviceId === serviceId)
}

export function findWeBringPlayOfferingByProductId(
  productId: string,
): WeBringPlayOffering | undefined {
  return WE_BRING_PLAY_OFFERINGS.find((entry) => entry.productId === productId)
}
