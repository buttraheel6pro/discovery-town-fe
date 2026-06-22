/** Static shop sub-categories — mock fallback aligned with seed-shop.sql & shop-menu-client. */

interface StaticShopCategory {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly displayOrder: number
}

export const STATIC_SHOP_CONSUMER_CATEGORIES: readonly StaticShopCategory[] = [
  { id: 'pcat-shop-apparel', name: 'Apparel', slug: 'apparel', displayOrder: 1 },
  { id: 'pcat-shop-headwear', name: 'Headwear', slug: 'headwear', displayOrder: 2 },
  { id: 'pcat-shop-gear', name: 'Equipment & Gear', slug: 'equipment-gear', displayOrder: 3 },
  { id: 'pcat-shop-footwear', name: 'Footwear', slug: 'footwear', displayOrder: 4 },
  { id: 'pcat-shop-bags', name: 'Bags & Backpacks', slug: 'bags-backpacks', displayOrder: 5 },
  { id: 'pcat-shop-water', name: 'Bottles & Hydration', slug: 'bottles-hydration', displayOrder: 6 },
  { id: 'pcat-shop-toys', name: 'Toys & Games', slug: 'toys', displayOrder: 7 },
  { id: 'pcat-shop-accessories', name: 'Accessories', slug: 'accessories', displayOrder: 8 },
  { id: 'pcat-shop-wellness', name: 'Wellness', slug: 'wellness', displayOrder: 9 },
  { id: 'pcat-shop-gifts', name: 'Gift Sets', slug: 'gift-sets', displayOrder: 10 },
  { id: 'pcat-shop-clothes', name: 'Clothes', slug: 'clothes', displayOrder: 11 },
  { id: 'pcat-shop-furniture', name: 'Furniture', slug: 'furniture', displayOrder: 12 },
]
