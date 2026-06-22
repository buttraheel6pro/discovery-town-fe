/** Static cafe sub-categories — mock fallback aligned with mock-data & seed-cafe.sql. */

interface StaticCafeCategory {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly displayOrder: number
}

export const STATIC_CAFE_CONSUMER_CATEGORIES: readonly StaticCafeCategory[] = [
  { id: 'pcat-cafe-classic-hot', name: 'Classic Coffee (Hot)', slug: 'classic-coffee-hot', displayOrder: 1 },
  { id: 'pcat-cafe-cold-brew', name: 'Cold Brew', slug: 'cold-brew', displayOrder: 2 },
  { id: 'pcat-cafe-specialty-drinks', name: 'Specialty Drinks', slug: 'specialty-drinks', displayOrder: 3 },
  { id: 'pcat-cafe-hot-drinks', name: 'Hot Drinks', slug: 'hot-drinks', displayOrder: 4 },
  { id: 'pcat-cafe-cold-drinks', name: 'Cold Drinks', slug: 'cold-drinks', displayOrder: 5 },
  { id: 'pcat-cafe-frozen-treats', name: 'Frozen Treats', slug: 'frozen-treats', displayOrder: 6 },
  {
    id: 'pcat-cafe-pastries-baked',
    name: 'Pasteries & Baked Goods',
    slug: 'pasteries-baked-goods',
    displayOrder: 7,
  },
  { id: 'pcat-cafe-sweets-treats', name: 'Sweets & Treats', slug: 'sweets-treats', displayOrder: 8 },
  { id: 'pcat-cafe-baked-food', name: 'Baked Food', slug: 'baked-food', displayOrder: 9 },
  { id: 'pcat-cafe-pizza', name: 'Pizza', slug: 'pizza', displayOrder: 10 },
  { id: 'pcat-cafe-sandwiches', name: 'Sandwiches', slug: 'sandwiches', displayOrder: 11 },
  { id: 'pcat-cafe-toasts', name: 'Toasts', slug: 'toasts', displayOrder: 12 },
  { id: 'pcat-cafe-kids-corner', name: 'Kids Corner', slug: 'kids-corner', displayOrder: 13 },
  { id: 'pcat-cafe-salads', name: 'Salads', slug: 'salads', displayOrder: 14 },
  { id: 'pcat-cafe-snacks', name: 'Snacks', slug: 'snacks', displayOrder: 15 },
  { id: 'pcat-cafe-take-out-link', name: 'Take Out', slug: 'cafe-take-out', displayOrder: 16 },
]
